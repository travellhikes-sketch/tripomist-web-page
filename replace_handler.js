const fs = require('fs');
let code = fs.readFileSync('react-app/src/pages/PackageCheckout.jsx', 'utf8');

const target = `      rzp.on('payment.failed', function (response) {
        setLoading(false);
        console.error('Razorpay payment.failed:', {
          code: response.error?.code,
          description: response.error?.description,
          source: response.error?.source,
          step: response.error?.step,
          reason: response.error?.reason,
          metadata: response.error?.metadata
        });
        // 12. Razorpay close/failure par reservation release mat karo; retry message dikhao
        const errorDesc = response.error?.description || 'Please try again.';
        const errorReason = response.error?.reason ? \` Reason: \${response.error.reason}\` : '';
        const errorCode = response.error?.code ? \` (\${response.error.code})\` : '';
        setError(\`Payment failed: \${errorDesc}\${errorReason}\${errorCode}\`);
        updateLead({
          p_current_step: 'payment_failed'
        });
      });`;

const replacement = `      rzp.on('payment.failed', function (response) {
        setLoading(false);
        const safeError = {
          code: response.error?.code,
          description: response.error?.description,
          source: response.error?.source,
          step: response.error?.step,
          reason: response.error?.reason,
          metadata: {
            order_id: response.error?.metadata?.order_id,
            payment_id: response.error?.metadata?.payment_id
          }
        };
        console.error('Razorpay payment.failed:', safeError);
        
        const errorCode = safeError.code ? \`\\nCode: \${safeError.code}\` : '';
        const errorDesc = safeError.description ? \`\\nDescription: \${safeError.description}\` : '\\nDescription: Please try again.';
        const errorReason = safeError.reason ? \`\\nReason: \${safeError.reason}\` : '';
        
        alert(\`Payment Failed:\${errorCode}\${errorDesc}\${errorReason}\`);

        // Keep the UI error state as well
        setError(\`Payment failed. \${safeError.description || 'Please try again.'}\`);
        updateLead({
          p_current_step: 'payment_failed'
        });
      });`;

if (code.includes(target)) {
  fs.writeFileSync('react-app/src/pages/PackageCheckout.jsx', code.replace(target, replacement));
  console.log('Successfully replaced');
} else {
  console.log('Target not found in file!');
}
