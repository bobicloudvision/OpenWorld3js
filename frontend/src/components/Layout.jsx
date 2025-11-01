import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ player, socketRef, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header player={player} socketRef={socketRef} onLogout={onLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

