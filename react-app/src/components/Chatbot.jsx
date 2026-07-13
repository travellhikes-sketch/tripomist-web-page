import React, { useState, useRef, useEffect } from 'react'

function Chatbot({ isOpenExternal, onExternalClose } = {}) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Sync with external open trigger (from BottomDock pill)
  useEffect(() => {
    if (isOpenExternal) setIsOpen(true)
  }, [isOpenExternal])

  const handleClose = () => {
    setIsOpen(false)
    if (onExternalClose) onExternalClose()
  }

  const messages_init = [
    {
      role: 'assistant',
      content: "Hi! I'm Kaptain AI 🏔️, your personal TripoMist travel companion. Where would you like to explore next? Spiti Valley, Ladakh, or maybe a weekend getaway? Let's plan your dream trip!"
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
      content: "You are Kaptain AI, a friendly and highly knowledgeable travel assistant for TripoMist, a premium group trip and adventure travel company in India. Help users plan itineraries, answer questions about destinations (like Spiti Valley, Meghalaya, Kerala, Ladakh, etc.), suggest packing lists, and give details about TripoMist group trips. Keep your responses highly engaging, professional, formatting sections using clear bullet points or bold text where appropriate. Keep responses relatively concise so they look clean in a small chat window. Avoid mentioning OpenRouter or API details."
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
        <div className="fixed bottom-24 left-4 right-4 md:left-8 md:right-auto z-50 w-auto md:max-w-[400px] h-[500px] md:h-[550px] rounded-[1.5rem] overflow-hidden flex flex-col bg-white/95 backdrop-blur-md shadow-2xl border border-outline-variant/30 transition-all duration-300 animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-[#004e72] p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                <span className="material-symbols-outlined text-white text-[24px]">smart_toy</span>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight font-headline">Kaptain AI</h3>
                <span className="text-xs text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online - TripoMist Guide
                </span>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:scale-115 transition-all bg-transparent border-none cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-50/50 hide-scrollbar">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div 
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none shadow-md' 
                      : 'bg-white text-on-surface border border-outline-variant/20 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant/60 mt-1 px-1">
                  {msg.role === 'user' ? 'You' : 'Kaptain AI'}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <div className="bg-white text-on-surface border border-outline-variant/20 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[10px] text-on-surface-variant/60 mt-1 px-1">Kaptain AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (Only if chat has just started or no pending load) */}
          {!isLoading && messages.length <= 2 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-slate-50/50 border-t border-slate-100">
              {['Plan Spiti Trip 🏔️', 'Ladakh Group Trips 🏍️', 'Weekend getaway suggestions'].map((txt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(txt)
                  }}
                  className="text-xs bg-white text-primary border border-primary/20 hover:bg-primary/5 transition-all px-2.5 py-1.5 rounded-full cursor-pointer"
                >
                  {txt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form 
            onSubmit={handleSend}
            className="p-3.5 bg-white border-t border-outline-variant/30 flex items-center gap-2 shadow-inner"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kaptain AI a question..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary hover:bg-[#004e72] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none shadow-md"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot
