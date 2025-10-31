import React, { useState, useEffect, useRef } from 'react'
import { parseEmoticons } from '../utils/emoticonMap'
import './Chat.css'

export default function Chat({ socket, currentPlayerId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    const handleChatMessage = (data) => {
      setMessages((prev) => [...prev, data])
    }

    const handleChatError = (error) => {
      console.error('Chat error:', error)
      // Optionally show error to user
    }

    socket.on('chat:message', handleChatMessage)
    socket.on('chat:error', handleChatError)

    return () => {
      socket.off('chat:message', handleChatMessage)
      socket.off('chat:error', handleChatError)
    }
  }, [socket])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !socket) return

    socket.emit('chat:message', { message: inputMessage.trim() })
    setInputMessage('')
    
    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!socket) return null

  return (
    <div className={`chat-container ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>Chat</h3>
        <button className="chat-toggle">
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">No messages yet. Start chatting!</div>
            ) : (
              messages.map((msg, index) => {
                const isOwnMessage = msg.playerId === currentPlayerId
                return (
                  <div
                    key={index}
                    className={`chat-message ${isOwnMessage ? 'own' : ''}`}
                  >
                    <div className="chat-message-header">
                      <span className="chat-player-name">{msg.playerName}</span>
                      <span className="chat-timestamp">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="chat-message-text">{parseEmoticons(msg.message)}</div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type a message... (Enter to send)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={500}
            />
            <button type="submit" className="chat-send-button" disabled={!inputMessage.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}

