import React, { useState, useEffect, useRef } from 'react'
import { parseEmoticons } from '../utils/emoticonMap'
import FantasyButton from './ui/FantasyButton'
import FantasyInput from './ui/FantasyInput'
import FantasyPanel from './ui/FantasyPanel'

export default function Chat({ socket, currentPlayerId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    const handleChatMessage = (data) => {
      setMessages((prev) => {
        // Avoid duplicates by checking if message already exists (by timestamp and playerId)
        const exists = prev.some(
          (msg) => msg.timestamp === data.timestamp && msg.playerId === data.playerId && msg.message === data.message
        )
        if (exists) return prev
        return [...prev, data]
      })
    }

    const handleChatHistory = (history) => {
      // Load chat history when received
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history)
        // Scroll to bottom after loading history
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }, 100)
      }
    }

    const handleChatError = (error) => {
      console.error('Chat error:', error)
      // Optionally show error to user
    }

    socket.on('chat:message', handleChatMessage)
    socket.on('chat:history', handleChatHistory)
    socket.on('chat:error', handleChatError)

    // Request chat history when socket is ready (with small delay to ensure handlers are registered)
    const requestHistory = () => {
      socket.emit('chat:history:request')
    }
    
    // Small delay to ensure chat handlers are registered after authentication
    const timeoutId = setTimeout(requestHistory, 100)

    return () => {
      clearTimeout(timeoutId)
      socket.off('chat:message', handleChatMessage)
      socket.off('chat:history', handleChatHistory)
      socket.off('chat:error', handleChatError)
    }
  }, [socket])

  // Auto-scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !socket) return

    socket.emit('chat:message', { message: inputMessage.trim() })
    setInputMessage('')
  }

  const handleKeyPress = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleKeyDown = (e) => {
    e.stopPropagation()
    // Prevent default for certain keys that might interfere with game controls
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault()
    }
  }

  const handleKeyUp = (e) => {
    e.stopPropagation()
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!socket) return null

  return (
    <div className={`fixed bottom-5 left-5 w-[350px] max-w-[calc(100vw-40px)] z-[1000] pointer-events-auto transition-all duration-300 ${
      isOpen ? 'max-h-[500px]' : 'max-h-12'
    } max-md:w-[calc(100vw-40px)] max-md:max-h-[400px]`}>
      <FantasyPanel className={`flex flex-col transition-all duration-300 ${
        isOpen ? 'max-h-[500px]' : 'max-h-12 overflow-hidden'
      }`} title={
        <div 
          className="flex justify-between items-center w-full cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-amber-400 font-bold text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            Chat
          </span>
          <button 
            className="bg-transparent border-none text-amber-400 text-xl font-bold cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-200 hover:bg-amber-400/20 hover:text-amber-300"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
          >
            {isOpen ? '−' : '+'}
          </button>
        </div>
      }>
        {isOpen && (
          <>
            <div 
              className="chat-messages-scroll flex-1 overflow-y-auto p-2.5 min-h-[200px] max-h-[350px] flex flex-col gap-2 max-md:max-h-[250px] max-md:min-h-[150px]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) rgba(255,255,255,0.1)'
              }}
            >
              <style>{`
                .chat-messages-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .chat-messages-scroll::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 3px;
                }
                .chat-messages-scroll::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.3);
                  border-radius: 3px;
                }
                .chat-messages-scroll::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.5);
                }
              `}</style>
              {messages.length === 0 ? (
                <div className="text-gray-400 text-center py-5 italic text-sm">No messages yet. Start chatting!</div>
              ) : (
                messages.map((msg, index) => {
                  const isOwnMessage = msg.playerId === currentPlayerId
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded-md transition-all duration-200 border-l-[3px] ${
                        isOwnMessage 
                          ? 'bg-indigo-500/20 border-l-indigo-500 hover:bg-indigo-500/30' 
                          : 'bg-white/8 border-l-indigo-500/60 hover:bg-white/12'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold text-[13px] ${
                          isOwnMessage ? 'text-indigo-300' : 'text-indigo-500'
                        }`}>
                          {msg.playerName}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div 
                        className="text-sm text-gray-200 leading-normal break-words font-sans"
                        style={{ 
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif"
                        }}
                      >
                        {parseEmoticons(msg.message)}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="flex gap-2 pt-2.5 mt-2.5 border-t border-amber-600/30" onSubmit={handleSendMessage}>
              <FantasyInput
                type="text"
                placeholder="Type a message... (Enter to send)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={500}
                className="flex-1"
              />
              <FantasyButton 
                type="submit" 
                size="sm"
                disabled={!inputMessage.trim()}
                className="flex-shrink-0 whitespace-nowrap"
              >
                Send
              </FantasyButton>
            </form>
          </>
        )}
      </FantasyPanel>
    </div>
  )
}

