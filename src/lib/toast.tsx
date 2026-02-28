'use client'

/**
 * FarmerConnect Rich Toast System
 * Built on top of sonner — adds rich JSX content, action buttons, images,
 * progress bars, promise chaining, and agricultural-specific helpers.
 */

import React from 'react'
import { toast as sonner } from 'sonner'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ToastAction {
    label: string
    onClick: () => void
    variant?: 'primary' | 'ghost'
}

export interface RichToastOptions {
    title: string
    description?: string
    image?: string
    avatar?: string
    action?: ToastAction
    secondaryAction?: ToastAction
    duration?: number
    /** If true the toast will not auto-dismiss */
    persistent?: boolean
}

export interface PromiseToastOptions<T> {
    loading: string
    success: string | ((data: T) => RichToastOptions | string)
    error: string | ((err: Error) => RichToastOptions | string)
}

// ─────────────────────────────────────────────
// Shared inner component helpers (rendered via sonner's JSX support)
// ─────────────────────────────────────────────

function SuccessIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <circle cx="10" cy="10" r="10" fill="#84cc16" />
            <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function ErrorIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <circle cx="10" cy="10" r="10" fill="#ef4444" />
            <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

function WarningIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M10 2L18.66 17H1.34L10 2z" fill="#f59e0b" />
            <path d="M10 8v4M10 14v.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

function InfoIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <circle cx="10" cy="10" r="10" fill="#3b82f6" />
            <path d="M10 7v.5M10 10v4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

