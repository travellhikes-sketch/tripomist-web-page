import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Chatbot({ isOpenExternal, onExternalClose } = {}) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Sync with external open trigger
  useEffect(() => {
    setIsOpen(isOpenExternal)
  }, [isOpenExternal])

  const handleClose = () => {
    setIsOpen(false)
    if (onExternalClose) onExternalClose()
  }

  const messages_init = [
    {
      role: 'assistant',
      content: "Hello! I'm TripoMist. How can I assist you today with your travel plans?"
    }
  ]

  const [messages, setMessages] = useState(messages_init)

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const messagesEndRef = useRef(null)

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    // Build standard messages structure with system prompt
    const systemPrompt = {
      role: 'system',
      content: "You are TripoMist Ai, a friendly and highly knowledgeable travel assistant for TripoMist, a premium group trip and adventure travel company in India. Help users plan itineraries, answer questions about destinations, suggest packing lists, and give details about TripoMist group trips. Keep your responses highly engaging, professional, formatting sections using clear bullet points or bold text where appropriate. Keep responses relatively concise so they look clean in a small chat window. Avoid mentioning OpenRouter or API details."
    }

    const apiMessages = [
      systemPrompt,
      ...messages.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ]

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    const model = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-flash'

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://tripomist.com',
          'X-Title': 'TripoMist Travel Assistant'
        },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `API error: ${response.statusText}`)
      }

      const data = await response.json()
      const botReply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't formulate a response. Please try again."
      
      setMessages(prev => [...prev, { role: 'assistant', content: botReply }])
    } catch (err) {
      console.error("OpenRouter API Error:", err)
      setError("Unable to connect. Please check your connection or try again.")
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I ran into a connection issue. Can you try again?" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.3, y: 300, originX: 0.5, originY: 1 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.3, y: 300 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] w-full h-full flex flex-col bg-white font-sans"
        >
          {/* Header */}
          <div className="bg-[#f8f9fa] p-4 text-gray-800 flex items-center justify-between border-b border-gray-200 shadow-sm relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              {/* TripoMist Logo from Navbar */}
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY" alt="TripoMist Logo" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" />
              <h3 className="font-extrabold text-[22px] text-[#136b8a] tracking-tight m-0">Chat With Us</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Call Icon */}
              <a 
                href="tel:+919990802608" 
                className="w-11 h-11 rounded-full bg-[#eff6f9] text-[#136b8a] flex items-center justify-center hover:bg-[#136b8a] hover:text-white transition-colors shadow-sm cursor-pointer"
                title="Call TripoMist"
              >
                <span className="material-symbols-outlined text-[22px] font-bold">call</span>
              </a>
              {/* Close Icon */}
              <button 
                onClick={handleClose}
                className="w-11 h-11 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm"
                title="Close Chat"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 bg-white hide-scrollbar max-w-5xl mx-auto w-full">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-[85%] md:max-w-[70%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div 
                  className={`px-6 py-4 rounded-[1.5rem] text-base leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#136b8a] text-white rounded-tr-sm' 
                      : 'bg-[#f3f4f6] text-gray-800 rounded-tl-sm border border-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-line m-0">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <div className="bg-[#f3f4f6] text-gray-800 rounded-[1.5rem] rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-1.5 border border-gray-100">
                  <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {!isLoading && messages.length <= 2 && (
            <div className="px-4 md:px-8 py-3 flex flex-wrap gap-2 max-w-5xl mx-auto w-full">
              {['Plan a Trip', 'Group Trips', 'Weekend getaways'].map((txt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(txt)
                  }}
                  className="text-[14px] font-semibold bg-white text-[#136b8a] border border-[#136b8a]/30 hover:bg-[#eff6f9] transition-all px-4 py-2 rounded-full cursor-pointer shadow-sm"
                >
                  {txt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <div className="bg-[#f8f9fa] border-t border-gray-200 p-4 shrink-0">
            <form 
              onSubmit={handleSend}
              className="max-w-5xl mx-auto flex items-center gap-3"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                disabled={isLoading}
                className="flex-1 bg-white border border-gray-300 rounded-full px-6 py-4 text-base focus:outline-none focus:border-[#136b8a] focus:ring-2 focus:ring-[#136b8a]/20 transition-all disabled:opacity-50 shadow-sm"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="w-14 h-14 rounded-full bg-[#136b8a] hover:bg-[#0f556e] text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none shadow-md"
              >
                <span className="material-symbols-outlined text-[24px]">send</span>
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Chatbot
