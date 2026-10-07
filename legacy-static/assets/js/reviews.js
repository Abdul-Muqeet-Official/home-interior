// assets/js/reviews.js
// Handles the reviews carousel on reviews.html and the submission form.

document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('reviews-carousel');
  const dots = document.getElementById('reviews-dots');
  const form = document.getElementById('review-form');

  let reviews = HIStore.getReviews();
  let currentIdx = 0;
  let intervalId;

  function renderCarousel() {
    carousel.innerHTML = '';
    dots.innerHTML = '';
    reviews.forEach((rev, i) => {
      const slide = document.createElement('div');
      slide.className = 'w-full flex-shrink-0 px-4 text-center';
      slide.innerHTML = `
        <div class="flex justify-center gap-1 text-xl mb-4">
          ${Array.from({length:5}, (_,s)=>`<i class="ph ${s < rev.rating ? 'ph-fill ph-star text-brand-gold' : 'ph-star text-gray-400'}"></i>`).join('')}
        </div>
        <p class="font-serif text-2xl md:text-3xl italic mb-6 max-w-2xl mx-auto">"${rev.quote}"</p>
        <h5 class="font-bold text-lg tracking-widest uppercase">${rev.name}</h5>
        <p class="text-brand-gold text-sm uppercase mt-1">${rev.location}</p>
      `;
      carousel.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = i===0 ? 'w-8 h-2 bg-brand-gold rounded transition-all' : 'w-2 h-2 bg-gray-500 rounded transition-all';
      dot.addEventListener('click', () => { currentIdx = i; updateCarousel(); resetInterval(); });
      dots.appendChild(dot);
    });
    updateCarousel();
  }

  function updateCarousel() {
    carousel.style.transform = `translateX(-${currentIdx * 100}%)`;
    const dotButtons = dots.children;
    for (let i = 0; i < dotButtons.length; i++) {
      dotButtons[i].className = i===currentIdx ? 'w-8 h-2 bg-brand-gold rounded transition-all' : 'w-2 h-2 bg-gray-500 rounded transition-all';
    }
  }

  function nextSlide() {
    currentIdx = (currentIdx + 1) % reviews.length;
    updateCarousel();
  }

  function resetInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(nextSlide, 5000);
  }

  // Initial render and auto‑rotate
  renderCarousel();
  intervalId = setInterval(nextSlide, 5000);

  // ---------- Form handling ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value.trim();
    const rating = parseInt(document.getElementById('rating').value);
    const quote = document.getElementById('quote').value.trim();
    if (!name || !location || !rating || !quote) return;
    const newReview = { id: Date.now(), name, location, rating, quote };
    HIStore.addReview(newReview);
    // Refresh local cache & UI
    reviews = HIStore.getReviews();
    renderCarousel();
    form.reset();
  });
});

