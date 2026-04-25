"use client"

import type React from "react"
import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Database } from "lucide-react"
import { useApp } from "@/context/app-context"

interface LoginFormProps {
  onToggle: () => void
}

export default function LoginForm({ onToggle }: LoginFormProps) {
  const [email, setEmail] = useState("demo@example.com")
  const [password, setPassword] = useState("password")
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDbError, setIsDbError] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setIsDbError(false)

    try {
      await login(email, password)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg)

      // Detect DB connectivity errors
      if (
        msg.toLowerCase().includes("database") ||
        msg.toLowerCase().includes("mongodb") ||
        msg.toLowerCase().includes("connect")
      ) {
        setIsDbError(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-[#128C7E] to-[#075E54] px-8 pt-8 pb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 shadow-lg">
          <span className="text-3xl">💬</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ConnectUp</h1>
        <p className="text-green-100 mt-1.5 text-sm">Connect with your friends instantly</p>
      </div>

      <div className="px-8 py-6 -mt-4 relative">
        {/* DB setup warning */}
        {isDbError && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <div className="flex items-start gap-3">
              <Database size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Connection error</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#2a3942] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent transition text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#2a3942] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent transition text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>

          {/* Generic error (non-DB) */}
          {error && !isDbError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </form>

        <div className="mt-5 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Don't have an account?{" "}
            <button
              onClick={onToggle}
              className="text-[#128C7E] dark:text-green-400 font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Demo badge */}
        <div className="mt-4 p-3 bg-[#f0f9f7] dark:bg-[#0d2018] border border-[#128C7E]/20 rounded-xl">
          <p className="text-xs text-[#128C7E] dark:text-green-400 text-center">
            <span className="font-semibold">Demo Account:</span> demo@example.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
