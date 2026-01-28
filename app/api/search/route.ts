import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/lib/db';
import { getProviders } from '@/lib/providers';
import { dedupeResults, normalizeCandidates, sortResults } from '@/lib/normalize';
import { hashBuffer, hashString, sanitizeUrl } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';
import { uploadToSupabase } from '@/lib/storage';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp'];

export const runtime = 'nodejs';

async function resolveFinalUrl(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal
    }).catch(async () => {
      return fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    });
    clearTimeout(timeout);
    return response?.url ?? url;
  } catch {
    return url;
  }
}

function shouldResolveUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host.includes('serpapi.com')) return true;
    if (host.includes('google.com') || host.includes('googleusercontent.com')) return true;
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

  if (
    process.env.PROVIDER_IDS?.includes('ebay') &&
    (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET)
  ) {
    return NextResponse.json({ error: 'eBay credentials are not configured.' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('image');
  const query = String(formData.get('query') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const forceRefresh = formData.get('forceRefresh') === 'true';

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

  const demoMode = false;

  const existing = await prisma.searchSession.findFirst({
    where: {
      imageHash,
      createdAt: {
        gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      status: 'complete'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existing && !forceRefresh) {
    return NextResponse.json({ sessionId: existing.id, reused: true });
  }

  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
  let imageUrl = `${origin}/placeholder.svg`;

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
      imageUrl = `${origin}/uploads/${filename}`;
    }
  }

  const session = await prisma.searchSession.create({
    data: {
      imageUrl,
      imageHash,
      query: query || null,
      country: country || null,
      userAgent: request.headers.get('user-agent'),
      ipHash: ip === 'unknown' ? null : hashString(ip),
      status: 'processing'
    }
  });

  try {
    const providers = getProviders();
    const searchOptions = {
      country: country && country !== 'WORLD' ? country : undefined
    };
    const providerResults = await Promise.all(
      providers.map(async (provider) => {
        const candidates = query
          ? (await provider.searchByText?.(query, searchOptions)) ?? []
          : (await provider.searchByImage?.(imageUrl, searchOptions, imageBase64)) ?? [];
        const normalized = normalizeCandidates(candidates).map((item) => ({
          ...item,
          providerId: provider.id
        }));
        const raw = candidates
          .filter((item) => item.productUrl)
          .map((item) => [item.productUrl as string, item.raw] as const);
        return { providerId: provider.id, normalized, raw };
      })
    );

    const combined = dedupeResults(
      providerResults.flatMap((item) => item.normalized)
    );

    const sorted = sortResults(combined, 'cheapest')
      .map((item) => ({ ...item, productUrl: sanitizeUrl(item.productUrl) }))
      .filter((item) => item.productUrl);

    const finalResults = await Promise.all(
      sorted.map(async (item) => {
        if (!item.productUrl) return item;
        const resolvedUrl = shouldResolveUrl(item.productUrl)
          ? await resolveFinalUrl(item.productUrl)
          : item.productUrl;
        return { ...item, productUrl: resolvedUrl };
      })
    );

    const filteredResults = finalResults.filter((item) => {
      if (!item.productUrl) return false;
      try {
        const parsed = new URL(item.productUrl);
        if (parsed.hostname.includes('google.com') && parsed.pathname.includes('/search')) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    });

    const resultsToSave = filteredResults.length > 0 ? filteredResults : finalResults;

    if (resultsToSave.length === 0) {
      await prisma.searchSession.update({ where: { id: session.id }, data: { status: 'empty' } });
      return NextResponse.json({ sessionId: session.id, reused: false });
    }

    const rawLookup = new Map<string, unknown>();
    for (const providerResult of providerResults) {
      for (const [url, raw] of providerResult.raw) {
        rawLookup.set(`${providerResult.providerId}:${url}`, raw);
      }
    }

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

    return NextResponse.json({ sessionId: session.id, reused: false });
  } catch (error) {
    await prisma.searchSession.update({ where: { id: session.id }, data: { status: 'failed' } });
    return NextResponse.json({ error: 'Search provider failed. Please try again.' }, { status: 502 });
  }
}
