export function SkeletonCard() {
  return (
    <div className="bg-white border border-surface-100 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-surface-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-200 rounded w-3/4" />
            <div className="h-3 bg-surface-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-6 w-20 bg-surface-200 rounded" />
      </div>
      <div className="h-8 bg-surface-100 rounded-xl mt-3" />
    </div>
  )
}

export function SkeletonSummary() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface-100 rounded-2xl p-4 animate-pulse h-20" />
      ))}
    </div>
  )
}
