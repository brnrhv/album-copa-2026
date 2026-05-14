"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../lib/supabase/client"
import Link from "next/link"
import { Turnstile } from "@marsidev/react-turnstile"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("") // Can be Username or Email
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!captchaToken) {
      setError("Please complete the anti-robot verification.")
      setLoading(false)
      return
    }

    try {
      let emailToUse = identifier.trim()

      // If the identifier does not contain '@', treat it as a username
      if (!emailToUse.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailToUse.toLowerCase())
          .maybeSingle()

        if (profileError) {
          console.error("Profile lookup error details:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          throw new Error(`Database error: ${profileError.message || "Unable to search for username."} (Code: ${profileError.code || "unknown"})`)
        }

        if (!profile || !profile.email) {
          throw new Error("Username not found. Double check the spelling or log in with your email.")
        }

        emailToUse = profile.email
      }

      // Attempt login with the resolved email
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
        options: {
          captchaToken,
        }
      })

      if (loginError) {
        if (loginError.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("Please confirm your email address. We sent you an activation link when you registered.")
        }
        throw loginError
      }

      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  const siteKey = "0x4AAAAAADPMaXnB1zUazOwr"

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">sports_soccer</span>
        </div>
        
        <h1 className="font-display-sm text-display-sm text-on-surface mb-2">Welcome Back</h1>
        <p className="font-body-md text-on-surface-variant mb-8 text-center">
          Sign in to continue managing your World Cup 2026 album.
        </p>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label className="block font-label-md text-on-surface mb-1">Username or Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full bg-surface-container border border-outline rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
              placeholder="e.g. user123 or you@example.com"
            />
          </div>

          <div>
            <label className="block font-label-md text-on-surface mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-container border border-outline rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="my-2 flex justify-center">
            <Turnstile
              siteKey={siteKey}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setError("Failed to load bot protection. Please refresh.")}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full bg-primary text-on-primary py-3 rounded-full font-label-lg mt-4 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center font-body-sm text-on-surface-variant">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}

