"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Download } from "lucide-react"

interface AudioPlayerProps {
    audioUrl: string
    duration?: number
    isOwn?: boolean
}

export default function AudioPlayer({ audioUrl, duration, isOwn = false }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(duration || 0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const audioRef = useRef<HTMLAudioElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleLoadedMetadata = () => {
            setAudioDuration(audio.duration)
            setIsLoading(false)
        }

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        const handleCanPlay = () => {
            setIsLoading(false)
        }

        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("canplay", handleCanPlay)

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("ended", handleEnded)
            audio.removeEventListener("canplay", handleCanPlay)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current
        const progressBar = progressRef.current
        if (!audio || !progressBar) return

        const rect = progressBar.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        const newTime = percent * audioDuration
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const toggleSpeed = () => {
        const audio = audioRef.current
        if (!audio) return

        const speeds = [1, 1.5, 2]
        const currentIndex = speeds.indexOf(playbackSpeed)
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
        setPlaybackSpeed(nextSpeed)
        audio.playbackRate = nextSpeed
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

    
    const waveformBars = Array.from({ length: 40 }, (_, i) => {
        const height = Math.random() * 100
        const isPassed = (i / 40) * 100 <= progress
        return (
            <div
                key={i}
                className={`w-0.5 rounded-full transition-all duration-200 ${isPassed
                        ? isOwn
                            ? "bg-white"
                            : "bg-green-600 dark:bg-green-500"
                        : isOwn
                            ? "bg-green-700 dark:bg-green-800"
                            : "bg-gray-300 dark:bg-gray-600"
                    }`}
                style={{ height: `${Math.max(height, 20)}%` }}
            />
        )
    })

    return (
        <div className="flex items-center gap-2 min-w-[280px] py-1">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {}
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className={`flex-shrink-0 p-2 rounded-full transition-all ${isOwn
                        ? "bg-white/20 hover:bg-white/30 text-white"
                        : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                style={{ minWidth: "44px", minHeight: "44px" }}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                ) : (
                    <Play size={20} fill="currentColor" />
                )}
            </button>

            {}
            <div className="flex-1 flex flex-col gap-1">
                {}
                <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="flex items-center justify-between gap-0.5 h-8 cursor-pointer"
                >
                    {waveformBars}
                </div>

                {}
                <div className="flex items-center justify-between text-xs">
                    <span className={isOwn ? "text-white/90" : "text-gray-600 dark:text-gray-400"}>
                        {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </span>

                    {}
                    <button
                        onClick={toggleSpeed}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition ${isOwn
                                ? "text-white/90 hover:bg-white/20"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                    >
                        {playbackSpeed}x
                    </button>
                </div>
            </div>

            {}
            <a
                href={audioUrl}
                download
                className={`flex-shrink-0 p-2 rounded-full transition ${isOwn
                        ? "text-white/90 hover:bg-white/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                style={{ minWidth: "44px", minHeight: "44px" }}
                title="Download audio"
            >
                <Download size={20} />
            </a>
        </div>
    )
}
