import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="w-full border-t-4 border-amber-900/80 mt-auto bg-gradient-to-t from-[rgba(20,15,10,0.98)] to-[rgba(10,8,6,0.98)] [box-shadow:0_-4px_20px_rgba(0,0,0,0.8),inset_0_-1px_0_rgba(139,69,19,0.4)]"
    >
      <div className="container mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand/About Section */}
          <div className="pr-4">
            <h3 
              className="text-amber-300 text-2xl font-bold mb-5 [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]"
            > 
              ⚔️ OpenWorld3JS
            </h3>
            <p 
              className="text-amber-300/70 text-sm mb-5 [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
            >
              Embark on epic adventures in a 3D multiplayer fantasy world. Battle enemies, explore zones, and become a legend.
            </p>
            <div className="text-amber-300/60 text-sm mt-4">
              <p className="[text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
                Version 1.0.0
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="pr-4">
            <h4 
              className="text-amber-300 text-base font-bold mb-5 uppercase tracking-wider [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
            >
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  🏠 Home
                </Link>
              </li>
              <li>
                <Link
                  to="/game"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  🎮 Play Game
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  🏆 Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  🔐 Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="pr-4">
            <h4 
              className="text-amber-300 text-base font-bold mb-5 uppercase tracking-wider [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
            >
              Community
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  📢 Discord
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  📖 Wiki
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  💬 Forum
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  🐛 Report Bug
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="pr-4">
            <h4 
              className="text-amber-300 text-base font-bold mb-5 uppercase tracking-wider [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
            >
              Legal & Support
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  📄 Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  🔒 Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  ❓ FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-300/70 hover:text-amber-200 text-sm transition-colors block [text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  📧 Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-amber-900/60 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <div className="text-amber-300/80 text-base text-center md:text-left">
              <p className="[text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
                © {currentYear} OpenWorld3JS. All rights reserved.
              </p>
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-4 text-amber-300/60">
              <span className="[text-shadow:1px_1px_2px_rgba(0,0,0,0.8)]">
                Made with ⚔️ for adventurers
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

