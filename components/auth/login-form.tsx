"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
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

  
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login form submitted with:", { email, password: "***" })
    setIsLoading(true)
    setError("") 
    try {
      console.log("Calling login function...")
      
      await login(email, password) 
      console.log("Login successful!")
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      console.error("Login error:", errorMessage, error)
      setError(errorMessage) 
      
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ConnectUp</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Connect with your friends instantly</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4"> {}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <button onClick={onToggle} className="text-green-600 dark:text-green-400 font-semibold hover:underline">
            Sign up
          </button>
        </p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Demo Account:</strong> Use demo@example.com / password
        </p>
      </div>
    </div>
  )
}
