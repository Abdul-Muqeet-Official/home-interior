// assets/js/app.js
// Home page interactive logic: hero carousel, category showcase auto-rotate, reviews carousel

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Hero Carousel ----------
  const heroSection = document.getElementById('hero-carousel');
  const heroImages = [
    'https://images.unsplash.com/photo-1584634974219-2c4082e4701d?auto=format&fit=crop&w=1600',
    'https://images.unsplash.com/photo-1600729130300-315a4e0c1f9c?auto=format&fit=crop&w=1600',
    'https://images.unsplash.com/photo-1590403635520-765d96d7aa41?auto=format&fit=crop&w=1600'
  ];
  let heroIndex = 0;
  heroSection.style.transition = 'opacity 1s ease-in-out';
  function rotateHero() {
    heroSection.style.opacity = '0';
    setTimeout(() => {
      heroSection.style.backgroundImage = `url(${heroImages[heroIndex]})`;
      heroSection.style.opacity = '1';
      heroIndex = (heroIndex + 1) % heroImages.length;
    }, 500); // half-second fade
  }
  rotateHero();
  setInterval(rotateHero, 5000); // 5 seconds interval
  // ---------- Category Showcase ----------
  const showcaseImg = document.getElementById('showcase-img');
  const showcaseLabel = document.getElementById('showcase-cat-label');
  const showcaseTitle = document.getElementById('showcase-title');
  const showcaseDesc = document.getElementById('showcase-desc');
  const spec1 = document.getElementById('spec1');
  const spec2 = document.getElementById('spec2');
  const spec3 = document.getElementById('spec3');
  const counter = document.getElementById('showcase-counter');
  const viewLink = document.getElementById('view-category-link');

  const categories = [
    {key: 'laminate', name: 'Laminate Flooring'},
    {key: 'spc', name: 'SPC Flooring'},
    {key: 'vinyl', name: 'Vinyl Flooring'},
    {key: 'pvc', name: 'PVC Wall Panel'},
    {key: 'wallpaper', name: 'Wallpaper'},
    {key: 'foldingdoor', name: 'Folding Door'},
    {key: 'gypsum', name: 'Gypsum False Ceiling'},
    {key: 'blinds', name: 'Window Blinds'},
    {key: '3dpicture', name: '3D Wall Picture'},
    {key: 'grass', name: 'Artificial Grass'}
  ];

  let catIndex = 0;
  function renderCategory(idx) {
    const cat = categories[idx];
    const products = HIStore.getProducts().filter(p => p.category === cat.key);
    // pick the first product as showcase (fallback to placeholder)
    const product = products[0] || {image: '', title: cat.name, specs: {spec1:'', spec2:'', spec3:''}};
    showcaseImg.src = product.image || 'https://via.placeholder.com/800x600?text=' + encodeURIComponent(cat.name);
    showcaseLabel.textContent = cat.name.toUpperCase();
    showcaseTitle.textContent = product.title;
    showcaseDesc.textContent = product.title + ' – Premium quality ' + cat.name.toLowerCase() + '.';
    spec1.textContent = product.specs.spec1 || '';
    spec2.textContent = product.specs.spec2 || '';
    spec3.textContent = product.specs.spec3 || '';
    counter.textContent = `0${idx+1}/0${categories.length}`;
    viewLink.href = `pages/category.html?cat=${cat.key}`;
  }
  renderCategory(catIndex);

  document.getElementById('next-cat').addEventListener('click', () => {
    catIndex = (catIndex + 1) % categories.length;
    renderCategory(catIndex);
  });
  document.getElementById('prev-cat').addEventListener('click', () => {
    catIndex = (catIndex - 1 + categories.length) % categories.length;
    renderCategory(catIndex);
  });
  // Auto rotate every 4 seconds
  setInterval(() => {
    catIndex = (catIndex + 1) % categories.length;
    renderCategory(catIndex);
  }, 4000);

  // ---------- Reviews Carousel ----------
  const reviewsData = HIStore.getReviews();
  const carousel = document.getElementById('reviews-carousel');
  const dots = document.getElementById('reviews-dots');
  let revIdx = 0;
  function renderReviews() {
    carousel.innerHTML = '';
    dots.innerHTML = '';
    reviewsData.forEach((rev, i) => {
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
      dot.addEventListener('click', () => { revIdx = i; updateReviews(); resetRevInterval(); });
      dots.appendChild(dot);
    });
    updateReviews();
  }

  function updateReviews() {
    carousel.style.transform = `translateX(-${revIdx * 100}%)`;
    const dotButtons = dots.children;
    for(let i=0;i<dotButtons.length;i++){
      dotButtons[i].className = i===revIdx ? 'w-8 h-2 bg-brand-gold rounded transition-all' : 'w-2 h-2 bg-gray-500 rounded transition-all';
    }
  }

  function nextReview(){
    revIdx = (revIdx + 1) % reviewsData.length;
    updateReviews();
  }

  let revInterval = setInterval(nextReview, 5000);
  function resetRevInterval(){
    clearInterval(revInterval);
    revInterval = setInterval(nextReview, 5000);
  }

  renderReviews();
});

