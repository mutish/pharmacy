document.addEventListener('DOMContentLoaded', () => {
  const products = [
    { name: 'Paracetamol', price: 120, description: 'Pain relief tablet.' },
    { name: 'Amoxicillin', price: 350, description: 'Antibiotic capsule.' },
    { name: 'Vitamin C', price: 200, description: 'Immunity booster.' }
  ];

  const productList = document.querySelector('.product-list');
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p><strong>Ksh ${product.price}</strong></p>
      <button>Add to Cart</button>
    `;
    productList.appendChild(card);
  });
});
