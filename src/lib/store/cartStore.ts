import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
    id: string
    product_id: string
    seller_id: string
    title: string
    variety?: string
    price_per_unit: number
    unit: string
    quantity: number
    image?: string
    seller_name: string
    available_quantity: number
}

interface CartStore {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
    removeItem: (product_id: string) => void
    updateQty: (product_id: string, quantity: number) => void
    clearCart: () => void
    totalItems: () => number
    totalAmount: () => number
    itemsBySeller: () => Record<string, CartItem[]>
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                set((state) => {
                    const existing = state.items.find((i) => i.product_id === item.product_id)
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.product_id === item.product_id
                                    ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), item.available_quantity) }
                                    : i
                            ),
                        }
                    }
                    return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] }
                })
            },

            removeItem: (product_id) =>
                set((state) => ({ items: state.items.filter((i) => i.product_id !== product_id) })),

            updateQty: (product_id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(product_id)
                    return
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product_id === product_id ? { ...i, quantity } : i
                    ),
                }))
            },

            clearCart: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

            totalAmount: () =>
                get().items.reduce((sum, i) => sum + i.price_per_unit * i.quantity, 0),

            itemsBySeller: () => {
                const grouped: Record<string, CartItem[]> = {}
                get().items.forEach((item) => {
                    if (!grouped[item.seller_id]) grouped[item.seller_id] = []
                    grouped[item.seller_id].push(item)
                })
                return grouped
            },
        }),
        {
            name: 'farmer-cart',
            skipHydration: true,
        }
    )
)
