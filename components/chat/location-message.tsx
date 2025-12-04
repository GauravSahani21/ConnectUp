"use client"

import { MapPin, ExternalLink } from "lucide-react"

interface LocationMessageProps {
    latitude: number
    longitude: number
    address?: string
    isOwn?: boolean
}

export default function LocationMessage({ latitude, longitude, address, isOwn = false }: LocationMessageProps) {
    
    const getMapsLink = () => {
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

        if (isIOS) {
            return `maps://?q=${latitude},${longitude}`
        } else {
            return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        }
    }

    
    
    const zoom = 15
    const width = 400
    const height = 200

    
    const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&scale=2`

    
    const osmFallback = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${longitude},${latitude}&z=${zoom}&l=map&size=${width},${height}&pt=${longitude},${latitude},pm2rdm`

    return (
        <div className="max-w-xs">
            {}
            <div className="rounded-lg overflow-hidden mb-2 cursor-pointer group relative bg-gray-100 dark:bg-gray-700">
                <a href={getMapsLink()} target="_blank" rel="noopener noreferrer">
                    <img
                        src={mapImageUrl}
                        alt="Location map"
                        className="w-full h-48 object-cover transition-opacity group-hover:opacity-90"
                        onError={(e) => {
                            
                            e.currentTarget.src = osmFallback
                            e.currentTarget.onerror = () => {
                                
                                e.currentTarget.style.display = 'none'
                                const parent = e.currentTarget.parentElement?.parentElement
                                if (parent) {
                                    parent.innerHTML = `
                                        <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                            <div class="text-center text-gray-600 dark:text-gray-300">
                                                <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                </svg>
                                                <p class="text-sm font-medium">Location Preview</p>
                                                <p class="text-xs">Click to open in maps</p>
                                            </div>
                                        </div>
                                    `
                                }
                            }
                        }}
                    />
                    {}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition bg-white dark:bg-gray-800 rounded-full p-2">
                            <ExternalLink size={20} className="text-gray-700 dark:text-gray-300" />
                        </div>
                    </div>
                </a>
            </div>

            {}
            <div className="flex items-start gap-2">
                <MapPin size={16} className={`mt-0.5 flex-shrink-0 ${isOwn ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                    {address ? (
                        <>
                            <p className={`text-sm ${isOwn ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                                {address}
                            </p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                {latitude.toFixed(6)}, {longitude.toFixed(6)}
                            </p>
                        </>
                    ) : (
                        <p className={`text-sm ${isOwn ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                    )}
                </div>
            </div>

            {}
            <a
                href={getMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 inline-flex items-center gap-1 text-sm font-medium transition ${isOwn
                        ? 'text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200'
                        : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                    }`}
            >
                Get Directions
                <ExternalLink size={14} />
            </a>
        </div>
    )
}
