// lead-modal.js
// Timed Lead Capture Modal for TripoMist static HTML pages

(function() {
  const N8N_WEBHOOK = 'https://primary-production-4c8d.up.railway.app/webhook/e78119eb-9ea2-4ee4-b152-cb4db12dbe44';
  const POPUP_DELAY_MS = 5000; // 5 seconds delay before showing the modal

  // Don't show if closed in this session
  if (sessionStorage.getItem('lead_modal_closed') === 'true') {
    return;
  }

  // Inject styles if not present
  const style = document.createElement('style');
  style.textContent = `
    .lead-modal-open {
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    .lead-modal-card-open {
      transform: scale(1) !important;
      opacity: 1 !important;
    }
    .lead-input {
      border: 1.5px solid rgba(110, 120, 129, 0.25);
      border-radius: 14px;
      font-size: 15px;
      outline: none;
      transition: all 0.2s ease-in-out;
    }
    .lead-input:focus {
      border-color: #006591;
      box-shadow: 0 0 0 4px rgba(0, 101, 145, 0.12);
    }
  `;
  document.head.appendChild(style);

  // Setup dynamic modal injection on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeadModal);
  } else {
    initLeadModal();
  }

  function initLeadModal() {
    // 1. Create Modal Container
    const modal = document.createElement('div');
    modal.id = 'lead-modal';
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none opacity-0 transition-opacity duration-300 ease-out';
    
    // Check if user is logged in to prefill details
    const currentUser = JSON.parse(localStorage.getItem('mock_current_user') || 'null');
    const defaultName = currentUser?.user_metadata?.full_name || '';
    const defaultEmail = currentUser?.email || '';

    // 2. Build Card HTML (matching TripoMist Theme)
    modal.innerHTML = `
      <div id="lead-modal-card" class="bg-white rounded-[28px] p-8 md:p-10 max-w-md w-full mx-4 shadow-2xl relative border border-outline-variant/30 transform scale-90 opacity-0 transition-all duration-300 ease-out">
        
        <!-- Close Button -->
        <button id="close-lead-btn" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors focus:outline-none cursor-pointer border-none" aria-label="Close">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <!-- Main Form Content -->
        <div id="lead-form-content">
          <div class="text-center mb-6">
            <h2 class="font-headline-md text-2xl text-on-surface font-extrabold mb-2 leading-tight">Let's plan your dream trip!</h2>
            <p class="font-body-md text-sm text-on-surface-variant leading-relaxed">
              Drop a few details, and we'll craft an unforgettable adventure just for you!
            </p>
          </div>

          <!-- Alert Box -->
          <div id="lead-alert-box" class="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-xs font-semibold flex items-center gap-2 hidden">
            <span class="material-symbols-outlined text-sm shrink-0">error</span>
            <span id="lead-alert-msg"></span>
          </div>

          <form id="lead-popup-form" class="space-y-4">
            <!-- Name Input -->
            <div class="relative">
              <input required type="text" id="lead-input-name" value="${defaultName}" class="lead-input w-full px-4 py-3 bg-surface-container-low text-on-surface focus:bg-white placeholder:text-outline" placeholder="Name">
            </div>

            <!-- Destination Select -->
            <div class="relative">
              <select required id="lead-input-destination" class="lead-input w-full px-4 py-3 bg-surface-container-low text-on-surface focus:bg-white placeholder:text-outline appearance-none cursor-pointer">
                <option value="" disabled selected>Choose your destination...</option>
                <option value="Spiti Valley Expedition">Spiti Valley Expedition</option>
                <option value="Ladakh Himalayan Expedition">Ladakh Himalayan Expedition</option>
                <option value="Meghalaya Backpacking">Meghalaya Backpacking</option>
                <option value="Kashmir Great Lakes Trek">Kashmir Great Lakes Trek</option>
                <option value="Kerala Houseboat Cruise">Kerala Houseboat Cruise</option>
                <option value="Other / Custom Trip">Other / Custom Trip</option>
              </select>
              <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>

            <!-- Mobile Input -->
            <div class="flex gap-2">
              <div class="flex items-center bg-surface-container-low border border-outline-variant/60 rounded-[14px] px-4 text-sm font-semibold text-on-surface-variant select-none">
                +91
              </div>
              <input required type="tel" id="lead-input-phone" pattern="[0-9]{10}" maxlength="10" class="lead-input flex-grow px-4 py-3 bg-surface-container-low text-on-surface focus:bg-white placeholder:text-outline" placeholder="Enter mobile number">
            </div>

            <!-- Email Input -->
            <div class="relative">
              <input required type="email" id="lead-input-email" value="${defaultEmail}" class="lead-input w-full px-4 py-3 bg-surface-container-low text-on-surface focus:bg-white placeholder:text-outline" placeholder="Email">
            </div>

            <!-- Submit Button -->
            <button type="submit" id="lead-submit-btn" class="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none mt-2">
              <span id="lead-submit-icon" class="material-symbols-outlined text-[20px]">support_agent</span>
              <span id="lead-submit-label">Talk to our Experts</span>
            </button>
          </form>
        </div>

        <!-- Success Message -->
        <div id="lead-success-content" class="hidden text-center py-8">
          <span class="material-symbols-outlined text-6xl text-emerald-500 mb-4 animate-bounce">check_circle</span>
          <h3 class="font-headline-md text-2xl text-on-surface font-extrabold mb-2">Enquiry Submitted!</h3>
          <p class="font-body-md text-sm text-on-surface-variant">Our travel experts will call you shortly to craft your dream trip.</p>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    const leadModalCard = document.getElementById('lead-modal-card');
    const closeBtn = document.getElementById('close-lead-btn');
    const form = document.getElementById('lead-popup-form');
    const formContent = document.getElementById('lead-form-content');
    const successContent = document.getElementById('lead-success-content');
    const alertBox = document.getElementById('lead-alert-box');
    const alertMsg = document.getElementById('lead-alert-msg');
    
    const submitBtn = document.getElementById('lead-submit-btn');
    const submitIcon = document.getElementById('lead-submit-icon');
    const submitLabel = document.getElementById('lead-submit-label');

    // Close logic
    function closeModal() {
      modal.classList.remove('lead-modal-open');
      leadModalCard.classList.remove('lead-modal-card-open');
      sessionStorage.setItem('lead_modal_closed', 'true');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Form submit logic
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.classList.add('hidden');

      const name = document.getElementById('lead-input-name').value.trim();
      const destination = document.getElementById('lead-input-destination').value;
      const phone = document.getElementById('lead-input-phone').value.trim();
      const email = document.getElementById('lead-input-email').value.trim();

      if (!name || !destination || !phone || !email) {
        alertBox.classList.remove('hidden');
        alertMsg.textContent = "Please fill in all details.";
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      submitIcon.textContent = "hourglass_empty";
      submitLabel.textContent = "Submitting...";

      const payload = {
        name,
        destination,
        phone: "+91 " + phone,
        email,
        submitted_at: new Date().toISOString(),
        source: 'Lead Capture Pop-up Modal'
      };

      try {
        // Attempt webhook post
        const res = await fetch(N8N_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showSuccess();
        } else {
          throw new Error('Server returned ' + res.status);
        }
      } catch (err) {
        console.warn('POST failed, trying fallback...', err);
        try {
          // Fallback fetch in no-cors
          await fetch(N8N_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(payload).toString(),
            mode: 'no-cors'
          });
          showSuccess();
        } catch (fallbackErr) {
          console.error("Submission failed completely:", fallbackErr);
          alertBox.classList.remove('hidden');
          alertMsg.textContent = "Failed to connect to our server. Please check your internet connection.";
          
          // Reset button state
          submitBtn.disabled = false;
          submitIcon.textContent = "support_agent";
          submitLabel.textContent = "Talk to our Experts";
        }
      }
    });

    function showSuccess() {
      formContent.classList.add('hidden');
      successContent.classList.remove('hidden');
      sessionStorage.setItem('lead_modal_closed', 'true');
      
      // Auto close after 3 seconds
      setTimeout(() => {
        closeModal();
      }, 3500);
    }

    // Trigger timed popup
    setTimeout(() => {
      if (sessionStorage.getItem('lead_modal_closed') !== 'true') {
        modal.classList.add('lead-modal-open');
        setTimeout(() => {
          leadModalCard.classList.add('lead-modal-card-open');
        }, 50);
      }
    }, POPUP_DELAY_MS);
  }
})();
