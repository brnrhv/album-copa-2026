"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../lib/supabase/client"
import Link from "next/link"
import { Turnstile } from "@marsidev/react-turnstile"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const validateUsername = (uname: string) => {
    const regex = /^[a-z0-9._-]{3,25}$/
    return regex.test(uname)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!validateUsername(username)) {
      setError("Username must be 3-25 characters, lowercase, numbers, dots, underscores or hyphens only.")
      setLoading(false)
      return
    }

    if (!captchaToken) {
      setError("Please complete the anti-robot verification.")
      setLoading(false)
      return
    }

    // Pass the captcha token and metadata to Supabase Sign Up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          username: username.toLowerCase(),
          full_name: username, // Use username as default display name
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

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
            <span className="material-symbols-outlined text-4xl mb-2 text-success">mail</span>
            <p className="font-label-lg text-lg font-bold mb-2">Verification Email Sent!</p>
            <p className="text-sm leading-relaxed">
              We have sent an activation link to <strong>{email}</strong>. 
              Please open your inbox and click the link to confirm your account before signing in.
            </p>
            <Link 
              href="/login"
              className="inline-block mt-6 bg-primary text-on-primary px-6 py-2 rounded-full font-label-lg hover:opacity-90 transition-opacity"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
            {error && (
              <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block font-label-md text-on-surface mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                required
                minLength={3}
                maxLength={25}
                className="w-full bg-surface-container border border-outline rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="e.g. player10"
              />
              <span className="text-xs text-on-surface-variant mt-1 block">
                3-25 characters: letters, numbers, . _ -
              </span>
            </div>

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

            <div className="my-2 flex justify-center">
              {siteKey ? (
                <Turnstile
                  siteKey={siteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setError("Failed to load bot protection. Please refresh.")}
                  onExpire={() => setCaptchaToken(null)}
                />
              ) : (
                <div className="text-xs text-error">
                  Turnstile Site Key not configured in environment variables.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-label-lg mt-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center font-body-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

