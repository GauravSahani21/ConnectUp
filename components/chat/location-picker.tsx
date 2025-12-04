"use client"

import { useState } from "react"
import { MapPin, X } from "lucide-react"
import { toast } from "sonner"

interface LocationPickerProps {
    onShare: (location: { latitude: number; longitude: number; address?: string }) => void
    onCancel: () => void
}

export default function LocationPicker({ onShare, onCancel }: LocationPickerProps) {
    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleGetLocation = async () => {
        setLoading(true)
        setError(null)

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser")
            setLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords

                
                let address: string | undefined
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        {
                            headers: {
                                'User-Agent': 'ConnectUp/1.0'
                            }
                        }
                    )
                    const data = await response.json()
                    address = data.display_name
                } catch (err) {
                    console.error("Failed to get address:", err)
                    
                }

                setLocation({ latitude, longitude, address })
                setLoading(false)
            },
            (error) => {
                setLoading(false)
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError("Location access denied. Please enable location permissions in your browser settings.")
                        break
                    case error.POSITION_UNAVAILABLE:
                        setError("Location information unavailable")
                        break
                    case error.TIMEOUT:
                        setError("Location request timed out")
                        break
                    default:
                        setError("An unknown error occurred")
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

    const handleShare = () => {
        if (location) {
            onShare(location)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                {}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Location</h2>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                    >
                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {}
                <div className="p-6">
                    {!location && !loading && !error && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin size={40} className="text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Share your current location with this chat
                            </p>
                            <button
                                onClick={handleGetLocation}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                            >
                                Get My Location
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Getting your location...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X size={40} className="text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                            <button
                                onClick={handleGetLocation}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {location && (
                        <div>
                            {}
                            <div className="mb-4 rounded-lg overflow-hidden">
                                <img
                                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${location.longitude},${location.latitude})/${location.longitude},${location.latitude},14,0/400x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                                    alt="Location preview"
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        
                                        e.currentTarget.src = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`
                                    }}
                                />
                            </div>

                            {}
                            {location.address && (
                                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{location.address}</p>
                                </div>
                            )}

                            {}
                            <div className="mb-4 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            </div>

                            {}
                            <div className="flex gap-2">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                                >
                                    Share Location
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
