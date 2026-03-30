export default function PlayerLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-8 w-48 rounded-md bg-white/5" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-24 rounded bg-white/5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4 h-52 bg-white/[0.02]" />
          <div className="card p-4 h-32 bg-white/[0.02]" />
          <div className="card p-4 h-40 bg-white/[0.02]" />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 h-48 bg-white/[0.02]" />
          <div className="card p-5 h-40 bg-white/[0.02]" />
          <div className="card p-5 h-64 bg-white/[0.02]" />
        </div>
      </div>
    </div>
  )
}
