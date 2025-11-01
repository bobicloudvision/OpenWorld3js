import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthForm from '../components/AuthForm'

export default function AuthPage({ onAuthenticated }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Determine mode from URL path
  const initialMode = location.pathname === '/register' ? 'signup' : 'login'
  const [mode, setMode] = React.useState(initialMode)

  // Update mode when route changes
  React.useEffect(() => {
    const newMode = location.pathname === '/register' ? 'signup' : 'login'
    setMode(newMode)
  }, [location.pathname])

  const handleAuthenticated = (player) => {
    if (onAuthenticated) {
      onAuthenticated(player)
    }
    // Navigate to game or home after successful auth
    navigate('/game')
  }

  return (
    <div 
      className="relative flex items-center justify-center p-4 py-12 min-h-[calc(100vh-200px)] w-full"
      style={{
        backgroundImage: 'url(/images/bg-login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better readability */}
      <div 
        className="absolute inset-0 bg-black/70 -z-10"
      ></div>
      
      <div className="relative max-w-md w-full" style={{ zIndex: 10 }}>
        <div 
          className="relative bg-gradient-to-b from-amber-950/95 via-yellow-950/95 to-amber-900/95 rounded-lg border-4 border-amber-600 w-full shadow-2xl overflow-hidden"
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
            className="relative p-6 border-b-[2px] border-amber-700/60"
            style={{
              background: 'linear-gradient(to bottom, rgba(139, 69, 19, 0.4), rgba(101, 67, 33, 0.2))',
              boxShadow: 'inset 0 1px 0 rgba(217, 119, 6, 0.3)'
            }}
          >
            <h2 
              className="m-0 text-amber-300 text-3xl font-bold text-center"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.6)',
                letterSpacing: '2px'
              }}
            >
              {mode === 'login' ? 'Login' : 'Create Account'}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <AuthForm 
              mode={mode}
              onModeChange={setMode}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

