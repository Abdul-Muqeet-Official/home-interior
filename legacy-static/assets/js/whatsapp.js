// assets/js/whatsapp.js
// Helper to open WhatsApp with a pre-filled message.
// Usage: openWhatsApp('Product Name')
function openWhatsApp(subject) {
  const phone = '923001234567'; // Business number
  const text = encodeURIComponent(`Hello HomeInteriorKarachi! I am interested in ${subject}. Please share details, catalog, and quotation.`);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank');
}

// Expose globally for inline calls
window.openWhatsApp = openWhatsApp;

