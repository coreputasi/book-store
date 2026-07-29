/* -------------------------------------------------
   BukaBuku Bookstore — cart logic
   Cart is persisted in localStorage so it survives
   page reloads. All DOM queries are scoped and
   null-checked so this script fails gracefully if
   the markup ever changes.
------------------------------------------------- */

(function () {
  "use strict";

  const CART_KEY = "bukabuku_cart";

  const els = {
    cartCount: document.getElementById("cart-count"),
    cartIndicator: document.getElementById("cart-indicator"),
    viewCartBtn: document.getElementById("view-cart-tbn"),
    checkoutBtn: document.getElementById("checkout-btn"),
    modalOverlay: document.getElementById("modal-overlay"),
    modalBody: document.getElementById("modal-body"),
    modalTotal: document.getElementById("modal-total"),
    modalClose: document.getElementById("modal-close"),
    toast: document.getElementById("toast"),
    addButtons: document.querySelectorAll(".btn-add"),
  };

  /** Read the cart from localStorage, defaulting to an empty array. */
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (err) {
      console.error("Could not read cart from storage:", err);
      return [];
    }
  }

  /** Persist the cart and refresh anything showing its state. */
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge(cart);
  }

  function formatIDR(amount) {
    return "Rp" + amount.toLocaleString("id-ID");
  }

  function updateCartBadge(cart) {
    if (!els.cartCount) return;
    const totalQty = cart.reduce((sum, line) => sum + line.qty, 0);
    els.cartCount.textContent = totalQty;
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2200);
  }

  function addToCart(id, title, price, buttonEl) {
    const cart = getCart();
    const existing = cart.find((line) => line.id === id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, title, price, qty: 1 });
    }

    saveCart(cart);
    showToast(
      `"${title.slice(0, 40)}${title.length > 40 ? "…" : ""}" added to cart`,
    );

    if (buttonEl) {
      const original = buttonEl.textContent;
      buttonEl.textContent = "Added ✓";
      buttonEl.classList.add("added");
      buttonEl.disabled = true;
      setTimeout(() => {
        buttonEl.textContent = original;
        buttonEl.classList.remove("added");
        buttonEl.disabled = false;
      }, 1200);
    }
  }

  function removeFromCart(id) {
    const cart = getCart().filter((line) => line.id !== id);
    saveCart(cart);
    renderCartModal();
  }

  function renderCartModal() {
    if (!els.modalBody || !els.modalTotal) return;
    const cart = getCart();

    if (cart.length === 0) {
      els.modalBody.innerHTML =
        '<p class="empty-cart">Your cart is empty. Browse the collection and add a title!</p>';
      els.modalTotal.textContent = formatIDR(0);
      return;
    }

    let total = 0;
    els.modalBody.innerHTML = cart
      .map((line) => {
        const lineTotal = line.price * line.qty;
        total += lineTotal;
        return `
                    <div class="cart-line">
                        <span>${line.title} × ${line.qty}</span>
                        <span>${formatIDR(lineTotal)}</span>
                        <button type="button" data-remove="${line.id}" aria-label="Remove ${line.title} from cart">Remove</button>
                    </div>
                `;
      })
      .join("");

    els.modalTotal.textContent = formatIDR(total);

    // Wire up the freshly-rendered "Remove" buttons.
    els.modalBody.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.remove));
    });
  }

  function openModal() {
    if (!els.modalOverlay) return;
    renderCartModal();
    els.modalOverlay.hidden = false;
    els.modalClose?.focus();
  }

  function closeModal() {
    if (!els.modalOverlay) return;
    els.modalOverlay.hidden = true;
  }

  function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
      showToast("Your cart is empty — add a book first.");
      return;
    }
    const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
    showToast(`Order placed! Total ${formatIDR(total)}`);
    saveCart([]);
    closeModal();
  }

  // ---------- Event wiring ----------
  els.addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      addToCart(card.id, card.dataset.title, Number(card.dataset.price), btn);
    });
  });

  els.viewCartBtn?.addEventListener("click", openModal);
  els.cartIndicator?.addEventListener("click", openModal);
  els.checkoutBtn?.addEventListener("click", handleCheckout);
  els.modalClose?.addEventListener("click", closeModal);

  els.modalOverlay?.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.modalOverlay && !els.modalOverlay.hidden) {
      closeModal();
    }
  });

  // Initialize badge count on page load.
  updateCartBadge(getCart());
})();
