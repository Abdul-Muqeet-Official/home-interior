// assets/js/category.js
// Dynamically render products for a given category as a horizontal carousel.

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function renderCategory() {
  const catKey = getQueryParam('cat') || 'all';
  const titleEl = document.getElementById('category-title');
  const container = document.getElementById('cards-container');

  const allProducts = HIStore.getProducts();
  const filtered = catKey === 'all' ? allProducts : allProducts.filter(p => p.category === catKey);

  const titleMap = {
    laminate: 'Laminate Flooring',
    spc: 'SPC Flooring',
    vinyl: 'Vinyl Flooring',
    pvc: 'PVC Wall Panel',
    wallpaper: 'Wallpaper',
    foldingdoor: 'Folding Door',
    gypsum: 'Gypsum False Ceiling',
    blinds: 'Window Blinds',
    '3dpicture': '3D Wall Picture',
    grass: 'Artificial Grass',
    all: 'All Materials & Products'
  };
  titleEl.textContent = titleMap[catKey] || 'Category';

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-center text-gray-500">No items found for this category.</p>`;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'group rounded-xl overflow-hidden shadow-lg bg-white card snap-start flex-shrink-0 w-72 md:w-80';
    const discountTag = product.discount ? `<span class="absolute top-2 left-2 bg-brand-gold text-white text-xs px-2 py-1 rounded">SAVE ${product.discount}%</span>` : '';
    const oldPrice = product.oldPrice ? `<span class="line-through text-sm text-gray-500 mr-1">Rs. ${product.oldPrice}</span>` : '';
    const price = `<span class="text-brand-green font-semibold">Rs. ${product.price}</span>`;
    card.innerHTML = `
      <div class="relative">
        ${discountTag}
        <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div class="p-4">
        <h4 class="font-serif text-lg font-semibold mb-2">${product.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${product.category.toUpperCase()}</p>
        <div class="mb-3 flex items-center">${oldPrice}${price}</div>
        <div class="flex gap-2">
          <a href="pages/product-detail.html?id=${product.id}" class="bg-brand-green text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand-green/80 btn">VIEW DETAILS</a>
          <button class="bg-brand-green text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand-green/80 btn" onclick="openWhatsApp('${product.title}')">WhatsApp</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function attachCarouselControls() {
  const container = document.getElementById('cards-container');
  const prevBtn = document.getElementById('prev-card');
  const nextBtn = document.getElementById('next-card');
  const scrollAmount = () => container.clientWidth;

  prevBtn.addEventListener('click', () => {
    container.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    container.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategory();
  attachCarouselControls();
});

// Expose globally for inline calls
window.openWhatsApp = window.openWhatsApp || function(){console.warn('openWhatsApp not defined');};

// Dynamically render products for a given category as a horizontal carousel.

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function renderCategory() {
  const catKey = getQueryParam('cat') || 'all';
  const titleEl = document.getElementById('category-title');
  const container = document.getElementById('cards-container');

  const allProducts = HIStore.getProducts();
  const filtered = catKey === 'all' ? allProducts : allProducts.filter(p => p.category === catKey);

  const titleMap = {
    laminate: 'Laminate Flooring',
    spc: 'SPC Flooring',
    vinyl: 'Vinyl Flooring',
    pvc: 'PVC Wall Panel',
    wallpaper: 'Wallpaper',
    foldingdoor: 'Folding Door',
    gypsum: 'Gypsum False Ceiling',
    blinds: 'Window Blinds',
    '3dpicture': '3D Wall Picture',
    grass: 'Artificial Grass',
    all: 'All Materials & Products'
  };
  titleEl.textContent = titleMap[catKey] || 'Category';

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-center text-gray-500">No items found for this category.</p>`;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'group rounded-xl overflow-hidden shadow-lg bg-white card snap-start flex-shrink-0 w-72 md:w-80';
    const discountTag = product.discount ? `<span class="absolute top-2 left-2 bg-brand-gold text-white text-xs px-2 py-1 rounded">SAVE ${product.discount}%</span>` : '';
    const oldPrice = product.oldPrice ? `<span class="line-through text-sm text-gray-500 mr-1">Rs. ${product.oldPrice}</span>` : '';
    const price = `<span class="text-brand-green font-semibold">Rs. ${product.price}</span>`;
    card.innerHTML = `
      <div class="relative">
        ${discountTag}
        <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div class="p-4">
        <h4 class="font-serif text-lg font-semibold mb-2">${product.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${product.category.toUpperCase()}</p>
        <div class="mb-3 flex items-center">${oldPrice}${price}</div>
        <div class="flex gap-2">
          <a href="pages/product-detail.html?id=${product.id}" class="bg-brand-green text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand-green/80 btn">VIEW DETAILS</a>
          <button class="bg-brand-green text-white px-3 py-1 rounded text-sm font-medium hover:bg-brand-green/80 btn" onclick="openWhatsApp('${product.title}')">WhatsApp</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function attachCarouselControls() {
  const container = document.getElementById('cards-container');
  const prevBtn = document.getElementById('prev-card');
  const nextBtn = document.getElementById('next-card');
  const scrollAmount = () => {
    // Scroll by the width of the container (visible area)
    return container.clientWidth;
  };
  prevBtn.addEventListener('click', () => {
    container.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    container.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategory();
  attachCarouselControls();
});

// Expose globally for inline calls
window.openWhatsApp = window.openWhatsApp || function(){console.warn('openWhatsApp not defined');};

  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function renderCategory() {
  const catKey = getQueryParam('cat') || 'all';
  const titleEl = document.getElementById('category-title');
  const container = document.getElementById('cards-container');

  const allProducts = HIStore.getProducts();
  const filtered = catKey === 'all' ? allProducts : allProducts.filter(p => p.category === catKey);

  // Friendly title mapping
  const titleMap = {
    laminate: 'Laminate Flooring',
    spc: 'SPC Flooring',
    vinyl: 'Vinyl Flooring',
    pvc: 'PVC Wall Panel',
    wallpaper: 'Wallpaper',
    foldingdoor: 'Folding Door',
    gypsum: 'Gypsum False Ceiling',
    blinds: 'Window Blinds',
    '3dpicture': '3D Wall Picture',
    grass: 'Artificial Grass',
    all: 'All Materials & Products'
  };
  titleEl.textContent = titleMap[catKey] || 'Category';

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = `<p class="col-span-3 text-center text-gray-500">No items found for this category.</p>`;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'group rounded-xl overflow-hidden shadow-lg cursor-pointer bg-white hover:shadow-xl transition-shadow card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
      <div class="p-4">
        <h4 class="font-serif text-lg font-semibold mb-2">${product.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${product.category.toUpperCase()}</p>
        <ul class="text-xs text-gray-500 space-y-1 mb-3">
          <li>Spec 1: ${product.specs.spec1}</li>
          <li>Spec 2: ${product.specs.spec2}</li>
          <li>Spec 3: ${product.specs.spec3}</li>
        </ul>
        <button class="bg-brand-gold text-brand-charcoal px-4 py-2 rounded-sm text-sm font-medium hover:bg-brand-gold/80 btn" onclick="openWhatsApp('${product.title}')">Order via WhatsApp</button>
      </div>
    `;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', renderCategory);

// Expose globally for inline calls
window.openWhatsApp = window.openWhatsApp || function(){console.warn('openWhatsApp not defined');};

