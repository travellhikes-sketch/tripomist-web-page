import React, { useState, useRef, useEffect } from 'react'

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
      content: "Hello! I'm TripoMist Ai. How can I assist you today with your travel plans?"
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
    <>
      {/* Chat Window Panel — opened via BottomDock pill */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 right-4 md:left-8 md:right-auto z-50 w-auto md:max-w-[400px] h-[500px] md:h-[550px] rounded-[1rem] overflow-hidden flex flex-col bg-white shadow-2xl border border-gray-200 transition-all duration-300 animate-slide-up font-sans">
          {/* Header */}
          <div className="bg-[#f3f4f6] p-4 text-gray-800 flex items-center justify-between border-b border-gray-200">
            <h3 className="font-bold text-lg leading-tight">TripoMist Ai</h3>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-800 transition-colors bg-transparent border-none cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white hide-scrollbar">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div 
                  className={`px-4 py-3 rounded-[1.2rem] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#f3f4f6] text-gray-800 rounded-tr-sm' 
                      : 'bg-[#e5e7eb] text-gray-800 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line m-0">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <div className="bg-[#e5e7eb] text-gray-800 rounded-[1.2rem] rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {!isLoading && messages.length <= 2 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 bg-white">
              {['Plan a Trip', 'Group Trips', 'Weekend getaways'].map((txt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(txt)
                  }}
                  className="text-[13px] bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all px-3 py-1.5 rounded-md cursor-pointer shadow-sm"
                >
                  {txt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form 
            onSubmit={handleSend}
            className="p-3 bg-[#f3f4f6] flex items-center gap-2 border-t border-gray-200"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message"
              disabled={isLoading}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm px-4 py-2 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot
