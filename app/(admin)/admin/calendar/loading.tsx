export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <p className="sr-only" role="status">Loading the calendar</p>
      <div className="h-12 animate-pulse rounded-control bg-border-card" />
      <div className="h-96 animate-pulse rounded-control bg-border-card" />
    </div>
  );
}
