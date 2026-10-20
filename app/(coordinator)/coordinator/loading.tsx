export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="sr-only">Loading your events...</p>
      <div className="h-10 w-48 animate-pulse rounded-control bg-panel" />
      {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-control bg-panel" />)}
    </div>
  );
}
