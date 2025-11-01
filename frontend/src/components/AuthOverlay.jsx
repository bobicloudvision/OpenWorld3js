import React from 'react'
import AuthForm from './AuthForm'

/**
 * AuthOverlay Component - Modal version of auth form
 * Used in GameApp for overlay authentication
 */
export default function AuthOverlay({ open, onClose, onAuthenticated }) {
  const [mode, setMode] = React.useState('login')

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
          {onClose && (
            <button
              onClick={onClose}
              className="bg-transparent border-2 border-amber-600/50 text-amber-300 text-xl cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-amber-700/30 hover:border-amber-500 transition-all duration-200"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <AuthForm 
            mode={mode}
            onModeChange={setMode}
            onAuthenticated={(player) => {
              onAuthenticated?.(player)
              onClose?.()
            }}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}



