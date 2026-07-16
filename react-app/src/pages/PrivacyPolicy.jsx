import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function PrivacyPolicy() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
          alt="Privacy Policy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Privacy Policy
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#006591]"></div>
          
          <h1 className="text-3xl font-bold mb-8 uppercase text-on-surface">Privacy Policy</h1>

          <div className="space-y-6 text-[#3e4850] leading-relaxed">
            <p>The terms “We” / “Us” / “Our” / “Company” individually and collectively refer to <strong>TripoMist</strong>, and the terms “You” / “Your” / “Yourself” refer to the users of our services and website.</p>
            <p className="mt-2">This Privacy Policy is an electronic record in the form of an electronic contract formed under the provisions of the Information Technology Act, 2000 and the applicable rules thereunder, including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. This Privacy Policy does not require any physical, electronic, or digital signature.</p>
            <p className="mt-2">This Privacy Policy is a legally binding document between You and <strong>TripoMist</strong>. By accessing or using the website <strong><a href="http://www.tripomist.com" className="text-primary hover:underline">www.tripomist.com</a></strong> or any other affiliated platform, you signify your agreement to the terms of this policy. If you do not agree with the terms herein, please do not use or access our website or services.</p>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. User Consent</h2>
              <p>By providing your information or by making use of the facilities provided by our website, you consent to the collection, use, storage, and processing of your information, including personal and non-personal data, in accordance with this Privacy Policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Information We Collect</h2>
              <p>To offer certain services, we may require the following information:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Contact Number</li>
                <li>Age/Sex</li>
                <li>Location/PIN Code</li>
                <li>Payment Details (Credit/Debit Card Info, UPI, etc.)</li>
                <li>Medical History (for treks or travel requiring fitness declarations)</li>
                <li>Interests and Preferences</li>
                <li>Government ID or Biometric Information (only if necessary)</li>
                <li>Password and Login Information</li>
              </ul>
              <p className="mt-2">This data helps us enhance user experience, tailor offerings, and ensure your safety and convenience during travel.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Assign you a unique user ID</li>
                <li>Monitor usage patterns</li>
                <li>Understand user preferences</li>
                <li>Improve our website performance</li>
              </ul>
              <p className="mt-2">You can choose to disable cookies through your browser settings, though some features of the website may not function properly without them.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. IP Address and Log Data</h2>
              <p>Our web servers may collect limited data about your device’s connection to the internet, including your IP address. This information helps us deliver content efficiently and understand the geographic distribution of our users.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Links to External Sites</h2>
              <p><strong>TripoMist</strong> may link to other websites or applications. We are not responsible for the privacy practices or content of such third-party websites.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Information Sharing</h2>
              <p>We do not share your personal information with third parties except in the following cases:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>With your explicit consent</li>
                <li>To comply with legal or regulatory requests from government or judicial bodies</li>
                <li>Within our affiliated group companies or service providers, strictly for processing information on our behalf, under confidentiality agreements and security protocols</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Information Security</h2>
              <p>We implement robust security measures including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Firewalled servers</li>
                <li>Password-protected access</li>
                <li>Encrypted data storage</li>
                <li>Regular internal audits</li>
              </ul>
              <p className="mt-2">While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of data transmitted online.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">8. User Responsibilities</h2>
              <p>Users are advised to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Keep their login credentials confidential</li>
                <li>Avoid sharing sensitive details in public forums on our site</li>
                <li>Immediately report any suspicious activity to us</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">9. Policy Updates</h2>
              <p>This Privacy Policy may be updated from time to time to reflect changes in technology, applicable laws, or our business operations. Continued use of our services after any updates constitutes your acceptance of the revised policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">10. Contact Us</h2>
              <p>For any concerns or queries regarding this Privacy Policy, please contact:</p>
              <div className="bg-[#faf8ff] rounded-lg p-4 mt-2 border border-[#bec8d2]/30 text-on-surface">
                <strong>TripoMist</strong><br />
                <strong>Address:</strong> New Kondli, Mayur Vihar Phase-3, Delhi – 110096, India<br />
                <strong>Email:</strong> info@tripomist.com<br />
                <strong>Phone:</strong> +91 9990802608<br />
                <strong>Website:</strong> <a href="http://www.tripomist.com" className="text-primary hover:underline">www.tripomist.com</a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy
