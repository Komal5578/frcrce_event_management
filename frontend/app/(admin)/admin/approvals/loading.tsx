export default function Loading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <p className="sr-only" role="status">Loading</p>
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-control bg-border-card" />)}
    </div>
  );
}
