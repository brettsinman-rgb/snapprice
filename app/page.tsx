import Image from 'next/image';
import UploadCapture from '@/app/components/UploadCapture';
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
      take: 8,
      include: {
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
        const firstResult = session.results[0];
        if (!firstResult?.productUrl) return null;
        return {
          id: firstResult.id,
          createdAt: session.createdAt,
          title: firstResult.title,
          image: firstResult.image,
          productUrl: firstResult.productUrl
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
          <div className="relative overflow-hidden rounded-[32px] border border-emerald-200/10 bg-white/5 p-10 shadow-soft backdrop-blur fade-up">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-20 top-10 h-40 w-40 rounded-full bg-lime-300/10 blur-3xl" />
            <div className="relative flex flex-col gap-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/30 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                SnapPrice - Price intelligence
              </span>
              <h1 className="text-4xl font-semibold text-white md:text-6xl">
                Snap an OEM part.
                <span className="block">Discover best pricing instantly.</span>
              </h1>
              <p className="max-w-2xl text-[15px] text-emerald-100/80 md:text-[17px]">
                Upload or capture an OEM part photo and let SnapPrice scan the web for verified parts, delivering trusted listings with the best prices and free postage, intelligently sorted by best value.
              </p>
            </div>
            <div className="relative mt-10">
              <UploadCapture />
            </div>
          </div>
          {previousSearches.length > 0 ? (
            <section className="rounded-3xl border border-emerald-200/10 bg-white/5 px-6 py-8 shadow-soft fade-up fade-up-delay-1">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                    Previous searches
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Recent product matches</h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {previousSearches.map((item) => (
                  <article
                    key={item.id}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-200/10 bg-slate-900/50"
                  >
                    <div className="relative h-36 w-full bg-white">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-contain p-4"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-emerald-50">{item.title}</h3>
                      <p className="text-[11px] text-emerald-100/60">
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
                        className="mt-auto inline-flex items-center justify-center rounded-full bg-lime-300/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-lime-200"
                      >
                        View listing
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          <div className="rounded-3xl border border-emerald-200/10 bg-white/5 px-6 py-10 shadow-soft fade-up fade-up-delay-1">
            <div className="mx-auto max-w-3xl text-center">
              <p className="display-font text-xl font-semibold text-white md:text-2xl">
                We scour <span className="font-bold text-lime-300">hundreds of parts from trusted sellers</span>, so you can get back to chasing that oil leak.
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
                  className="flex h-20 items-center justify-center rounded-2xl border border-emerald-200/10 bg-white px-6"
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
        </div>
      </div>
    </main>
  );
}
