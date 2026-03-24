function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: "var(--bg-elevated)" }}
    />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <SkeletonPulse className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ModelSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <SkeletonPulse className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonPulse className="h-3 w-28" />
        <SkeletonPulse className="h-2.5 w-16" />
      </div>
      <SkeletonPulse className="w-2 h-2 rounded-full flex-shrink-0" />
    </div>
  );
}

export function TaskSkeleton() {
  return (
    <div className="px-3 py-2 space-y-2">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-3 w-32" />
        <SkeletonPulse className="h-3 w-10" />
      </div>
      <SkeletonPulse className="h-1.5 w-full rounded-full" />
    </div>
  );
}
