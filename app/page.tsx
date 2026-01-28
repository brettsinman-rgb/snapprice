import Image from 'next/image';
import UploadCapture from '@/app/components/UploadCapture';

export default function Home() {
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
