export const generatePDFVoucher = async (booking, action = 'download') => {
  // 1. Lazy load jspdf and html2canvas dynamically on demand
  const [html2canvasModule, jsPDFModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const html2canvas = html2canvasModule.default;
  const jsPDF = jsPDFModule.jsPDF;

  // 2. Create a styled container off-screen
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.color = '#1e293b';

  const amountPaid = Number(booking.final_amount || booking.total_amount || 0);
  const totalVal = Number(booking.total_amount || booking.final_amount || 0);
  const remainingAmount = totalVal > amountPaid ? totalVal - amountPaid : 0;

  // Render content
  container.innerHTML = `
    <div style="padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; min-height: 1120px;">
      
      <!-- Top header -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #136b8a; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 28px; font-weight: 900; color: #136b8a; letter-spacing: -0.5px;">TripoMist</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 600; uppercase tracking-widest;">Your Safe Travel Partner</div>
          </div>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase;">
            Booking Confirmed
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display: grid; grid-template-cols: 2fr 1fr; gap: 20px; margin-bottom: 24px;">
          
          <!-- Booking details card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
              Reservation Information
            </div>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Booking ID</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.booking_id}</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Booking Date</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">
                  ${new Date(booking.created_at || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Package Name</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.package_title}</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Travel Date</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">
                  ${booking.travel_date ? new Date(booking.travel_date).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Reporting Time</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">06:00 PM (IST)</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Pickup Location</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">Majnu Ka Tilla, Delhi</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Travellers</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.travellers || 1} Person(s)</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 11px; font-weight: 500;">Sharing Choice</div>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.selected_sharing || 'Triple'} Sharing</div>
              </div>
            </div>
          </div>

          <!-- Customer QR card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${booking.booking_id}" 
              alt="Booking QR" 
              style="width: 110px; height: 110px; margin-bottom: 8px; border: 1px solid #cbd5e1; padding: 4px; background: #fff; border-radius: 8px;"
              crossorigin="anonymous"
            />
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Voucher QR ID</div>
          </div>
        </div>

        <!-- Customer info -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
            Traveler Details
          </div>
          <div style="display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 12px; font-size: 13px;">
            <div>
              <div style="color: #64748b; font-size: 11px; font-weight: 500;">Primary Traveler</div>
              <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.customer_name}</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 11px; font-weight: 500;">Mobile Number</div>
              <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.phone}</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 11px; font-weight: 500;">Email Address</div>
              <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.email || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Pricing details -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
            Billing summary
          </div>
          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; font-size: 14px;">
            <div>
              <div style="color: #64748b; font-size: 11px; font-weight: 500;">Amount Paid</div>
              <div style="font-size: 20px; font-weight: 900; color: #16a34a; margin-top: 2px;">₹${amountPaid.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 11px; font-weight: 500;">Remaining Balance</div>
              <div style="font-size: 20px; font-weight: 900; color: ${remainingAmount > 0 ? '#dc2626' : '#16a34a'}; margin-top: 2px;">
                ₹${remainingAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <!-- Terms and Conditions -->
        <div style="background-color: #fafaf9; border: 1px dashed #d6d3d1; border-radius: 16px; padding: 20px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #78716c; letter-spacing: 0.5px; margin-bottom: 10px;">
            Terms & Conditions
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #57534e; line-height: 1.6; font-weight: 555;">
            <li>Please carry a printout or digital copy of this voucher along with your government-issued ID card.</li>
            <li>Reporting time is strictly 30 minutes prior to departure. Boarding will close at the specified time.</li>
            <li>TripoMist is not liable for itinerary changes, delays, or cancellations caused by weather conditions, roadblocks, or force majeure events.</li>
            <li>In case of emergency support, call our 24/7 Helpline: <strong>+91 85265 49512</strong>.</li>
          </ul>
        </div>
      </div>

      <!-- Footer section -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; font-weight: 600;">
        <div>TripoMist Support Helpline: +91 85265 49512</div>
        <div style="display: flex; gap: 16px;">
          <span>support@tripomist.com</span>
          <span>www.tripomist.com</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  // Wait a moment for QR code image to fully load
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // 2x for retina quality rendering
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [595, 842], // standard A4 size in points
    });

    // Fit canvas image inside A4 sheet dimensions
    pdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);

    if (action === 'download') {
      pdf.save(`voucher-${booking.booking_id}.pdf`);
    } else if (action === 'open') {
      const string = pdf.output('bloburl');
      window.open(string);
    }
  } catch (err) {
    console.error('Error generating PDF voucher:', err);
  } finally {
    document.body.removeChild(container);
  }
};
