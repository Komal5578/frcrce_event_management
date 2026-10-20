export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="sr-only" role="status">Loading your events...</p>
      {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="h-28 animate-pulse rounded-control border border-border-card bg-panel" />)}
    </div>
  );
}
