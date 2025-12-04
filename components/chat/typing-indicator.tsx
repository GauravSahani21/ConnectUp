"use client"

export default function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 p-3 bg-white dark:bg-slate-800 rounded-lg rounded-tl-none shadow-sm w-fit">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
    )
}
