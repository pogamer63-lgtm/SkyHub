'use client'

import { useEffect } from 'react'

export default function PlayerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[SkyHub] Player error:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="card p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => unstable_retry()}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-white/10 hover:border-white/30 px-5 py-2 text-sm font-medium text-slate-300 transition-colors"
          >
            ← Search Again
          </a>
        </div>
      </div>
    </div>
  )
}
