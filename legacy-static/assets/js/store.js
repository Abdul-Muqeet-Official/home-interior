// assets/js/store.js
// Unified data layer: uses Supabase if credentials are present, otherwise falls back to mock data.

const SUPABASE_URL = 'https://oqfxtdcbpcjoxmnxbpte.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnh0ZGNicGNqb3htbnhicHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTA2MDksImV4cCI6MjEwNTQyNjYwOX0.Ap5iaXo1MTCZEYypXKEEpiHgHq7E5GuOURpKVnWA-o4';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  // Load Supabase client from CDN dynamically
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js')
    .then(({ createClient }) => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    })
    .catch(() => {
      console.warn('Supabase SDK failed to load; using mock data.');
    });
}

// --- Mock data fallback ----------------------------------------------------
const mockData = {
  products: [
    { id: 1, category: 'laminate', title: 'Classic Oak Laminate', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800', oldPrice: 20000, price: 16000, discount: 20 },
    { id: 2, category: 'spc', title: 'Matte Charcoal SPC', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800', oldPrice: 25000, price: 20000, discount: 20 },
    { id: 3, category: 'vinyl', title: 'Luxury Vinyl Plank', image: 'https://images.unsplash.com/photo-1600702687568-24c221a2ca06?auto=format&fit=crop&w=800', oldPrice: 18000, price: 14400, discount: 20 }
  ],
  projects: [
    { id: 1, title: 'DHA Phase 8 Villa', location: 'DHA, Karachi', before: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200', after: 'https://images.unsplash.com/photo-1584634974219-2c4082e4701d?auto=format&fit=crop&w=1200' }
  ],
  reviews: [
    { id: 1, name: 'Eleanor Vance', location: 'DHA Phase 6, Karachi', rating: 5, quote: 'The laminate flooring transformed our villa into a modern masterpiece.' }
  ]
};

// Helper to fetch data; prefers Supabase, falls back to mockData
async function getData(table) {
  if (supabase) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error && data) return data;
    console.warn(`Supabase ${table} fetch error:`, error);
  }
  return mockData[table] || [];
}

export const HIStore = {
  // Products
  async getProducts() {
    return await getData('products');
  },
  // Projects
  async getProjects() {
    return await getData('projects');
  },
  // Reviews
  async getReviews() {
    return await getData('reviews');
  },
  // Add a review (mock mode stores in localStorage)
  async addReview(review) {
    if (supabase) {
      const { error } = await supabase.from('reviews').insert(review);
      if (error) console.warn('Supabase addReview error:', error);
    } else {
      const key = 'hi_karachi_reviews';
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      review.id = Date.now();
      stored.push(review);
      localStorage.setItem(key, JSON.stringify(stored));
    }
  }
};

// expose globally for legacy scripts
window.HIStore = HIStore;