function ActionBtn({ action, primary }: { action: ToastAction; primary?: boolean }) {
    return (
        <button
            onClick={action.onClick}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${primary
                ? 'bg-lime-500 text-white hover:bg-lime-600'
                : 'bg-black/10 text-stone-700 hover:bg-black/15'
                }`}
        >
            {action.label}
        </button>
    )
}

// ─────────────────────────────────────────────
// Rich Toast JSX Builders
// ─────────────────────────────────────────────

function buildSuccessContent(opts: RichToastOptions): React.ReactElement {
    return (
        <div className="flex items-start gap-3 w-full">
            {opts.image ? (
                <img src={opts.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-lime-200" />
            ) : (
                <div className="shrink-0 mt-0.5"><SuccessIcon /></div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 leading-tight">{opts.title}</p>
                {opts.description && <p className="text-xs text-stone-500 mt-0.5 leading-snug">{opts.description}</p>}
                {(opts.action || opts.secondaryAction) && (
                    <div className="flex gap-2 mt-2">
                        {opts.action && <ActionBtn action={opts.action} primary />}
                        {opts.secondaryAction && <ActionBtn action={opts.secondaryAction} />}
                    </div>
                )}
            </div>
        </div>
    )
}

function buildErrorContent(opts: RichToastOptions): React.ReactElement {
    return (
        <div className="flex items-start gap-3 w-full">
            <div className="shrink-0 mt-0.5"><ErrorIcon /></div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 leading-tight">{opts.title}</p>
                {opts.description && <p className="text-xs text-stone-500 mt-0.5 leading-snug">{opts.description}</p>}
                {opts.action && (
                    <div className="mt-2">
                        <ActionBtn action={opts.action} primary />
                    </div>
                )}
            </div>
        </div>
    )
}

function buildWarningContent(opts: RichToastOptions): React.ReactElement {
    return (
        <div className="flex items-start gap-3 w-full">
            <div className="shrink-0 mt-0.5"><WarningIcon /></div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 leading-tight">{opts.title}</p>
                {opts.description && <p className="text-xs text-stone-500 mt-0.5 leading-snug">{opts.description}</p>}
                {opts.action && (
                    <div className="mt-2">
                        <ActionBtn action={opts.action} />
                    </div>
                )}
            </div>
        </div>
    )
}

function buildInfoContent(opts: RichToastOptions): React.ReactElement {
    return (
        <div className="flex items-start gap-3 w-full">
            {opts.avatar ? (
                <img src={opts.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border-2 border-blue-200" />
            ) : (
                <div className="shrink-0 mt-0.5"><InfoIcon /></div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 leading-tight">{opts.title}</p>
                {opts.description && <p className="text-xs text-stone-500 mt-0.5 leading-snug">{opts.description}</p>}
                {opts.action && (
                    <div className="mt-2">
                        <ActionBtn action={opts.action} />
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Core styling for sonner Toaster
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
// Main useToast hook
// ─────────────────────────────────────────────

export const useToast = () => {
    const success = (opts: RichToastOptions | string) => {
        if (typeof opts === 'string') {
            sonner.success(opts)
            return
        }
        sonner.custom(() => buildSuccessContent(opts), {
            duration: opts.persistent ? Infinity : (opts.duration ?? 4000),
            style: {
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1px solid #bbf7d0',
                borderRadius: '14px',
                boxShadow: '0 4px 24px rgba(132,204,22,0.15), 0 2px 8px rgba(0,0,0,0.06)',
                padding: '14px 16px',
            },
        })
    }

    const error = (opts: RichToastOptions | string) => {
        if (typeof opts === 'string') {
            sonner.error(opts)
            return
        }
        sonner.custom(() => buildErrorContent(opts), {
            duration: opts.persistent ? Infinity : (opts.duration ?? 6000),
            style: {
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                border: '1px solid #fecaca',
                borderRadius: '14px',
                boxShadow: '0 4px 24px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.06)',
                padding: '14px 16px',
            },
        })
    }

    const warning = (opts: RichToastOptions | string) => {
        if (typeof opts === 'string') {
            sonner.warning(opts)
            return
        }
        sonner.custom(() => buildWarningContent(opts), {
            duration: opts.persistent ? Infinity : (opts.duration ?? 5000),
            style: {
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                border: '1px solid #fde68a',
                borderRadius: '14px',
                boxShadow: '0 4px 24px rgba(245,158,11,0.15), 0 2px 8px rgba(0,0,0,0.06)',
                padding: '14px 16px',
            },
        })
    }

    const info = (opts: RichToastOptions | string) => {
        if (typeof opts === 'string') {
            sonner.message(opts)
            return
        }
        sonner.custom(() => buildInfoContent(opts), {
            duration: opts.persistent ? Infinity : (opts.duration ?? 4000),
            style: {
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1px solid #bfdbfe',
                borderRadius: '14px',
                boxShadow: '0 4px 24px rgba(59,130,246,0.15), 0 2px 8px rgba(0,0,0,0.06)',
                padding: '14px 16px',
            },
        })
    }

    const promise = <T,>(
        p: Promise<T>,
        opts: PromiseToastOptions<T>
    ) => {
        return sonner.promise(p, {
            loading: opts.loading,
            success: (data) => {
                const s = typeof opts.success === 'function' ? opts.success(data) : opts.success
                return typeof s === 'string' ? s : s.title
            },
            error: (err) => {
                const e = typeof opts.error === 'function' ? opts.error(err as Error) : opts.error
                return typeof e === 'string' ? e : e.title
            },
        })
    }

    const dismiss = (id?: string | number) => sonner.dismiss(id)

    // ─────────────────────────────────────────
    // Agricultural-specific convenience methods
    // ─────────────────────────────────────────

    const addedToCart = (productName: string, qty: number, unit: string, image?: string, onViewCart?: () => void) => {
        success({
            title: 'Added to cart',
            description: `${qty}${unit} of ${productName}`,
            image,
            action: onViewCart ? { label: 'View Cart', onClick: onViewCart } : undefined,
            duration: 4000,
        })
    }

    const removedFromCart = (productName: string, onUndo?: () => void) => {
        warning({
            title: 'Removed from cart',
            description: productName,
            action: onUndo ? { label: 'Undo', onClick: onUndo } : undefined,
            duration: 3500,
        })
    }

    const cartCleared = (onRestore?: () => void) => {
        warning({
            title: 'Cart emptied',
            description: 'All items have been removed',
            action: onRestore ? { label: 'Restore', onClick: onRestore } : undefined,
            duration: 4000,
        })
    }

    const quantityUpdated = (qty: number) => {
        info({
            title: 'Quantity updated',
            description: `New quantity: ${qty}`,
        })
    }

    const orderPlaced = (orderNumber: string, onTrack?: () => void) => {
        success({
            title: 'Order placed!',
            description: `Order ${orderNumber} confirmed. The farmer will be notified.`,
            action: onTrack ? { label: 'Track Order', onClick: onTrack } : undefined,
            duration: 6000,
        })
    }

    const paymentFailed = (reason?: string, onRetry?: () => void) => {
        error({
            title: 'Payment failed',
            description: reason ?? 'Please try a different payment method.',
            action: onRetry ? { label: 'Retry', onClick: onRetry } : undefined,
            duration: 8000,
        })
    }

    const listingPublished = (onShare?: () => void) => {
        success({
            title: 'Listing is live!',
            description: 'Your produce is now visible to buyers.',
            action: onShare ? { label: 'Share', onClick: onShare } : undefined,
            duration: 5000,
        })
    }

    const listingUpdated = () => success('Changes saved')

    const listingDeleted = () => info('Listing removed')

    const listingStatusChanged = (newStatus: string) =>
        info({ title: 'Status updated', description: `Listing is now ${newStatus}` })

    const newOrderReceived = (amount: number, product: string, onAccept?: () => void) => {
        success({
            title: 'New order received!',
            description: `₹${amount.toLocaleString('en-IN')} for ${product}`,
            action: onAccept ? { label: 'View Order', onClick: onAccept } : undefined,
            persistent: true,
        })
    }

    const orderStatusUpdated = (status: string) =>
        success({ title: 'Order updated', description: `Status changed to ${status}` })

    const profileSaved = () => success('Profile saved')

    const messageSent = () => {
        // Subtle — no toast, just a quick info blip
        sonner.message('Message sent', { duration: 1500 })
    }

    const notSignedIn = (onSignIn?: () => void) => {
        warning({
            title: 'Sign in required',
            description: 'Please log in to continue.',
            action: onSignIn ? { label: 'Sign In', onClick: onSignIn } : undefined,
        })
    }

    const networkError = () => {
        error({
            title: 'Connection issue',
            description: 'Check your internet and try again.',
        })
    }

    const locationDetected = (location: string) => {
        info({ title: 'Location set', description: location })
    }

    const photoUploaded = (count: number, max: number) => {
        success({ title: `Photo uploaded (${count}/${max})`, duration: 2500 })
    }

    const roleSwitched = (role: string) => {
        success({ title: 'Role updated', description: `You are now a ${role}` })
    }

    return {
        // Generic
        success, error, warning, info, promise, dismiss,
        // Agricultural-specific
        addedToCart, removedFromCart, cartCleared, quantityUpdated,
        orderPlaced, paymentFailed,
        listingPublished, listingUpdated, listingDeleted,
        listingStatusChanged, newOrderReceived, orderStatusUpdated,
        profileSaved, messageSent, notSignedIn, networkError,
        locationDetected, photoUploaded, roleSwitched,
    }
}
