import React from 'react'
import { register as registerPlayer, login as loginPlayer } from '../services/authService'
import FantasyButton from './ui/FantasyButton'
import FantasyCard from './ui/FantasyCard'
import FantasyInput from './ui/FantasyInput'

/**
 * Reusable Auth Form Component
 * Can be used in both modal and page contexts
 */
export default function AuthForm({ mode, onModeChange, onAuthenticated, onClose }) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [fieldErrors, setFieldErrors] = React.useState({})

  React.useEffect(() => {
    setError('')
    setFieldErrors({})
    setPassword('')
    setName('')
  }, [mode])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})
    try {
      if (mode === 'signup') {
        const res = await registerPlayer({ name, email, password })
        onAuthenticated?.(res.player)
      } else {
        const res = await loginPlayer({ email, password })
        onAuthenticated?.(res.player)
      }
      onClose?.()
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors)
        setError(err.message || 'Please fix the errors below')
      } else {
        setError(err?.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-6 border-b-2 border-amber-700/50 pb-2">
        <button
          onClick={() => {
            onModeChange?.('login')
            setError('')
          }}
          className={`flex-1 py-2 px-4 text-sm font-bold transition-all duration-200 ${
            mode === 'login'
              ? 'text-amber-300 border-b-2 border-amber-500'
              : 'text-amber-400/70 hover:text-amber-300'
          }`}
          style={{
            textShadow: mode === 'login' ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          Login
        </button>
        <button
          onClick={() => {
            onModeChange?.('signup')
            setError('')
          }}
          className={`flex-1 py-2 px-4 text-sm font-bold transition-all duration-200 ${
            mode === 'signup'
              ? 'text-amber-300 border-b-2 border-amber-500'
              : 'text-amber-400/70 hover:text-amber-300'
          }`}
          style={{
            textShadow: mode === 'signup' ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <FantasyInput
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.name[0]}</p>
            )}
          </div>
        )}

        <div>
          <FantasyInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <FantasyInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.password[0]}</p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border-2 border-red-600/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <FantasyButton
          type="submit"
          disabled={loading}
          fullWidth
          className="mt-4"
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Login'}
        </FantasyButton>
      </form>
      </>
  )
}

