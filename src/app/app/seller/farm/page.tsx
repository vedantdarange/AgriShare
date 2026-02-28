'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Image as ImageIcon, Save, Sprout, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'

interface FarmDetails {
    id?: string
    name: string
    area: string
    soil_type: string
    description: string
    crops_growing: string[]
    photos: string[]
}

const DEFAULT_FARM: FarmDetails = {
    name: '',
    area: '',
    soil_type: '',
    description: '',
    crops_growing: [],
    photos: []
}

export default function MyFarmPage() {
    const { user } = useUserStore()
    const toast = useToast()
    const [farm, setFarm] = useState<FarmDetails>(DEFAULT_FARM)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newCrop, setNewCrop] = useState('')

    useEffect(() => {
        if (user) fetchFarmDetails()
    }, [user])

    const fetchFarmDetails = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('farms')
            .select('*')
            .eq('seller_id', user!.id)
            .single()

        if (error && error.code !== 'PGRST116') { // Ignore row not found
            toast.error({ title: 'Error fetching farm details', description: error.message })
        } else if (data) {
            setFarm(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!farm.name.trim()) return toast.error({ title: 'Farm name is required' })

        setSaving(true)
        const farmData = {
            seller_id: user!.id,
            name: farm.name,
            area: farm.area,
            soil_type: farm.soil_type,
            description: farm.description,
            crops_growing: farm.crops_growing,
            photos: farm.photos
        }

        let query;
        if (farm.id) {
            query = supabase.from('farms').update(farmData).eq('id', farm.id)
        } else {
            query = supabase.from('farms').insert([farmData]).select().single()
        }

        const { data, error } = await query

        if (error) {
            toast.error({ title: 'Failed to save farm details', description: error.message })
        } else {
            toast.success({ title: 'Farm profile saved successfully!' })
            if (data && !farm.id) setFarm(data)
        }
        setSaving(false)
    }

    const addCrop = () => {
        if (!newCrop.trim() || farm.crops_growing.includes(newCrop.trim())) return
        setFarm(prev => ({ ...prev, crops_growing: [...prev.crops_growing, newCrop.trim()] }))
        setNewCrop('')
    }

    const removeCrop = (crop: string) => {
        setFarm(prev => ({ ...prev, crops_growing: prev.crops_growing.filter(c => c !== crop) }))
    }

    // Placeholder for real image upload (you would integrate storage here)
    const handlePhotoAdd = () => {
        const fakeUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}?w=800&q=80`
        // Instead of random text, use a realistic agriculture photo for demo
        const demoUrls = [
            "https://images.unsplash.com/photo-1592982537447-6f2a6a0d4c7b?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=400"
        ]
        const url = demoUrls[farm.photos.length % demoUrls.length]
        setFarm(prev => ({ ...prev, photos: [...prev.photos, url] }))
        toast.info({ title: 'Demo photo attached (Upload coming soon)' })
    }

    const removePhoto = (idx: number) => {
        setFarm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-lime-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea] pb-24">
            <div className="max-w-3xl mx-auto px-6 py-10">

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-lime-200 text-lime-800 rounded-2xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-800">My Farm</h1>
                        <p className="text-stone-500 mt-1">Showcase your farm to build trust with buyers</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm space-y-8"
                >
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-stone-800 border-b border-stone-100 pb-2">Basic Details</h2>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Farm Name *</label>
                            <input
                                value={farm.name}
                                onChange={e => setFarm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="E.g., Sunrise Organic Farm"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Farm Area</label>
                                <input
                                    value={farm.area}
                                    onChange={e => setFarm(prev => ({ ...prev, area: e.target.value }))}
                                    placeholder="E.g., 5 Acres / 2 Hectares"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Soil Type</label>
                                <input
                                    value={farm.soil_type}
                                    onChange={e => setFarm(prev => ({ ...prev, soil_type: e.target.value }))}
                                    placeholder="E.g., Black Cotton, Alluvial"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Farm Description</label>
                            <textarea
                                value={farm.description}
                                onChange={e => setFarm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Tell buyers about your farming practices, history, and the quality of your land..."
                                rows={4}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Crops Growing */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                            <Sprout className="w-5 h-5 text-lime-600" />
                            <h2 className="text-lg font-bold text-stone-800">Crops Currently Growing</h2>
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={newCrop}
                                onChange={e => setNewCrop(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addCrop()}
                                placeholder="E.g., Tomatoes, Basmati Rice..."
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-500 transition-all"
                            />
                            <button
                                onClick={addCrop}
                                className="px-6 py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        {farm.crops_growing.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {farm.crops_growing.map(crop => (
                                    <span key={crop} className="inline-flex items-center gap-1.5 bg-lime-100 text-lime-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                                        {crop}
                                        <button onClick={() => removeCrop(crop)} className="hover:text-red-500 transition-colors">
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Photos */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <h2 className="text-lg font-bold text-stone-800">Farm Photos</h2>
                            <span className="text-xs text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded-md">{farm.photos.length} / 5</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {farm.photos.map((photo, idx) => (
                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200 group bg-stone-100">
                                    <img src={photo} alt="Farm" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(idx)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            {farm.photos.length < 5 && (
                                <button
                                    onClick={handlePhotoAdd}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-lime-600 hover:border-lime-300 hover:bg-lime-50 transition-all bg-stone-50"
                                >
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="text-sm font-medium text-center px-4">Add Photo</span>
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-stone-400 mt-2">Displaying real farm photos increases buyer trust and order volume.</p>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-stone-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-lime-500/20 disabled:opacity-70 transition-all"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving Profile...' : 'Save Farm Profile'}
                        </button>
                    </div>

                </motion.div>
            </div>
        </div>
    )
}
