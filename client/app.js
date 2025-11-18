// --- Testimonial Carousel ---
const slides = document.getElementById('testimonialSlides');
const totalSlides = slides.children.length;
let currentSlide = 0;
let carouselInterval;

function showSlide(idx) {
  slides.style.transform = `translateX(-${idx * 100}%)`;
}

function startCarousel() {
  carouselInterval = setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
  }, 4000);
}

function stopCarousel() {
  clearInterval(carouselInterval);
}

document.getElementById('testimonialPrev').onclick = () => {
  stopCarousel();
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  showSlide(currentSlide);
  startCarousel();
};

document.getElementById('testimonialNext').onclick = () => {
  stopCarousel();
  currentSlide = (currentSlide + 1) % totalSlides;
  showSlide(currentSlide);
  startCarousel();
};

showSlide(currentSlide);
startCarousel();

// --- Scroll Reveal Animation ---
function revealOnScroll() {
  document.querySelectorAll('.animate-fadein').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 40) {
      el.classList.add('visible');
    }
  });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('DOMContentLoaded', revealOnScroll);

// --- Floating Chat Button ---
document.querySelector('.chat-btn').addEventListener('click', () => {
  alert('💬 Chat feature coming soon!');
});

// --- Product Cards ---
document.addEventListener('DOMContentLoaded', () => {
  const products = [
    { name: 'Paracetamol', price: 120, description: 'Pain relief tablet.' },
    { name: 'Amoxicillin', price: 350, description: 'Antibiotic capsule.' },
    { name: 'Vitamin C', price: 200, description: 'Immunity booster.' }
  ];

  const productList = document.querySelector('.product-list');
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'card bg-base-100 shadow';
    card.innerHTML = `
      <div class="card-body">
        <h3 class="card-title">${product.name}</h3>
        <p>${product.description}</p>
        <p><strong>Ksh ${product.price}</strong></p>
        <div class="card-actions justify-end">
          <button class="btn btn-primary btn-sm">Add to Cart</button>
        </div>
      </div>
    `;
    productList.appendChild(card);
  });
});

// --- Search Input Expand ---
const searchToggle = document.getElementById('searchToggle');
const searchInput = document.getElementById('searchInput');

searchToggle.addEventListener('click', () => {
  searchInput.classList.toggle('active');
  if (searchInput.classList.contains('active')) {
    searchInput.focus();
  } else {
    searchInput.blur();
  }
});

