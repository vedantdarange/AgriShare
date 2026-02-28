'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix missing marker icons in React-Leaflet
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

interface AddressMapProps {
    position: [number, number] | null
    onPositionChange: (pos: [number, number]) => void
    defaultCenter?: [number, number] // e.g., center of India
}

function LocationMarker({ position, onPositionChange }: AddressMapProps) {
    const map = useMapEvents({
        click(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng])
            map.flyTo(e.latlng, map.getZoom())
        },
        locationfound(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng])
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    useEffect(() => {
        // optionally try to locate on mount
        // map.locate() 
    }, [map])

    return position === null ? null : (
        <Marker position={position} icon={icon}>
            <Popup>Delivery Location Selected</Popup>
        </Marker>
    )
}

export default function AddressMap({ position, onPositionChange, defaultCenter = [20.5937, 78.9629] }: AddressMapProps) {
    return (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-stone-200 z-10 relative">
            <MapContainer
                center={position || defaultCenter}
                zoom={position ? 15 : 5}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} onPositionChange={onPositionChange} />
            </MapContainer>
        </div>
    )
}
