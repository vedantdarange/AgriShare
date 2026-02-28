'use client'

import dynamic from 'next/dynamic'
import loadingJson from '../../public/loading.json'

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface LottieLoaderProps {
    /** Size in px (both width and height). Defaults to 120 */
    size?: number
    /** Full-screen overlay mode */
    fullScreen?: boolean
    /** Optional message below animation */
    message?: string
    /** Custom wrapper class */
    className?: string
}

export default function LottieLoader({
    size = 120,
    fullScreen = false,
    message,
    className,
}: LottieLoaderProps) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Lottie
                animationData={loadingJson}
                loop
                autoplay
                style={{ width: size, height: size }}
                rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
            />
            {message && (
                <p className="text-stone-400 text-sm font-medium animate-pulse">{message}</p>
            )}
        </div>
    )

    if (fullScreen) {
        return (
            <div
                className={
                    className ??
                    'fixed inset-0 z-[200] flex items-center justify-center bg-stone-950'
                }
            >
                {content}
            </div>
        )
    }

    return (
        <div className={className ?? 'flex items-center justify-center'}>
            {content}
        </div>
    )
}
