"use client"

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-1">
      {/* Bubble */}
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-[#202c33] shadow-sm border border-gray-100 dark:border-transparent w-fit">
        <span
          className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300"
          style={{
            animation: "typingDot 1.4s ease-in-out infinite",
            animationDelay: "0ms"
          }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300"
          style={{
            animation: "typingDot 1.4s ease-in-out infinite",
            animationDelay: "200ms"
          }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300"
          style={{
            animation: "typingDot 1.4s ease-in-out infinite",
            animationDelay: "400ms"
          }}
        />
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
