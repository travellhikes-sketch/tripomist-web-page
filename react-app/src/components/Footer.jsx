import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/30 w-full mt-auto py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 border-b border-outline-variant/20 pb-8 mb-8">
        <div className="text-center lg:text-left flex flex-col items-center lg:items-start gap-2">
          <Link className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2" to="/">
            <img alt="TripoMist Logo" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY" />
            TripoMist
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Your Safe Travel Our Responsibility. Discover life-changing group expeditions with Delhi's premium travel tribe.</p>
        </div>
        
        <div className="flex flex-col items-center lg:items-start gap-3">
          <h3 className="font-bold text-sm text-on-surface">Follow us on</h3>
          <div className="flex items-center gap-4">
            {/* WhatsApp */}
            <a href="https://wa.me/919990802608" className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center hover:opacity-85 transition-opacity" target="_blank" rel="noopener noreferrer">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/travellhikes?igsh=dDIxcmJvbmRkemlj" className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:opacity-85 transition-opacity" target="_blank" rel="noopener noreferrer">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.475 1.382.897.422.422.681.822.897 1.382.164.422.359 1.057.412 2.227.059 1.266.071 1.646.071 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.216.56-.475.96-.897 1.382-.422.422-.822.681-1.382.897-.422.164-1.057.359-2.227.412-1.266.059-1.646.071-4.85.071s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.56-.216-.96-.475-1.382-.897-.422-.422-.681-.822-.897-1.382-.164-.422-.359-1.057-.412-2.227-.059-1.266-.071-1.646-.071-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.475-.96.897-1.382.422-.422.822-.681 1.382-.897.422-.164 1.057-.359 2.227-.412 1.266-.059 1.646-.071 4.85-.071zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.306.788.717 1.459 1.384 2.126s1.337 1.079 2.126 1.384c.766.296 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.079-1.337 1.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126s-1.337-1.079-2.126-1.384c-.765-.296-1.636-.499-2.913-.558C15.667.012 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path></svg>
            </a>
            {/* Facebook */}
            <a href="https://www.facebook.com/share/1BWhe7V5V3/" className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center hover:opacity-85 transition-opacity" target="_blank" rel="noopener noreferrer">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"></path></svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p className="font-body-md text-body-md text-on-surface-variant">© 2024 TripoMist. Your Safe Travel Our Responsibility.</p>
        <div className="flex flex-wrap gap-6 justify-center md:justify-end text-sm">
          <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider text-[11px] no-underline" to="/contact">Contact Us</Link>
          <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider text-[11px] no-underline" to="/terms-conditions">Terms & Conditions</Link>
          <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider text-[11px] no-underline" to="/privacy-policy">Privacy Policy</Link>
          <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider text-[11px] no-underline" to="/refund-policy">Refund Policy</Link>
          <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider text-[11px] no-underline" to="/shipping-policy">Shipping Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
