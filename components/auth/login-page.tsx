"use client"

import { useState } from "react"
import LoginForm from "./login-form"
import SignupForm from "./signup-form"

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false)

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #111b21 0%, #0b141a 50%, #128C7E15 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #25D366 0%, transparent 70%)", transform: "translate(-30%, -30%)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #128C7E 0%, transparent 70%)", transform: "translate(30%, 30%)" }} />

      <div className="w-full max-w-md mx-4 relative z-10">
        {isSignup ? (
          <SignupForm onToggle={() => setIsSignup(false)} />
        ) : (
          <LoginForm onToggle={() => setIsSignup(true)} />
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-600 dark:text-gray-500 relative z-10">
        © 2025 ConnectUp · End-to-end encrypted
      </p>
    </div>
  )
}
