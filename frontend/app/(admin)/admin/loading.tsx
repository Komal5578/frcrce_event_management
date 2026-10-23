export default function Loading() {
  return (
    <div className="flex flex-col gap-12" aria-busy="true">
      <p className="sr-only" role="status">Loading the dashboard</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-[120px] animate-pulse rounded-control bg-border-card ${i === 0 ? "md:col-span-3" : ""}`} />)}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-control bg-border-card" />)}
      </div>
    </div>
  );
}
