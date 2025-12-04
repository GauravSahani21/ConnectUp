"use client"

import { useEffect, useState, useRef } from "react"
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Volume2, VolumeX } from "lucide-react"

interface CallScreenProps {
    callType: "audio" | "video"
    callerName: string
    callerAvatar?: string
    isOutgoing: boolean
    onEndCall: (duration: number) => void
    localStream?: MediaStream
    remoteStream?: MediaStream
}

export default function CallScreen({
    callType,
    callerName,
    callerAvatar,
    isOutgoing,
    onEndCall,
    localStream,
    remoteStream
}: CallScreenProps) {
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [isSpeakerOn, setIsSpeakerOn] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [isConnected, setIsConnected] = useState(false)
    const callStartTimeRef = useRef<number | null>(null)

    useEffect(() => {
        if (remoteStream) {
            setIsConnected(true)
            callStartTimeRef.current = Date.now()
        }
    }, [remoteStream])

    useEffect(() => {
        if (!isConnected) return

        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [isConnected])

    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted
            })
        }
    }, [isMuted, localStream])

    useEffect(() => {
        if (localStream && callType === "video") {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOff
            })
        }
    }, [isVideoOff, localStream, callType])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-green-600 to-green-800 dark:from-green-700 dark:to-green-900 flex flex-col items-center justify-between p-8">
            {}
            {callType === "video" && (
                <>
                    {}
                    <div className="absolute inset-0">
                        {remoteStream ? (
                            <video
                                autoPlay
                                playsInline
                                ref={video => {
                                    if (video && remoteStream) {
                                        video.srcObject = remoteStream
                                    }
                                }}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <div className="text-center">
                                    <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                                        <span className="text-5xl text-white">
                                            {callerName[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-white text-xl">{callerName}</p>
                                    <p className="text-gray-300 mt-2">
                                        {isOutgoing ? "Calling..." : "Connecting..."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {}
                    <div className="absolute top-4 right-4 w-32 h-40 rounded-lg overflow-hidden shadow-2xl z-10 bg-gray-900">
                        {localStream && !isVideoOff ? (
                            <video
                                autoPlay
                                playsInline
                                muted
                                ref={video => {
                                    if (video && localStream) {
                                        video.srcObject = localStream
                                    }
                                }}
                                className="w-full h-full object-cover mirror"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <VideoOff className="text-gray-400" size={32} />
                            </div>
                        )}
                    </div>
                </>
            )}

            {}
            {callType === "audio" && (
                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center mb-6 shadow-2xl">
                        {callerAvatar ? (
                            <img
                                src={callerAvatar}
                                alt={callerName}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-6xl text-white font-bold">
                                {callerName[0].toUpperCase()}
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-semibold text-white mb-2">{callerName}</h2>
                    <p className="text-xl text-white/80">
                        {isConnected ? formatDuration(callDuration) : isOutgoing ? "Calling..." : "Incoming call..."}
                    </p>
                </div>
            )}

            {}
            <div className={`flex gap-6 items-center justify-center ${callType === "video" ? "relative z-10 mb-8" : ""}`}>
                {}
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition ${isMuted
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-white/20 hover:bg-white/30 backdrop-blur-lg"
                        }`}
                >
                    {isMuted ? (
                        <MicOff className="text-white" size={24} />
                    ) : (
                        <Mic className="text-white" size={24} />
                    )}
                </button>

                {}
                {callType === "video" && (
                    <button
                        onClick={() => setIsVideoOff(!isVideoOff)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition ${isVideoOff
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-white/20 hover:bg-white/30 backdrop-blur-lg"
                            }`}
                    >
                        {isVideoOff ? (
                            <VideoOff className="text-white" size={24} />
                        ) : (
                            <Video className="text-white" size={24} />
                        )}
                    </button>
                )}

                {}
                <button
                    onClick={() => onEndCall(callDuration)}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-2xl"
                >
                    <PhoneOff className="text-white" size={24} />
                </button>

                {}
                {callType === "audio" && (
                    <button
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-lg flex items-center justify-center transition"
                    >
                        {isSpeakerOn ? (
                            <Volume2 className="text-white" size={24} />
                        ) : (
                            <VolumeX className="text-white" size={24} />
                        )}
                    </button>
                )}
            </div>

            <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </div>
    )
}
