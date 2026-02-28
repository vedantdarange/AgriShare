'use client'

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-white gap-4">
            <p className="text-red-400 font-semibold">Something went wrong in the app shell.</p>
            <pre className="text-xs text-stone-400 bg-stone-900 p-4 rounded-xl max-w-xl overflow-auto">{error.message}</pre>
            <button onClick={reset} className="bg-lime-400 text-stone-900 px-4 py-2 rounded-lg font-semibold text-sm">Try again</button>
        </div>
    )
}
