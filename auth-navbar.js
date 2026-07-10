// auth-navbar.js
// Centralized authentication and navbar integration for TripoMist static HTML pages

(function() {
  // Load Material Icons stylesheet if not already loaded (to support icons)
  if (!document.querySelector('link[href*="material-symbols"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(link);
  }

  // Load Tailwind animations support style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.15s ease-out forwards;
    }
  `;
  document.head.appendChild(style);

  // Script loader helper
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  // Safe storage helper supporting localStorage -> sessionStorage -> window.name fallbacks
  let storageType = 'local';
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    try {
      const testKey = '__storage_test__';
      window.sessionStorage.setItem(testKey, testKey);
      window.sessionStorage.removeItem(testKey);
      storageType = 'session';
    } catch (e2) {
      storageType = 'name';
    }
  }

  const safeStorage = {
    getItem: (key) => {
      if (storageType === 'local') {
        try { const val = window.localStorage.getItem(key); if (val !== null) return val; } catch (e) {}
      }
      try { const val = window.sessionStorage.getItem(key); if (val !== null) return val; } catch (e) {}
      try {
        const data = JSON.parse(window.name || '{}');
        return data[key] || null;
      } catch(e) {
        return null;
      }
    },
    setItem: (key, value) => {
      if (storageType === 'local') {
        try { window.localStorage.setItem(key, value); } catch (e) {}
      }
      try { window.sessionStorage.setItem(key, value); } catch (e) {}
      try {
        const data = JSON.parse(window.name || '{}');
        data[key] = value;
        window.name = JSON.stringify(data);
      } catch(e) {}
    },
    removeItem: (key) => {
      if (storageType === 'local') {
        try { window.localStorage.removeItem(key); } catch (e) {}
      }
      try { window.sessionStorage.removeItem(key); } catch (e) {}
      try {
        const data = JSON.parse(window.name || '{}');
        delete data[key];
        window.name = JSON.stringify(data);
      } catch(e) {}
    }
  };

  let supabaseClient = null;
  let useRealSupabase = false;

  // Unified Auth Interface
  const auth = {
    getUser: async function() {
      if (useRealSupabase && supabaseClient) {
        try {
          const { data: { user }, error } = await supabaseClient.auth.getUser();
          if (!error && user) return user;
        } catch (e) {
          console.error("Supabase getUser error:", e);
        }
      }
      // Fallback to local storage mock user
      return JSON.parse(safeStorage.getItem('mock_current_user') || 'null');
    },
    signOut: async function() {
      if (useRealSupabase && supabaseClient) {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {
          console.error("Supabase signOut error:", e);
        }
      }
      safeStorage.removeItem('mock_current_user');
      window.dispatchEvent(new Event('auth-state-change'));
    }
  };

  // Start initialization chain
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  async function bootstrap() {
    try {
      // 1. Try to load supabase-config.js dynamically
      await loadScript('supabase-config.js');
      
      // 2. Check if a real Supabase Anon Key is defined
      if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== "") {
        console.log("Supabase configured. Loading local Supabase client...");
        await loadScript('supabase-cdn.js');
        
        // Pass custom storage options to avoid tracking prevention warnings in iframe/sandboxed contexts
        const clientOptions = {
          auth: {
            storage: safeStorage,
            persistSession: !useMemoryStorage,
            detectSessionInUrl: true
          }
        };
        supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, clientOptions);
        window.supabaseClientInstance = supabaseClient;
        useRealSupabase = true;
        console.log("Supabase client initialized successfully.");
      } else {
        console.warn("window.SUPABASE_ANON_KEY is empty. Running in Mock Auth mode.");
      }
    } catch (e) {
      console.warn("Bootstrap failed to initialize real Supabase (possibly config file missing or CDN offline). Running in Mock Auth mode.", e);
    } finally {
      // 3. Initialize navbar elements
      await initNavbar();
    }
  }

  async function initNavbar() {
    const desktopPhoneLink = document.querySelector('nav a[href^="tel:"]');
    if (!desktopPhoneLink) return;
    const desktopActions = desktopPhoneLink.parentElement;
    const mobileDropdown = document.getElementById('mobile-menu-dropdown');

    const user = await auth.getUser();

    // 1. Setup Desktop Navbar Auth
    const oldDesktopAuth = document.getElementById('desktop-auth-container');
    if (oldDesktopAuth) oldDesktopAuth.remove();

    const desktopAuthContainer = document.createElement('div');
    desktopAuthContainer.id = 'desktop-auth-container';
    desktopAuthContainer.className = 'flex items-center gap-4 ml-4 relative';

    if (user) {
      // Logged in
      desktopAuthContainer.innerHTML = `
        <div class="relative">
          <button id="desktop-user-btn" class="flex items-center gap-1.5 focus:outline-none hover:text-primary transition-colors duration-150 p-1 text-on-surface font-semibold text-sm cursor-pointer border-none bg-transparent">
            <span class="material-symbols-outlined text-[24px]">account_circle</span>
            <span class="max-w-[100px] truncate">${user.user_metadata?.full_name || user.email.split('@')[0]}</span>
            <span class="material-symbols-outlined text-xs">arrow_drop_down</span>
          </button>
          
          <div id="desktop-user-dropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-outline-variant/30 shadow-xl py-2 z-50 animate-fade-in hidden">
            <div class="px-4 py-2 border-b border-outline-variant/20">
              <p class="text-xs font-bold text-on-surface truncate">${user.user_metadata?.full_name || "Traveler"}</p>
              <p class="text-[10px] text-on-surface-variant truncate">${user.email}</p>
            </div>
            <a href="profile.html" class="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer no-underline block border-none bg-transparent">
              <span class="material-symbols-outlined text-sm">person</span> Profile Dashboard
            </a>
            <button id="desktop-logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent">
              <span class="material-symbols-outlined text-sm">logout</span> Logout
            </button>
          </div>
        </div>
      `;
      desktopActions.appendChild(desktopAuthContainer);

      const userBtn = document.getElementById('desktop-user-btn');
      const userDropdown = document.getElementById('desktop-user-dropdown');
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        userDropdown.classList.add('hidden');
      });

      const logoutBtn = document.getElementById('desktop-logout-btn');
      logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.reload();
      });
    } else {
      // Logged out
      desktopAuthContainer.innerHTML = `
        <a href="login.html" class="bg-primary hover:bg-primary/95 text-white font-button text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 no-underline">
          <span class="material-symbols-outlined text-sm">login</span> Login
        </a>
      `;
      desktopActions.appendChild(desktopAuthContainer);
    }

    // 2. Setup Mobile Dropdown Auth
    if (mobileDropdown) {
      const oldMobileAuth = document.getElementById('mobile-auth-container');
      if (oldMobileAuth) oldMobileAuth.remove();

      const mobileAuthContainer = document.createElement('div');
      mobileAuthContainer.id = 'mobile-auth-container';
      mobileAuthContainer.className = 'border-t border-outline-variant/20 pt-4 mt-2';

      if (user) {
        mobileAuthContainer.innerHTML = `
          <div class="flex flex-col gap-2">
            <div class="px-1 py-1 text-sm font-semibold text-on-surface-variant">
              Hi, ${user.user_metadata?.full_name || user.email.split('@')[0]}
            </div>
            <a href="profile.html" class="w-full bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer no-underline text-center">
              <span class="material-symbols-outlined text-sm">person</span> Profile Dashboard
            </a>
            <button id="mobile-logout-btn" class="w-full bg-red-50 text-red-500 border border-red-200 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined">logout</span> Logout
            </button>
          </div>
        `;
        mobileDropdown.firstElementChild.appendChild(mobileAuthContainer);

        document.getElementById('mobile-logout-btn').addEventListener('click', async () => {
          await auth.signOut();
          window.location.reload();
        });
      } else {
        mobileAuthContainer.innerHTML = `
          <a href="login.html" class="w-full bg-primary text-white text-center py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 no-underline">
            <span class="material-symbols-outlined">login</span> Login / Sign Up
          </a>
        `;
        mobileDropdown.firstElementChild.appendChild(mobileAuthContainer);
      }
    }
  }

  // Listen to auth status changes from other tabs/sessions
  window.addEventListener('auth-state-change', initNavbar);
})();
