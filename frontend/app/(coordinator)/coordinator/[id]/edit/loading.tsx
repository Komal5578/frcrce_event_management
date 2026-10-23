export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="sr-only">Loading your event...</p>
      <div className="h-14 animate-pulse rounded-control bg-panel" />
      <div className="h-96 animate-pulse rounded-control bg-panel" />
    </div>
  );
}
