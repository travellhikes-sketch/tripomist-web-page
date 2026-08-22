export const formatSlugToTitle = (slug) => {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function getPackageDuration(destination, packageTitle) {
  const dest = (destination || packageTitle || '').toLowerCase();
  if (dest.includes('ladakh')) return '6N/7D';
  if (dest.includes('spiti')) return '5N/6D';
  if (dest.includes('kashmir')) return '5N/6D';
  if (dest.includes('meghalaya')) return '5N/6D';
  if (dest.includes('kerala')) return '5N/6D';
  if (dest.includes('andaman')) return '5N/6D';
  if (dest.includes('goa')) return '4N/5D';
  if (dest.includes('rajasthan')) return '5N/6D';
  if (dest.includes('himachal')) return '4N/5D';
  if (dest.includes('uttarakhand')) return '4N/5D';
  return 'N/A';
}
