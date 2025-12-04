"use client"

import { Phone, X, Video } from "lucide-react"
import { useEffect, useRef } from "react"

interface IncomingCallModalProps {
    callerName: string
    callerAvatar?: string
    callType: "audio" | "video"
    onAccept: () => void
    onReject: () => void
}

export default function IncomingCallModal({
    callerName,
    callerAvatar,
    callType,
    onAccept,
    onReject
}: IncomingCallModalProps) {
    const audioContextRef = useRef<AudioContext | null>(null)
    const oscillatorRef = useRef<OscillatorNode | null>(null)

    useEffect(() => {
        // Create ringtone using Web Audio API
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextRef.current = audioContext

            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.start()
            oscillatorRef.current = oscillator

            // Create pulsing effect
            const interval = setInterval(() => {
                if (gainNode && audioContext) {
                    const now = audioContext.currentTime
                    gainNode.gain.setValueAtTime(0.3, now)
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
                    gainNode.gain.setValueAtTime(0.3, now + 0.8)
                }
            }, 1600)

            return () => {
                clearInterval(interval)
                if (oscillatorRef.current) {
                    try {
                        oscillatorRef.current.stop()
                    } catch (e) {
                        // Already stopped
                    }
                }
                audioContext.close()
            }
        } catch (err) {
            console.log('Audio API not available:', err)
        }
    }, [])

    const handleAccept = () => {
        if (oscillatorRef.current && audioContextRef.current) {
            try {
                oscillatorRef.current.stop()
                audioContextRef.current.close()
            } catch (e) {
                // Already stopped
            }
        }
        onAccept()
    }

    const handleReject = () => {
        if (oscillatorRef.current && audioContextRef.current) {
            try {
                oscillatorRef.current.stop()
                audioContextRef.current.close()
            } catch (e) {
                // Already stopped
            }
        }
        onReject()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden bg-white">
                        {callerAvatar ? (
                            <img
                                src={callerAvatar}
                                alt={callerName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-4xl text-gray-600 font-bold">
                                    {callerName[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-1">{callerName}</h3>
                    <p className="text-white/90 flex items-center justify-center gap-2">
                        {callType === "video" ? (
                            <>
                                <Video size={18} />
                                Incoming video call
                            </>
                        ) : (
                            <>
                                <Phone size={18} />
                                Incoming call
                            </>
                        )}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="p-6 flex gap-4 justify-center">
                    {/* Reject button */}
                    <button
                        onClick={handleReject}
                        className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition flex flex-col items-center justify-center gap-1 text-white shadow-lg"
                    >
                        <X size={28} />
                        <span className="text-xs font-medium">Decline</span>
                    </button>

                    {/* Accept button */}
                    <button
                        onClick={handleAccept}
                        className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 transition flex flex-col items-center justify-center gap-1 text-white shadow-lg animate-pulse-slow"
                    >
                        {callType === "video" ? (
                            <>
                                <Video size={28} />
                                <span className="text-xs font-medium">Accept</span>
                            </>
                        ) : (
                            <>
                                <Phone size={28} />
                                <span className="text-xs font-medium">Accept</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    )
}
