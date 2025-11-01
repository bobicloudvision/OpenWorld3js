import React from 'react'

export default function Footer() {
  return (
    <footer 
      className="w-full border-t-4 border-amber-700/60 mt-auto"
      style={{
        background: 'linear-gradient(to top, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(217, 119, 6, 0.3)'
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-amber-300/80 text-sm text-center md:text-left">
            <p style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              © {new Date().getFullYear()} OpenWorld3JS. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <a
              href="#"
              className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              About
            </a>
            <a
              href="#"
              className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              Terms
            </a>
          </nav>

          {/* Version/Status */}
          <div className="text-amber-300/60 text-xs text-center md:text-right">
            <p style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

