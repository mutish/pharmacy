// Payment and order submission logic
console.log('Checkout script loaded');

const API_BASE = "http://localhost:5000/api";

let user = null;
try {
  const u = localStorage.getItem('user');
  if (u) user = JSON.parse(u);
} catch (e) {
  user = null;
}

const loaderOverlay = document.getElementById?.('loaderOverlay'); // guard for direct script import in head
const paymentModal = document.getElementById?.('paymentModal');

function $(id){ return document.getElementById(id); }

async function loadCartAndRender() {
  if (!user || !user._id) {
    // redirect to login or show empty
    console.warn("No user in localStorage");
    renderEmptyCart();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cart/getCart/${user._id}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch cart: ${res.status}`);
    const data = await res.json();
    // map populated product info to UI-friendly item list
    const items = data
      .filter(ci => ci.productId)
      .map(ci => ({
        cartItemId: ci._id,
        name: ci.productId.productName || ci.productId.name || 'Unnamed',
        qty: ci.quantity,
        price: Number(ci.productId.price || 0),
        image: ci.productId.imageUrl || ''
      }));
    renderOrderSummary(items);
  } catch (err) {
    console.error("Error loading cart for checkout:", err);
    renderEmptyCart();
  }
}

function renderEmptyCart() {
  const ul = $('orderSummary');
  if (ul) ul.innerHTML = '<li class="text-center text-gray-500">Your cart is empty.</li>';
  $('totalAmount').textContent = 'Ksh 0';
  $('payBtn').disabled = true;
}

function renderOrderSummary(items) {
  const ul = $('orderSummary');
  ul.innerHTML = '';
  let subtotal = 0;
  items.forEach(it => {
    const li = document.createElement('li');
    li.className = "flex justify-between items-center py-2 border-b border-base-200";
    li.innerHTML = `<span class="font-semibold">${it.name} <span class="text-gray-500">x${it.qty}</span></span>
                    <span class="text-base font-medium">Ksh ${(it.price * it.qty).toLocaleString()}</span>`;
    ul.appendChild(li);
    subtotal += it.price * it.qty;
  });
  const deliveryFee = 150;
  $('totalAmount').textContent = `Ksh ${(subtotal + deliveryFee).toLocaleString()}`;
  // enable pay button if user present (form validation will further gate)
  validateForm();
}

function validateForm() {
  const location = $('deliveryLocation')?.value.trim();
  const phone = $('phoneNumber')?.value.trim();
  const payBtn = $('payBtn');
  if (!payBtn) return;
  payBtn.disabled = !(location && /^07\d{8}$/.test(phone));
}

async function submitCheckoutFlow(e) {
  e.preventDefault();
  if (!user || !user._id) {
    alert('Please log in.');
    window.location.href = '/client/index.html';
    return;
  }
  const deliveryAddress = $('deliveryLocation').value.trim();
  const phoneNumber = $('phoneNumber').value.trim();

  // show loader
  $('loaderOverlay').classList.remove('hidden');

  try {
    // 1) create order from cart (server creates order from cart items)
    const orderRes = await fetch(`${API_BASE}/orders/new`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id })
    });
    if (!orderRes.ok) {
      const txt = await orderRes.text().catch(()=>null);
      throw new Error(`Order creation failed: ${orderRes.status} ${txt||''}`);
    }
    const orderData = await orderRes.json();
    const orderId = orderData.order?.orderId || orderData.orderId || orderData.order?._id;

    if (!orderId) throw new Error('OrderId missing from order response');

    // 2) create checkout (will calculate total and persist)
    const checkoutRes = await fetch(`${API_BASE}/checkout/new`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, phoneNumber, deliveryAddress })
    });
    if (!checkoutRes.ok) {
      const txt = await checkoutRes.text().catch(()=>null);
      throw new Error(`Checkout creation failed: ${checkoutRes.status} ${txt||''}`);
    }
    const checkoutData = await checkoutRes.json();

    // 3) initiate STK push via backend MPESA endpoint
    // prefer checkout.checkoutId (CO...) otherwise use Mongo _id
    const checkoutIdentifier = checkoutData.checkout?.checkoutId || checkoutData.checkout?._id;
    const stkRes = await fetch(`${API_BASE}/mpesa/stkpush`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, checkoutId: checkoutIdentifier })
    });

    let stkJson = null;
    if (stkRes.ok) {
      stkJson = await stkRes.json();
      // show success modal with backend response
      showPaymentModal({ checkout: checkoutData.checkout, stk: stkJson, message: 'STK Push initiated' });
    } else {
      const txt = await stkRes.text().catch(()=>null);
      console.error('STK push failed', stkRes.status, txt);
      showPaymentModal({ checkout: checkoutData.checkout, error: true, message: 'Failed to initiate STK push' });
    }

  } catch (err) {
    console.error("Checkout flow error:", err);
    showPaymentModal({ message: 'Payment initiation failed. Please try again.', error: true });
  } finally {
    $('loaderOverlay').classList.add('hidden');
  }
}

function showPaymentModal(result) {
  const modal = document.getElementById('paymentModal');
  const icon = document.getElementById('modalIcon');
  const title = document.getElementById('modalTitle');
  const msg = document.getElementById('modalMsg');

  // prefer explicit checkout.status from server, fallback to stk presence
  const status = result?.checkout?.status;
  const hasStk = !!result?.stk;

  if (status === 'initiated' || hasStk) {
    icon.textContent = '📲';
    title.textContent = 'STK Push Initiated';
    msg.textContent = result?.message || 'An MPESA prompt has been sent to your phone. Complete the payment on your device.';
  } else if (status === 'successful' || result?.checkout?.status === 'successful') {
    icon.textContent = '✅';
    title.textContent = 'Payment Confirmed';
    msg.textContent = 'Payment received. Redirecting to orders...';
    setTimeout(()=> window.location.href = 'orders.html', 1500);
  } else if (result && !result.error) {
    icon.textContent = 'ℹ️';
    title.textContent = result.message || 'Checkout';
    msg.textContent = JSON.stringify(result);
  } else {
    icon.textContent = '❌';
    title.textContent = 'Payment Error';
    msg.textContent = (result && result.message) || 'Failed to initiate payment.';
  }
  if (modal && modal.showModal) modal.showModal();
}

document.addEventListener('DOMContentLoaded', () => {
  // attach listeners
  const form = $('checkoutForm');
  if (form) form.addEventListener('submit', submitCheckoutFlow);
  const delivery = $('deliveryLocation');
  const phone = $('phoneNumber');
  if (delivery) delivery.addEventListener('input', validateForm);
  if (phone) phone.addEventListener('input', validateForm);

  // initial load
  loadCartAndRender();
});