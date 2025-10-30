import React from 'react'
import { register as registerPlayer, login as loginPlayer } from '../services/authService'

export default function AuthModal({ open, onClose, onAuthenticated }) {
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

  if (!open) return null

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

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <button
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <label style={styles.label}>
              <span style={styles.labelText}>Name</span>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label style={styles.label}>
            <span style={styles.labelText}>Email</span>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Password</span>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '360px',
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
    color: '#e5e7eb',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    borderBottom: '1px solid #374151',
    position: 'relative',
  },
  tab: {
    flex: 1,
    padding: '10px 12px',
    background: 'transparent',
    color: '#9ca3af',
    border: 'none',
    cursor: 'pointer',
  },
  tabActive: {
    color: '#e5e7eb',
    borderBottom: '2px solid #60a5fa',
  },
  close: {
    position: 'absolute',
    right: 8,
    top: 8,
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '16px',
  },
  form: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  labelText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  input: {
    padding: '10px 12px',
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: '6px',
    color: '#e5e7eb',
    outline: 'none',
  },
  error: {
    color: '#fca5a5',
    fontSize: '12px',
  },
  submit: {
    marginTop: '8px',
    padding: '10px 12px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
}


