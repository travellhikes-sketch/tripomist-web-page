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

  // Unified LocalStorage Auth Mock Helpers
  const auth = {
    getUser: function() {
      return JSON.parse(localStorage.getItem('mock_current_user') || 'null');
    },
    signOut: function() {
      localStorage.removeItem('mock_current_user');
      // Dispatch event to update navbar immediately in the current context
      window.dispatchEvent(new Event('auth-state-change'));
    }
  };

  // Run navbar setup on DOMContentLoaded or immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  } else {
    initNavbar();
  }

  function initNavbar() {
    const desktopPhoneLink = document.querySelector('nav a[href^="tel:"]');
    if (!desktopPhoneLink) return;
    const desktopActions = desktopPhoneLink.parentElement;
    const mobileDropdown = document.getElementById('mobile-menu-dropdown');

    // Create user status elements
    const user = auth.getUser();

    // 1. Setup Desktop Navbar Auth
    // Remove any previously injected auth container to prevent duplicates
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
            <button id="desktop-logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent">
              <span class="material-symbols-outlined text-sm">logout</span> Logout
            </button>
          </div>
        </div>
      `;
      desktopActions.appendChild(desktopAuthContainer);

      // Event listeners for dropdown
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
      logoutBtn.addEventListener('click', () => {
        auth.signOut();
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
            <button id="mobile-logout-btn" class="w-full bg-red-50 text-red-500 border border-red-200 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined">logout</span> Logout
            </button>
          </div>
        `;
        mobileDropdown.firstElementChild.appendChild(mobileAuthContainer);

        document.getElementById('mobile-logout-btn').addEventListener('click', () => {
          auth.signOut();
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
