export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <p className="sr-only" role="status">Loading report</p>
      <div className="h-10 w-48 animate-pulse rounded-control bg-border-card" />
      <div className="h-6 w-96 animate-pulse rounded-control bg-border-card" />
      <div className="flex gap-3">
        <div className="h-11 w-36 animate-pulse rounded-control bg-border-card" />
        <div className="h-11 w-24 animate-pulse rounded-control bg-border-card" />
      </div>
      <div className="h-64 animate-pulse rounded-card bg-border-card" />
    </div>
  );
}
