import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="w-full border-t-4 border-amber-900/80 mt-auto"
      style={{
        background: 'linear-gradient(to top, rgba(20, 15, 10, 0.98), rgba(10, 8, 6, 0.98))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(139, 69, 19, 0.4)'
      }}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          {/* Brand/About Section */}
          <div>
            <h3 
              className="text-amber-300 text-lg font-bold mb-3"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
            >
              ⚔️ OpenWorld3JS
            </h3>
            <p 
              className="text-amber-300/70 text-xs mb-3"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              Embark on epic adventures in a 3D multiplayer fantasy world. Battle enemies, explore zones, and become a legend.
            </p>
            <div className="text-amber-300/60 text-xs">
              <p style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                Version 1.0.0
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 
              className="text-amber-300 text-sm font-bold mb-3 uppercase tracking-wider"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              Quick Links
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  🏠 Home
                </Link>
              </li>
              <li>
                <Link
                  to="/game"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  🎮 Play Game
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  🏆 Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  🔐 Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 
              className="text-amber-300 text-sm font-bold mb-3 uppercase tracking-wider"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              Community
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  📢 Discord
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  📖 Wiki
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  💬 Forum
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  🐛 Report Bug
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 
              className="text-amber-300 text-sm font-bold mb-3 uppercase tracking-wider"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              Legal & Support
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  📄 Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  🔒 Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  ❓ FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-xs transition-colors block"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  📧 Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-amber-900/60 pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-amber-300/80 text-sm text-center md:text-left">
              <p style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                © {currentYear} OpenWorld3JS. All rights reserved.
              </p>
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-4 text-amber-300/60 text-xs">
              <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                Made with ⚔️ for adventurers
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

