import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import dns from 'dns/promises';
import net from 'net';
import { prisma } from '@/lib/db';
import { getProviders } from '@/lib/providers';
import { dedupeResults, normalizeCandidates, sortResults } from '@/lib/normalize';
import { buildSearchQueryPlan } from '@/lib/search-query';
import { hashBuffer, hashString, sanitizeUrl } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';
import { uploadToSupabase } from '@/lib/storage';
import { createDevSession, saveDevResults, updateDevSessionStatus } from '@/lib/dev-session-store';
import { createClient } from '@/lib/supabase/server';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp'];
const DEBUG_SEARCH = process.env.PARTSSEEKR_DEBUG_SEARCH === 'true';
const MAX_REDIRECTS = 5;
const RESOLVABLE_PROVIDER_HOSTS = [
  'serpapi.com',
  'google.com',
  'googleusercontent.com',
  'googleadservices.com'
];

export const runtime = 'nodejs';

function debugSearch(message: string) {
  if (DEBUG_SEARCH && process.env.NODE_ENV !== 'production') {
    console.log(message);
  }
}

function isAllowedResolverHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return RESOLVABLE_PROVIDER_HOSTS.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

function isPrivateIp(ip: string) {
  if (net.isIP(ip) === 6) {
    const normalized = ip.toLowerCase();
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }

  if (net.isIP(ip) !== 4) return true;

  const parts = ip.split('.').map((part) => Number(part));
  const [a, b] = parts;
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function isSafeResolvableUrl(url: string, requireKnownHost = false) {
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) return false;

  const parsed = new URL(safeUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    hostname === '0.0.0.0'
  ) {
    return false;
  }

  if (requireKnownHost && !isAllowedResolverHost(hostname)) return false;
  if (net.isIP(hostname) && isPrivateIp(hostname)) return false;

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses.length > 0 && addresses.every((entry) => !isPrivateIp(entry.address));
  } catch {
    return false;
  }
}

function extractSafeRedirectUrl(url: string) {
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) return null;

  const parsed = new URL(safeUrl);
  if (parsed.hostname.includes('google.com') && parsed.pathname.includes('/url')) {
    return sanitizeUrl(parsed.searchParams.get('q') || parsed.searchParams.get('url'));
  }

  return safeUrl;
}

