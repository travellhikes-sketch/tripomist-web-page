import fs from 'fs';

let content = fs.readFileSync('src/pages/PackageCheckout.jsx', 'utf-8');

// The validation line in ProceedToPayment
const validation_old = `      if (remainingToAllocate !== 0) {
        throw new Error('Sharing allocation must exactly match the total number of travellers.');
      }
      const incompleteExtra = additionalTravellers.some(t => !t.fullName.trim() || !t.phone.trim() || !t.email.trim());`;

const validation_new = `      if (remainingToAllocate !== 0) {
        throw new Error('Sharing allocation must exactly match the total number of travellers.');
      }

      const capacities = { 'Quad Sharing': 4, 'Triple Sharing': 3, 'Double Sharing': 2 };
      for (const [type, allocated] of Object.entries(sharingAllocation)) {
        if (allocated > 0 && allocated % capacities[type] !== 0) {
          throw new Error(\`Allocation for \${type} must be a multiple of \${capacities[type]}.\`);
        }
      }

      const incompleteExtra = additionalTravellers.some(t => !t.fullName.trim() || !t.phone.trim() || !t.email.trim());`;

content = content.replace(validation_old, validation_new);

// The 'sharingStr' logic that was used in edge function payload
const sharing_str_old = `      const sharingStr = Object.entries(sharingAllocation).filter(([k,v]) => v > 0).map(([k,v]) => \`\${k}: \${v}\`).join(', ');`;
const sharing_str_new = `      const sharingStr = Object.entries(sharingAllocation).filter(([k,v]) => v > 0).map(([k,v]) => \`\${k}: \${v}\`).join(', ');
      const primarySharing = Object.keys(sharingAllocation).find(k => sharingAllocation[k] > 0) || selectedSharing;`;

content = content.replace(sharing_str_old, sharing_str_new);

// Replace selectedSharing payloads
content = content.replace(
    /selectedSharing: sharingStr,/g,
    `selectedSharing: primarySharing,\n          sharingAllocation,\n          additionalTravellers,`
);

content = content.replace(
    /p_selected_sharing: sharingStr,/g,
    `p_selected_sharing: primarySharing,`
);

fs.writeFileSync('src/pages/PackageCheckout.jsx', content);
