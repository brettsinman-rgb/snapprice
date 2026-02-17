import Image from 'next/image';
import UploadCapture from '@/app/components/UploadCapture';
import AutoBrandTicker from '@/app/components/AutoBrandTicker';
import AdSlot from '@/app/components/AdSlot';
import { prisma } from '@/lib/db';

type PreviousSearchItem = {
  id: string;
  createdAt: Date;
  title: string;
  image: string;
  productUrl: string;
};

async function getPreviousSearches(): Promise<PreviousSearchItem[]> {
  try {
    const sessions = await prisma.searchSession.findMany({
      where: { status: 'complete' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        clicks: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            result: {
              select: {
                id: true,
                title: true,
                image: true,
                productUrl: true
              }
            }
          }
        },
        results: {
          take: 1,
          orderBy: [{ matchScore: 'desc' }, { price: 'asc' }],
          select: {
            id: true,
            title: true,
            image: true,
            productUrl: true
          }
        }
      }
    });

    return sessions
      .map((session) => {
        const mostRecentViewedResult = session.clicks[0]?.result;
        const fallbackTopResult = session.results[0];
        const chosenResult = mostRecentViewedResult ?? fallbackTopResult;
        if (!chosenResult?.productUrl) return null;
        return {
          id: chosenResult.id,
          createdAt: session.createdAt,
          title: chosenResult.title,
          image: chosenResult.image,
          productUrl: chosenResult.productUrl
        };
      })
      .filter((item): item is PreviousSearchItem => Boolean(item));
  } catch {
    return [];
  }
}

export default async function Home() {
  const previousSearches = await getPreviousSearches();

  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10">
          <div className="relative overflow-hidden rounded-[32px] border border-[#5ec2a4] bg-white/80 p-10 shadow-soft backdrop-blur fade-up">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#81dcc1]/10 blur-3xl" />
            <div className="absolute -right-20 top-10 h-40 w-40 rounded-full bg-[#81dcc1]/10 blur-3xl" />
            <div className="relative flex flex-col gap-5">
              <div className="mx-auto w-[250px]">
                <Image
                  src="/logos/TS.png"
                  alt="TS logo"
                  width={250}
                  height={80}
                  className="h-auto w-[250px] object-contain"
                  priority
                />
              </div>
              <AdSlot size="970x250" mobileSize="320x100" className="mt-2 pb-[15px]" />
              <h1 className="text-2xl font-semibold leading-[1.35] text-[#262626] md:text-4xl">
                <span className="text-3xl md:text-5xl">Searching for an OEM part?</span>
                <span className="mt-2 block font-medium">Parts Vertical discovers the best pricing for you instantly.</span>
              </h1>
              <p className="max-w-2xl text-[15px] text-[#5ec2a4] md:text-[17px]">
                Upload the vehicle part image or add the an OEM part number and let <span className="font-bold">Parts Vertical</span> scan the web for verified parts, delivering trusted listings with the best prices, intelligently sorted by best value.
              </p>
            </div>
            <div className="relative mt-10">
              <UploadCapture />
            </div>
          </div>
          {previousSearches.length > 0 ? (
            <section className="rounded-3xl border border-[#5ec2a4] bg-white/80 px-6 py-8 shadow-soft fade-up fade-up-delay-1">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#262626]/70">
                    Previous searches
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#262626]">Recent product matches</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {previousSearches.map((item) => (
                  <article
                    key={item.id}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#5ec2a4] bg-white"
                  >
                    <div className="relative h-36 w-full bg-white">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-[#262626]">{item.title}</h3>
                      <p className="text-[11px] text-[#262626]/70">
                        {new Intl.DateTimeFormat(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(item.createdAt)}
                      </p>
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center justify-center rounded-full bg-[#81dcc1]/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#5ec2a4]"
                      >
                        View listing
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          <AdSlot size="970x250" mobileSize="320x100" className="py-2" />
          <div className="rounded-3xl border border-[#5ec2a4] bg-white/80 px-6 py-10 shadow-soft fade-up fade-up-delay-1">
            <div className="mx-auto max-w-3xl text-center">
              <p className="display-font text-xl font-semibold text-[#262626] md:text-2xl">
                We scour <span className="font-bold text-[#5ec2a4]">hundreds of parts from trusted sellers</span>, so you can get back to chasing that oil leak.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { name: 'eBay', src: '/logos/ebay.png' },
                { name: 'Amazon', src: '/logos/amazon.png' },
                { name: 'AliExpress', src: '/logos/aliexpress.png' }
              ].map((brand) => (
                <div
                  key={brand.name}
                  className="flex h-20 items-center justify-center rounded-2xl border border-[#5ec2a4] bg-white px-6"
                >
                  <Image
                    src={brand.src}
                    alt={`${brand.name} logo`}
                    width={220}
                    height={60}
                    className={`${brand.name === 'Amazon' ? 'h-9 translate-y-[5px]' : 'h-10'} w-auto object-contain`}
                  />
                </div>
              ))}
            </div>
          </div>
          <AutoBrandTicker />
        </div>
      </div>
    </main>
  );
}