async function resolveFinalUrl(url: string) {
  const safeInitialUrl = sanitizeUrl(url);
  if (!safeInitialUrl || !(await isSafeResolvableUrl(safeInitialUrl, true))) return null;

  let currentUrl = extractSafeRedirectUrl(safeInitialUrl);
  if (!currentUrl || !(await isSafeResolvableUrl(currentUrl))) return null;

  for (let redirectCount = 0; redirectCount < MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal
      }).catch(async () => {
        return fetch(currentUrl as string, { method: 'GET', redirect: 'manual', signal: controller.signal });
      });
      clearTimeout(timeout);

      const location = response.headers.get('location');
      if (!location || response.status < 300 || response.status >= 400) {
        return sanitizeUrl(currentUrl);
      }

      const nextUrl = sanitizeUrl(new URL(location, currentUrl).toString());
      if (!nextUrl || !(await isSafeResolvableUrl(nextUrl))) return null;
      currentUrl = nextUrl;
    } catch (e) {
      clearTimeout(timeout);
      debugSearch(`[Search] Failed to resolve provider URL: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return sanitizeUrl(currentUrl);
    }
  }

  return sanitizeUrl(currentUrl);
}

function shouldResolveUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;
    if (isAllowedResolverHost(host)) return true;
    if (parsed.pathname.includes('/url')) return true;
    return false;
  } catch {
    return false;
  }
}

function getClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rate = rateLimit(ip);

  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get('image');
  const query = String(formData.get('query') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();

  if ((!file || !(file instanceof File)) && !query) {
    return NextResponse.json({ error: 'Provide an image or a search query.' }, { status: 400 });
  }

  if (file instanceof File) {
    if (file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Video files are not supported. Please upload a JPG, PNG, or WebP image.' }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPG, PNG, or WebP.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Max size is 8MB.' }, { status: 400 });
    }
  }

  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : null;
  const imageBase64 = buffer ? buffer.toString('base64') : undefined;
  const imageHash = buffer ? hashBuffer(buffer) : hashString(`text:${query.toLowerCase()}`);

  let imageUrl = `/placeholder.svg`;

  // Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Ensure user exists in local DB if authenticated
  if (user) {
    try {
      // First, try to find the user by email to handle ID mismatches
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! }
      });

      if (existingUser) {
        if (existingUser.id !== user.id) {
          // If ID changed (e.g. Supabase account recreation), update the record
          // We use a transaction to ensure sessions are preserved if possible, 
          // but since ID is a PK and FK target, we update it directly.
          await prisma.user.update({
            where: { email: user.email! },
            data: { id: user.id }
          });
        } else {
          // ID matches, just update email if needed (though it should be the same)
          await prisma.user.update({
            where: { id: user.id },
            data: { email: user.email! }
          });
        }
      } else {
        // No user with this email, safe to create
        await prisma.user.create({
          data: { id: user.id, email: user.email! }
        });
      }
    } catch (e) {
      console.error('Failed to sync user to local DB:', e);
      // We don't throw here to allow anonymous-like search if DB sync fails,
      // but the subsequent session creation might still fail if it tries to use user.id
    }
  }

  if (buffer && file instanceof File) {
    const filename = `${imageHash}-${Date.now()}.${file.type.split('/')[1]}`;
    const uploadedUrl = await uploadToSupabase(buffer, filename, file.type);
    if (uploadedUrl) {
      imageUrl = uploadedUrl;
    } else {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }
  }

  let sessionId: string | null = null;
  let useDatabase = true;

  try {
    let session: { id: string };
    try {
      const dbSession = await prisma.searchSession.create({
        data: {
          userId: user?.id || null,
          imageUrl,
          imageHash,
          query: query || null,
          country: country || null,
          userAgent: request.headers.get('user-agent'),
          ipHash: ip === 'unknown' ? null : hashString(ip),
          status: 'processing'
        }
      });
      session = { id: dbSession.id };
      useDatabase = true;
    } catch {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Database unavailable.');
      }
      const devSession = createDevSession({
        imageUrl,
        query: query || null,
        country: country || null,
        status: 'processing'
      });
      session = { id: devSession.id };
      useDatabase = false;
    }
    sessionId = session.id;

    const providers = getProviders().filter((provider) => {
      if (provider.id === 'ebay') {
        return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
      }
      if (provider.id === 'aliexpress') {
        return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET && process.env.ALIEXPRESS_TRACK_ID);
      }
      return true;
    });
    if (providers.length === 0) {
      if (useDatabase) {
        await prisma.searchSession.update({ where: { id: session.id }, data: { status: 'failed' } });
      } else {
        updateDevSessionStatus(session.id, 'failed');
      }
      return NextResponse.json({ error: 'No search providers are configured.' }, { status: 500 });
    }
    const searchOptions = {
      country: country && country !== 'WORLD' ? country : undefined
    };
    const queryPlan = query ? buildSearchQueryPlan(query) : null;
    if (queryPlan) {
      debugSearch(
        `[Search] Query classified as ${queryPlan.kind}; variants: ${queryPlan.variants.join(' | ')}`
      );
    }
    const providerResults = await Promise.all(
      providers.map(async (provider) => {
        try {
          const candidates = queryPlan
            ? (
                await Promise.all(
                  queryPlan.variants.map((variant) => provider.searchByText?.(variant, searchOptions) ?? [])
                )
              ).flat()
            : (await provider.searchByImage?.(imageUrl, searchOptions, imageBase64)) ?? [];
          
          debugSearch(`[Search] Provider ${provider.id} returned ${candidates.length} candidates`);
          
          const candidateLookup = new Map<string, (typeof candidates)[number]>();
          for (const candidate of candidates) {
            if (candidate.productUrl && !candidateLookup.has(candidate.productUrl)) {
              candidateLookup.set(candidate.productUrl, candidate);
            }
          }
          const uniqueCandidates = Array.from(candidateLookup.values());

          const normalized = normalizeCandidates(uniqueCandidates, queryPlan?.original).map((item) => ({
            ...item,
            providerId: provider.id
          }));
          
          debugSearch(`[Search] Provider ${provider.id} has ${normalized.length} normalized results`);
          
          const raw = uniqueCandidates
            .filter((item) => item.productUrl)
            .map((item) => [item.productUrl as string, item.raw] as const);
          return { providerId: provider.id, normalized, raw };
        } catch (e) {
          console.error(`[Search] Provider ${provider.id} failed:`, e);
          return { providerId: provider.id, normalized: [], raw: [] };
        }
      })
    );

    const combined = dedupeResults(
      providerResults.flatMap((item) => item.normalized)
    );
    debugSearch(`[Search] Combined results after dedupe: ${combined.length}`);

    const sorted = sortResults(combined, 'best')
      .map((item) => ({ ...item, productUrl: sanitizeUrl(item.productUrl) }))
      .filter((item) => item.productUrl);

    const finalResults = await Promise.all(
      sorted.map(async (item) => {
        if (!item.productUrl) return item;
        const resolvedUrl = shouldResolveUrl(item.productUrl)
          ? await resolveFinalUrl(item.productUrl)
          : item.productUrl;
        return { ...item, productUrl: sanitizeUrl(resolvedUrl) };
      })
    );
    debugSearch(`[Search] Results after URL resolution: ${finalResults.length}`);

    const filteredResults = finalResults.filter((item) => {
      if (!item.productUrl) return false;
      try {
        const parsed = new URL(item.productUrl);
        // Only filter out actual Google search result pages
        if (parsed.hostname.includes('google.com') && parsed.pathname.includes('/search')) {
          return false;
        }
        // Allow redirects that are likely direct product links
        if (parsed.hostname.includes('google.com') && parsed.pathname.includes('/url')) {
          const urlParam = parsed.searchParams.get('q') || parsed.searchParams.get('url');
          if (urlParam && !urlParam.includes('google.com/search')) {
             return true;
          }
          return false;
        }
        return true;
      } catch {
        return false;
      }
    });
    debugSearch(`[Search] Final filtered results: ${filteredResults.length}`);

    const resultsToSave = filteredResults.length > 0 ? filteredResults : finalResults;

    if (resultsToSave.length === 0) {
      debugSearch(`[Search] No results to save. providerResults count: ${providerResults.reduce((acc, p) => acc + p.normalized.length, 0)}, finalResults count: ${finalResults.length}, filteredResults count: ${filteredResults.length}`);
      if (useDatabase) {
        await prisma.searchSession.update({ where: { id: session.id }, data: { status: 'empty' } });
      } else {
        updateDevSessionStatus(session.id, 'empty');
      }
      return NextResponse.json({ sessionId: session.id });
    }

    debugSearch(`[Search] Saving ${resultsToSave.length} results to session ${session.id}`);

    const rawLookup = new Map<string, unknown>();
    for (const providerResult of providerResults) {
      for (const [url, raw] of providerResult.raw) {
        rawLookup.set(`${providerResult.providerId}:${url}`, raw);
      }
    }

    if (useDatabase) {
      await prisma.searchResult.createMany({
        data: resultsToSave.map((item) => ({
          sessionId: session.id,
          title: item.title,
          brand: item.brand,
          image: item.image,
          store: item.store,
          price: item.price,
          currency: item.currency,
          shippingPrice: item.shippingPrice,
          condition: item.condition,
          availability: item.availability,
          rating: item.rating,
          reviewCount: item.reviewCount,
          marketplace: (item as { marketplace?: string }).marketplace,
          productUrl: item.productUrl as string,
          matchScore: item.matchScore,
          rawProvider: (item as { providerId?: string }).providerId ?? 'unknown',
          rawJson: JSON.stringify(
            rawLookup.get(`${(item as { providerId?: string }).providerId}:${item.productUrl}`) ?? {}
          )
        }))
      });

      await prisma.searchSession.update({ where: { id: session.id }, data: { status: 'complete' } });
    } else {
      saveDevResults(
        session.id,
        resultsToSave.map((item) => ({
          id: `${session.id}-${Math.random().toString(36).slice(2, 10)}`,
          sessionId: session.id,
          title: item.title,
          brand: item.brand ?? null,
          image: item.image,
          store: item.store,
          price: item.price,
          currency: item.currency,
          shippingPrice: item.shippingPrice ?? null,
          condition: item.condition ?? null,
          availability: item.availability ?? null,
          rating: item.rating ?? null,
          reviewCount: item.reviewCount ?? null,
          marketplace: (item as { marketplace?: string }).marketplace ?? null,
          productUrl: item.productUrl as string,
          matchScore: item.matchScore,
          rawProvider: (item as { providerId?: string }).providerId ?? 'unknown',
          rawJson: JSON.stringify(
            rawLookup.get(`${(item as { providerId?: string }).providerId}:${item.productUrl}`) ?? {}
          )
        }))
      );
      updateDevSessionStatus(session.id, 'complete');
    }

    return NextResponse.json({ sessionId: session.id });
  } catch {
    if (sessionId) {
      if (useDatabase) {
        await prisma.searchSession.update({ where: { id: sessionId }, data: { status: 'failed' } }).catch(() => {});
      } else {
        updateDevSessionStatus(sessionId, 'failed');
      }
      return NextResponse.json({ error: 'Search provider failed. Please try again.' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Database unavailable. Check DATABASE_URL and Supabase credentials.' }, { status: 503 });
  }
}
