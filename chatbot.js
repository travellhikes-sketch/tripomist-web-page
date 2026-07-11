// chatbot.js
// Dynamic Chatbot ("Kaptain AI") for TripoMist Static HTML Page using OpenRouter API

document.addEventListener('DOMContentLoaded', () => {
  const triggerBtn = document.getElementById('chatbot-trigger-btn');
  if (!triggerBtn) return;

  // Remove the static onclick alert if still present
  triggerBtn.removeAttribute('onclick');

  // Initial State
  let isOpen = false;
  let isLoading = false;
  const messages = [
    {
      role: 'assistant',
      content: "Hi! I'm Kaptain AI 🏔️, your personal TripoMist travel companion. Where would you like to explore next? Spiti Valley, Ladakh, or maybe a weekend getaway? Let's plan your dream trip!"
    }
  ];

  // System Prompt for Kaptain AI
  const systemPrompt = {
    role: 'system',
    content: "You are Kaptain AI, a friendly and highly knowledgeable travel assistant for TripoMist, a premier group trip and adventure travel company in India. Help users plan itineraries, answer questions about destinations (like Spiti Valley, Meghalaya, Kerala, Ladakh, etc.), suggest packing lists, and give details about TripoMist group trips. Keep your responses highly engaging, professional, formatting sections using clear bullet points or bold text where appropriate. Keep responses relatively concise so they look clean in a small chat window. Avoid mentioning OpenRouter or API details."
  };

  // Create Chat Window DOM Element
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chatbot-window';
  chatWindow.className = 'fixed bottom-24 left-8 z-50 w-full max-w-[360px] sm:max-w-[400px] h-[500px] sm:h-[550px] rounded-[1.5rem] overflow-hidden flex flex-col bg-white/95 backdrop-blur-md shadow-2xl border border-outline-variant/30 transition-all duration-300 hidden';
  
  chatWindow.innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-primary to-[#004e72] p-4 text-white flex items-center justify-between shadow-md">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
          <span class="material-symbols-outlined text-white text-[24px]">smart_toy</span>
        </div>
        <div>
          <h3 class="font-bold text-base leading-tight">Kaptain AI</h3>
          <span class="text-xs text-emerald-300 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online - TripoMist Guide
          </span>
        </div>
      </div>
      <button id="chatbot-close-btn" class="text-white/80 hover:text-white hover:scale-110 transition-all bg-transparent border-none cursor-pointer p-1">
        <span class="material-symbols-outlined text-[22px]">close</span>
      </button>
    </div>

    <!-- Messages Area -->
    <div id="chatbot-messages" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-50/50" style="scrollbar-width: none; -ms-overflow-style: none;">
      <!-- Messages get injected here -->
    </div>

    <!-- Quick Suggestions -->
    <div id="chatbot-suggestions" class="px-4 py-2 flex flex-wrap gap-1.5 bg-slate-50/50 border-t border-slate-100">
      <button class="suggestion-btn text-xs bg-white text-primary border border-primary/20 hover:bg-primary/5 transition-all px-2.5 py-1.5 rounded-full cursor-pointer">Plan Spiti Trip 🏔️</button>
      <button class="suggestion-btn text-xs bg-white text-primary border border-primary/20 hover:bg-primary/5 transition-all px-2.5 py-1.5 rounded-full cursor-pointer">Ladakh Group Trips 🏍️</button>
      <button class="suggestion-btn text-xs bg-white text-primary border border-primary/20 hover:bg-primary/5 transition-all px-2.5 py-1.5 rounded-full cursor-pointer">Weekend getaway suggestions</button>
    </div>

    <!-- Input Form -->
    <form id="chatbot-form" class="p-3.5 bg-white border-t border-outline-variant/30 flex items-center gap-2 shadow-inner">
      <input 
        id="chatbot-input"
        type="text"
        placeholder="Ask Kaptain AI a question..."
        class="flex-1 bg-slate-50 border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
      />
      <button 
        type="submit" 
        id="chatbot-send-btn"
        class="w-10 h-10 rounded-xl bg-primary hover:bg-[#004e72] text-white flex items-center justify-center transition-all cursor-pointer border-none shadow-md"
      >
        <span class="material-symbols-outlined text-[20px] leading-none">send</span>
      </button>
    </form>
  `;

  document.body.appendChild(chatWindow);

  const messagesContainer = document.getElementById('chatbot-messages');
  const chatForm = document.getElementById('chatbot-form');
  const chatInput = document.getElementById('chatbot-input');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const suggestionsContainer = document.getElementById('chatbot-suggestions');

  // Render Messages
  function renderMessages() {
    messagesContainer.innerHTML = '';
    messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      const isUser = msg.role === 'user';
      msgDiv.className = `flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`;
      
      msgDiv.innerHTML = `
        <div class="px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser 
            ? 'bg-primary text-white rounded-tr-none shadow-md' 
            : 'bg-white text-on-surface border border-outline-variant/20 rounded-tl-none shadow-sm'
        }">
          <p class="whitespace-pre-line">${escapeHTML(msg.content)}</p>
        </div>
        <span class="text-[10px] text-on-surface-variant/60 mt-1 px-1">
          ${isUser ? 'You' : 'Kaptain AI'}
        </span>
      `;
      messagesContainer.appendChild(msgDiv);
    });

    if (isLoading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'self-start flex flex-col items-start max-w-[85%]';
      loadingDiv.innerHTML = `
        <div class="bg-white text-on-surface border border-outline-variant/20 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
          <span class="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
        <span class="text-[10px] text-on-surface-variant/60 mt-1 px-1">Kaptain AI is thinking...</span>
      `;
      messagesContainer.appendChild(loadingDiv);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Toggle Suggestions visibility
    if (messages.length <= 2 && !isLoading) {
      suggestionsContainer.classList.remove('hidden');
    } else {
      suggestionsContainer.classList.add('hidden');
    }
  }

  // Escape HTML helper
  function escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Toggle Chat Window
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.classList.remove('hidden');
      renderMessages();
      
      // Update trigger icon
      triggerBtn.innerHTML = '<span class="material-symbols-outlined text-[28px] leading-none">close</span>';
      
      // Remove green badge if any
      const badge = triggerBtn.querySelector('span.absolute');
      if (badge) badge.remove();
    } else {
      chatWindow.classList.add('hidden');
      triggerBtn.innerHTML = '<span class="material-symbols-outlined text-[28px] leading-none">smart_toy</span>';
    }
  }

  triggerBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', () => {
    if (isOpen) toggleChat();
  });

  // Handle Send Message
  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    messages.push({ role: 'user', content: userMessage });
    isLoading = true;
    renderMessages();

    const apiKey = window.OPENROUTER_API_KEY;
    const model = window.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!apiKey) {
      messages.push({ role: 'assistant', content: "⚠️ Setup Error: OpenRouter API key is missing. Please set window.OPENROUTER_API_KEY in openrouter-config.js." });
      isLoading = false;
      renderMessages();
      return;
    }

    // Build standard messages list
    const apiMessages = [
      systemPrompt,
      ...messages.map(msg => ({ role: msg.role, content: msg.content }))
    ];

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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      const botReply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't formulate a response. Please try again.";
      
      messages.push({ role: 'assistant', content: botReply });
    } catch (err) {
      console.error("OpenRouter API Error:", err);
      messages.push({ role: 'assistant', content: "⚠️ Sorry, I ran into a connection issue. Can you try again?" });
    } finally {
      isLoading = false;
      renderMessages();
    }
  }

  // Form Submit Handler
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value;
    chatInput.value = '';
    sendMessage(text);
  });

  // Suggestion Buttons Handler
  suggestionsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.suggestion-btn');
    if (btn) {
      sendMessage(btn.textContent);
    }
  });

  // Add green badge to notify the user there is a bot ready
  const notificationBadge = document.createElement('span');
  notificationBadge.className = 'absolute -top-1 -right-1 flex h-3.5 w-3.5';
  notificationBadge.innerHTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
  `;
  triggerBtn.appendChild(notificationBadge);
});
