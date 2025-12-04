"use client"

import { useState } from "react"
import LoginForm from "./login-form"
import SignupForm from "./signup-form"

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false)

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md mx-4">
        {isSignup ? (
          <SignupForm onToggle={() => setIsSignup(false)} />
        ) : (
          <LoginForm onToggle={() => setIsSignup(true)} />
        )}
      </div>
    </div>
  )
}
