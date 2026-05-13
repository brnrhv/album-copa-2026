"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../lib/supabase/client"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Usually Supabase sends an email confirmation if it's enabled.
      // We will redirect to login after 2 seconds.
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
        </div>
        
        <h1 className="font-display-sm text-display-sm text-on-surface mb-2">Create Account</h1>
        <p className="font-body-md text-on-surface-variant mb-8 text-center">
          Start building your sticker collection today.
        </p>

        {success ? (
          <div className="w-full bg-secondary-container text-on-secondary-container p-6 rounded-xl text-center">
            <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
            <p className="font-label-lg">Account created successfully!</p>
            <p className="text-sm mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
            {error && (
              <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block font-label-md text-on-surface mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container border border-outline rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block font-label-md text-on-surface mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-surface-container border border-outline rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-label-lg mt-4 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center font-body-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
