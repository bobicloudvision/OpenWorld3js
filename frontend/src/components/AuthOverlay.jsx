import React from 'react'
import { register as registerPlayer, login as loginPlayer } from '../services/authService'
import FantasyButton from './ui/FantasyButton'
import FantasyCard from './ui/FantasyCard'
import FantasyInput from './ui/FantasyInput'

export default function AuthOverlay({ open, onClose, onAuthenticated }) {
  const [mode, setMode] = React.useState('login') // 'login' | 'signup'
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setError('')
      setLoading(false)
      setPassword('')
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
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
      setError(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[2000] p-5"
      style={{
        backgroundImage: 'url(/images/bg-login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div 
        className="relative bg-gradient-to-b from-amber-950/95 via-yellow-950/95 to-amber-900/95 rounded-lg border-4 border-amber-600 max-w-[420px] w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 69, 19, 0.3), rgba(0, 0, 0, 0.85))',
          boxShadow: '0 0 50px rgba(217, 119, 6, 0.5), inset 0 0 30px rgba(139, 69, 19, 0.3)'
        }}
      >
        {/* Decorative corner elements */}
        <div className="absolute top-2 left-2 w-10 h-10 border-t-[3px] border-l-[3px] border-amber-500"></div>
        <div className="absolute top-2 right-2 w-10 h-10 border-t-[3px] border-r-[3px] border-amber-500"></div>
        <div className="absolute bottom-2 left-2 w-10 h-10 border-b-[3px] border-l-[3px] border-amber-500"></div>
        <div className="absolute bottom-2 right-2 w-10 h-10 border-b-[3px] border-r-[3px] border-amber-500"></div>

        {/* Header */}
        <div 
          className="relative p-6 border-b-[2px] border-amber-700/60 flex justify-between items-center"
          style={{
            background: 'linear-gradient(to bottom, rgba(139, 69, 19, 0.4), rgba(101, 67, 33, 0.2))',
            boxShadow: 'inset 0 1px 0 rgba(217, 119, 6, 0.3)'
          }}
        >
          <h2 
            className="m-0 text-amber-300 text-3xl font-bold"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.6)',
              letterSpacing: '2px'
            }}
          >
            {mode === 'login' ? 'Login' : 'Create Account'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <FantasyCard className="border-0 shadow-none bg-transparent">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 border-b-2 border-amber-700/50 pb-2">
          <button
            onClick={() => {
              setMode('login')
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
              setMode('signup')
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
            <FantasyInput
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          )}

          <FantasyInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <FantasyInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

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
          </FantasyCard>
        </div>
      </div>
    </div>
  )
}



