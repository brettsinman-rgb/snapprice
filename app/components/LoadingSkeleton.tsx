export default function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="h-20 rounded-2xl bg-slate-900/60 shadow-soft" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-3xl bg-slate-900/60" />
        ))}
      </div>
    </div>
  );
}
