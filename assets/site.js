let products = [];
let catalog = [];
let activeCategory = "all";
const api = window.ArchhaApi;

function formatMoney(amount) {
  return `Rs. ${amount}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("archhaUser") || "null");
  } catch {
    return null;
  }
}

function getAuthToken() {
  return getAuthUser()?.token || "";
}

async function loadProductsFromApi() {
  try {
    const data = await api.products.list();
    products = Array.isArray(data.products) ? data.products : [];
    catalog = [...products];
  } catch (error) {
    showToast(error.message || "Product API unavailable.", "error");
  }
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.className = "toast";
  }, 2600);
}

function loadingMarkup(message = "Loading...") {
  return `<div class="loading-state"><span class="spinner" aria-hidden="true"></span><span>${message}</span></div>`;
}

function setBusy(button, isBusy, busyText = "Please wait...") {
  if (!button) return;
  if (isBusy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

function setFormMessage(form, message, type = "info") {
  if (!form) return;
  let box = form.querySelector(".form-message");
  if (!box) {
    box = document.createElement("div");
    box.className = "form-message";
    form.prepend(box);
  }
  box.className = `form-message ${type}`;
  box.textContent = message;
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("archhaCart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("archhaCart", JSON.stringify(cart));
  updateCartCount();
}

function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem("archhaOrders") || "[]");
  } catch {
    return [];
  }
}

function saveLocalOrder(order) {
  const orders = getLocalOrders().filter(item => item.id !== order.id);
  orders.unshift(order);
  localStorage.setItem("archhaOrders", JSON.stringify(orders.slice(0, 20)));
  localStorage.setItem("archhaLastOrder", JSON.stringify(order));
}

function getLocalNotifications() {
  try {
    return JSON.parse(localStorage.getItem("archhaNotifications") || "[]");
  } catch {
    return [];
  }
}

function saveNotification(title, message, type = "info") {
  const notification = {
    id: `NOTE-${Date.now().toString().slice(-6)}`,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  const next = [notification, ...getLocalNotifications()].slice(0, 30);
  localStorage.setItem("archhaNotifications", JSON.stringify(next));
  api.notifications?.create?.({
    ...notification,
    phone: getAuthUser()?.phone || ""
  })?.catch?.(() => {});
  renderNotifications();
  return notification;
}

function getLocalReviews(productId = "") {
  try {
    const reviews = JSON.parse(localStorage.getItem("archhaReviews") || "[]");
    return productId ? reviews.filter(review => review.productId === productId) : reviews;
  } catch {
    return [];
  }
}

function saveLocalReview(review) {
  const reviews = [review, ...getLocalReviews()].slice(0, 100);
  localStorage.setItem("archhaReviews", JSON.stringify(reviews));
}

function getDisplayRating(product) {
  const reviews = getLocalReviews(product.id);
  if (!reviews.length) return product.rating;
  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  return average.toFixed(1);
}

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem("archhaSearchHistory") || "[]");
  } catch {
    return [];
  }
}

function saveSearchHistory(query, source = "site") {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return;
  const record = {
    id: `SEARCH-${Date.now().toString().slice(-6)}`,
    query: cleanQuery,
    source,
    phone: getAuthUser()?.phone || "",
    createdAt: new Date().toISOString()
  };
  const next = [record, ...getSearchHistory().filter(item => item.query.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, 12);
  localStorage.setItem("archhaSearchHistory", JSON.stringify(next));
  api.searchHistory?.create?.(record)?.catch?.(() => {});
  renderSearchHistoryPanel();
}

function renderSearchHistoryPanel() {
  const panel = document.getElementById("searchHistoryPanel");
  if (!panel) return;
  const history = getSearchHistory();
  panel.innerHTML = history.length ? `
    <div class="search-history-head">
      <strong>Recent searches</strong>
      <button type="button" onclick="clearSearchHistory()">Clear</button>
    </div>
    <div class="search-history-list">
      ${history.map(item => `<a href="shop.html?q=${encodeURIComponent(item.query)}">${escapeHtml(item.query)}</a>`).join("")}
    </div>
  ` : "";
}

function clearSearchHistory() {
  localStorage.removeItem("archhaSearchHistory");
  renderSearchHistoryPanel();
  showToast("Search history cleared.", "success");
}

function renderNotifications() {
  const panel = document.getElementById("notificationsPanel");
  if (!panel) return;
  const notifications = getLocalNotifications();
  panel.innerHTML = `
    <div class="notification-head">
      <div>
        <strong>Notifications</strong>
        <span>${notifications.length ? `${notifications.length} recent updates` : "No updates yet"}</span>
      </div>
      ${notifications.length ? `<button type="button" onclick="clearNotifications()">Clear</button>` : ""}
    </div>
    ${notifications.length ? `<div class="notification-list">
      ${notifications.slice(0, 5).map(note => `
        <div class="notification-item ${note.type}">
          <strong>${escapeHtml(note.title)}</strong>
          <span>${escapeHtml(note.message)}</span>
        </div>
      `).join("")}
    </div>` : ""}
  `;
}

function clearNotifications() {
  localStorage.removeItem("archhaNotifications");
  renderNotifications();
  showToast("Notifications cleared.", "success");
}

function getCartRows() {
  return getCart()
    .map(item => {
      const product = catalog.find(productItem => productItem.id === item.id);
      return product ? { ...product, qty: item.qty } : null;
    })
    .filter(Boolean);
}

function getCartTotals() {
  const rows = getCartRows();
  const subtotal = rows.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = 0;
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  const total = Math.max(subtotal - discount + delivery, 0);
  return { rows, subtotal, discount, delivery, total };
}

function updateCartCount() {
  const count = getCart().reduce((total, item) => total + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = count;
  });
}

async function syncLocalCartToBackend() {
  const token = getAuthToken();
  if (!token) return false;
  const cart = getCart();
  await api.cart.clear(token);
  for (const item of cart) {
    await api.cart.add(token, item.id, item.qty);
  }
  return true;
}

async function addToCart(productIdOrName) {
  const product = catalog.find(item => item.id === productIdOrName || item.name === productIdOrName);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, qty: 1 });

  saveCart(cart);
  renderCart();
  renderCheckout();
  showToast(`${product.name} added to cart.`);

  if (getAuthToken()) {
    try {
      await api.cart.add(getAuthToken(), product.id, 1);
    } catch (error) {
      showToast(error.message || "Cart sync failed.", "error");
    }
  }
}

function addBundle() {
  showToast("No value basket is available yet.", "info");
}

async function updateCartQuantity(productId, qty) {
  const nextQty = Math.max(1, Number(qty) || 1);
  const cart = getCart().map(item => item.id === productId ? { ...item, qty: nextQty } : item);
  saveCart(cart);
  renderCart();
  renderCheckout();

  if (getAuthToken()) {
    try {
      await api.cart.update(getAuthToken(), productId, nextQty);
    } catch (error) {
      showToast(error.message || "Cart sync failed.", "error");
    }
  }
}

async function removeFromCart(productId) {
  saveCart(getCart().filter(item => item.id !== productId));
  renderCart();
  renderCheckout();
  showToast("Product removed from cart.");

  if (getAuthToken()) {
    try {
      await api.cart.remove(getAuthToken(), productId);
    } catch (error) {
      showToast(error.message || "Cart sync failed.", "error");
    }
  }
}

async function clearCart(silent = false) {
  saveCart([]);
  localStorage.removeItem("archhaCoupon");
  renderCart();
  renderCheckout();
  if (!silent) showToast("Cart cleared.");

  if (getAuthToken()) {
    try {
      await api.cart.clear(getAuthToken());
    } catch {
      // Local cart is already cleared.
    }
  }
}

function initProductGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const resultsCount = document.getElementById("resultsCount");
  const tabs = document.querySelectorAll("[data-category]");
  const queryFromNav = new URLSearchParams(window.location.search).get("q");

  if (searchInput && queryFromNav) searchInput.value = queryFromNav;
  if (queryFromNav) saveSearchHistory(queryFromNav, "url");

  function renderProducts() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleProducts = products.filter(product => {
      const matchesCategory = activeCategory === "all" || product.type === activeCategory;
      const searchableText = `${product.name} ${product.fragrance} ${product.sub}`.toLowerCase();
      return matchesCategory && searchableText.includes(query);
    });

    if (sortSelect?.value === "low") visibleProducts = visibleProducts.sort((a, b) => a.price - b.price);
    if (sortSelect?.value === "high") visibleProducts = visibleProducts.sort((a, b) => b.price - a.price);

    grid.innerHTML = visibleProducts.length ? visibleProducts.map(product => `
      <article class="product-card">
        <a class="product-link" href="product.html?id=${product.id}" aria-label="View ${product.name} details">
          <div class="product-art ${product.type}">
            <span class="tag">${product.tag}</span>
            <div class="product-visual" aria-hidden="true">${product.icon}</div>
          </div>
        </a>
        <div class="product-info">
          <a class="product-name" href="product.html?id=${product.id}">${product.name}</a>
          <p class="product-sub">${product.sub}</p>
          <span class="fragrance">${product.fragrance}</span>
          <div class="rating">Rating ${getDisplayRating(product)} / 5</div>
          <div class="price-row">
            <span class="price">${formatMoney(product.price)}</span>
            <button class="add-btn" type="button" onclick="addToCart('${product.id}')">Add</button>
          </div>
        </div>
      </article>
    `).join("") : `<p class="section-text">No products found. Try another grocery item or aisle.</p>`;

    if (resultsCount) {
      const noun = visibleProducts.length === 1 ? "product" : "products";
      resultsCount.textContent = query
        ? `${visibleProducts.length} ${noun} found for "${searchInput.value.trim()}"`
        : `${visibleProducts.length} ${noun} available`;
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      activeCategory = tab.dataset.category;
      tabs.forEach(item => item.classList.toggle("active", item === tab));
      renderProducts();
    });
  });

  searchInput?.addEventListener("input", renderProducts);
  searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") saveSearchHistory(searchInput.value, "shop");
  });
  sortSelect?.addEventListener("change", renderProducts);
  renderProducts();
}

function initProductDetail() {
  const detailRoot = document.getElementById("productDetail");
  if (!detailRoot) return;

  const productId = new URLSearchParams(window.location.search).get("id");
  const product = catalog.find(item => item.id === productId);
  if (!product) {
    detailRoot.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration" aria-hidden="true"></div>
        <h2>No product available.</h2>
        <p class="section-text">Products added from the admin panel will appear here.</p>
        <a class="btn btn-dark" href="shop.html">Back to Shop</a>
      </div>
    `;
    return;
  }
  document.title = `${product.name} | Archha Grocery`;
  const displayRating = getDisplayRating(product);

  detailRoot.innerHTML = `
    <div class="product-detail-art product-art ${product.type}">
      <span class="tag">${product.tag}</span>
      <div class="product-visual" aria-hidden="true">${product.icon}</div>
    </div>
    <div class="product-detail-info">
      <div class="kicker">${product.type} product</div>
      <h1>${product.name}</h1>
      <p class="copy">${product.description}</p>
      <span class="fragrance">${product.fragrance}</span>
      <div class="rating">Rating ${displayRating} / 5</div>
      <div class="detail-price">${formatMoney(product.price)}</div>
      <div class="actions">
        <button class="btn btn-dark" type="button" onclick="addToCart('${product.id}')">Add to Cart</button>
        <a class="btn btn-primary" href="shop.html">Back to Shop</a>
      </div>
      <div class="detail-grid">
        <div class="card"><h3>Pack size</h3><p>${product.pack}</p></div>
        <div class="card"><h3>Shelf life</h3><p>${product.burnTime}</p></div>
        <div class="card"><h3>Best use</h3><p>${product.use}</p></div>
        <div class="card"><h3>Delivery</h3><p>Free delivery above Rs. 499. Dispatch for ready stock within 24 hours.</p></div>
      </div>
      <div class="reviews-block" id="reviewsBlock" data-product-id="${product.id}"></div>
    </div>
  `;
  renderProductReviews(product.id);
}

async function loadReviews(productId) {
  try {
    const result = await api.reviews.list(productId);
    return Array.isArray(result.reviews) ? result.reviews : [];
  } catch (error) {
    showToast(error.message || "Reviews could not be loaded.", "error");
    return [];
  }
}

async function renderProductReviews(productId) {
  const block = document.getElementById("reviewsBlock");
  if (!block) return;
  const reviews = await loadReviews(productId);
  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : "No ratings yet";

  const ratingCounts = [5, 4, 3, 2, 1].map(score => ({
    score,
    count: reviews.filter(review => Number(review.rating) === score).length
  }));

  block.innerHTML = `
    <div class="reviews-head">
      <div>
        <div class="kicker">Classic reviews</div>
        <h2>Customer rating: ${average}</h2>
      </div>
      <span class="rating">${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}</span>
    </div>
    <div class="rating-breakdown">
      ${ratingCounts.map(row => `
        <div class="rating-row">
          <span>${row.score} star</span>
          <div><i style="width:${reviews.length ? Math.round((row.count / reviews.length) * 100) : 0}%"></i></div>
          <strong>${row.count}</strong>
        </div>
      `).join("")}
    </div>
    <form class="review-form" id="reviewForm">
      <div class="form-grid">
        <div class="field">
          <label for="reviewName">Name</label>
          <input id="reviewName" name="name" required placeholder="Your name" />
        </div>
        <div class="field">
          <label for="reviewTitle">Review title</label>
          <input id="reviewTitle" name="title" required placeholder="Short review headline" />
        </div>
        <div class="field">
          <label for="reviewRating">Rating</label>
          <select id="reviewRating" name="rating" required>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Bad</option>
          </select>
        </div>
        <div class="field">
          <label for="reviewRecommend">Would recommend?</label>
          <select id="reviewRecommend" name="recommend">
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Not sure">Not sure</option>
          </select>
        </div>
        <div class="field">
          <label for="reviewPros">Pros</label>
          <input id="reviewPros" name="pros" placeholder="Fresh, good packing, value" />
        </div>
        <div class="field">
          <label for="reviewCons">Cons</label>
          <input id="reviewCons" name="cons" placeholder="Optional" />
        </div>
        <div class="field full">
          <label for="reviewComment">Review</label>
          <textarea id="reviewComment" name="comment" required placeholder="Share product quality, packing, freshness, or delivery feedback"></textarea>
        </div>
        <label class="check-row field full">
          <input type="checkbox" name="verified" value="true" />
          <span>I bought this product from Archha Grocery</span>
        </label>
        <div class="field full">
          <button type="submit">Submit Review</button>
        </div>
      </div>
    </form>
    <div class="review-list">
      ${reviews.length ? reviews.map(review => `
        <article class="review-card">
          <div class="review-card-head">
            <div>
              <strong>${escapeHtml(review.title || "Customer review")}</strong>
              <span>${escapeHtml(review.name || "Customer")}${review.verified ? " | Verified buyer" : ""}</span>
            </div>
            <span class="rating">${Number(review.rating || 0).toFixed(1)} / 5</span>
          </div>
          <p>${escapeHtml(review.comment || "No comment added.")}</p>
          <div class="review-meta">
            ${review.pros ? `<span>Pros: ${escapeHtml(review.pros)}</span>` : ""}
            ${review.cons ? `<span>Cons: ${escapeHtml(review.cons)}</span>` : ""}
            <span>Recommend: ${escapeHtml(review.recommend || "Not sure")}</span>
            <span>${Number(review.helpful || 0)} found this helpful</span>
          </div>
        </article>
      `).join("") : `<p class="section-text">No reviews yet. Be the first customer to rate this product.</p>`}
    </div>
  `;

  document.getElementById("reviewForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Saving...");
    const payload = Object.fromEntries(new FormData(form).entries());
    const review = {
      id: `REVIEW-${Date.now().toString().slice(-6)}`,
      productId,
      name: payload.name,
      title: payload.title,
      rating: Number(payload.rating),
      recommend: payload.recommend,
      pros: payload.pros || "",
      cons: payload.cons || "",
      verified: payload.verified === "true",
      helpful: 0,
      comment: payload.comment,
      createdAt: new Date().toISOString()
    };
    try {
      const result = await api.reviews.create(review);
      saveLocalReview(result.review || review);
    } catch (error) {
      setFormMessage(form, error.message || "Review could not be saved.", "error");
      showToast(error.message || "Review could not be saved.", "error");
      setBusy(submitButton, false);
      return;
    }
    saveNotification("Review saved", `Your ${review.rating}/5 review was added.`, "success");
    showToast("Review saved.", "success");
    form.reset();
    setBusy(submitButton, false);
    renderProductReviews(productId);
  });
}

function renderSummary(root, showCheckoutButton) {
  const { rows, subtotal, discount, delivery, total } = getCartTotals();
  if (!root) return;

  root.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
    <div class="summary-row"><span>Discount</span><strong>${discount ? `- ${formatMoney(discount)}` : formatMoney(0)}</strong></div>
    <div class="summary-row"><span>Delivery</span><strong>${delivery ? formatMoney(delivery) : "Free"}</strong></div>
    <div class="summary-row total"><span>Total</span><strong>${formatMoney(total)}</strong></div>
    ${subtotal > 0 && subtotal < 499 ? `<p class="summary-note">Add ${formatMoney(499 - subtotal)} more for free delivery.</p>` : `<p class="summary-note">${subtotal ? "Free delivery is active on this order." : "Cart is empty."}</p>`}
    ${showCheckoutButton ? `<a class="btn btn-dark checkout-link ${rows.length ? "" : "disabled"}" href="${rows.length ? "checkout.html" : "#"}">Proceed to Checkout</a>` : ""}
  `;
}

function renderCart() {
  const cartRoot = document.getElementById("cartItems");
  const summaryRoot = document.getElementById("cartSummary");
  if (!cartRoot) return;

  const { rows } = getCartTotals();
  cartRoot.innerHTML = loadingMarkup("Preparing your cart...");
  cartRoot.innerHTML = rows.length ? rows.map(item => `
    <article class="cart-item">
      <a class="cart-art product-art ${item.type}" href="product.html?id=${item.id}">
        <div class="product-visual" aria-hidden="true">${item.icon}</div>
      </a>
      <div class="cart-info">
        <a class="product-name" href="product.html?id=${item.id}">${item.name}</a>
        <p>${item.sub}</p>
        <span class="fragrance">${item.fragrance}</span>
      </div>
      <div class="qty-control" aria-label="Quantity for ${item.name}">
        <button type="button" onclick="updateCartQuantity('${item.id}', ${item.qty - 1})">-</button>
        <input type="number" min="1" value="${item.qty}" onchange="updateCartQuantity('${item.id}', this.value)" aria-label="Quantity" />
        <button type="button" onclick="updateCartQuantity('${item.id}', ${item.qty + 1})">+</button>
      </div>
      <div class="cart-line-total">${formatMoney(item.price * item.qty)}</div>
      <button class="remove-btn" type="button" onclick="removeFromCart('${item.id}')">Remove</button>
    </article>
  `).join("") : `
    <div class="empty-state">
      <div class="empty-illustration" aria-hidden="true"></div>
      <h2>Your cart is empty.</h2>
      <p class="section-text">Add vegetables, staples, dairy, snacks, or home care products from the shop to start your order.</p>
      <a class="btn btn-dark" href="shop.html">Shop Products</a>
    </div>
  `;

  renderSummary(summaryRoot, true);
}

function initCoupon() {
  const form = document.getElementById("couponForm");
  if (!form) return;

  const input = document.getElementById("couponInput");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Applying...");
    const code = (input.value || "").trim().toUpperCase();
    const { subtotal } = getCartTotals();

    try {
      const result = await api.coupons.validate(code, subtotal);
      if (!result.valid) throw new Error(result.message);
      localStorage.setItem("archhaCoupon", result.code);
      setFormMessage(form, "Coupon applied.", "success");
      showToast("Coupon applied.", "success");
    } catch (error) {
      localStorage.removeItem("archhaCoupon");
      setFormMessage(form, error.message || "Invalid coupon.", "error");
      showToast(error.message || "Invalid coupon.", "error");
    } finally {
      setBusy(submitButton, false);
    }

    renderCart();
    renderCheckout();
  });
}

function renderCheckout() {
  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutSummary = document.getElementById("checkoutSummary");
  if (!checkoutItems) return;

  const { rows } = getCartTotals();
  checkoutItems.innerHTML = rows.length ? rows.map(item => `
    <div class="checkout-mini-item">
      <span>${item.qty} x ${item.name}</span>
      <strong>${formatMoney(item.price * item.qty)}</strong>
    </div>
  `).join("") : `<p class="section-text">Your cart is empty. Add products before checkout.</p>`;

  renderSummary(checkoutSummary, false);
}

function initCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  const confirmation = document.getElementById("orderConfirmation");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Placing order...");
    const { rows, total } = getCartTotals();
    if (!rows.length) {
      showToast("Your cart is empty.", "error");
      setBusy(submitButton, false);
      return;
    }

    const formData = new FormData(form);
    const deliveryAddress = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      pincode: formData.get("pincode"),
      paymentMethod: formData.get("payment"),
      notes: formData.get("notes") || ""
    };

    let orderId = `ARCHHA-${Date.now().toString().slice(-6)}`;
    let savedToBackend = false;

    if (!getAuthToken()) {
      setFormMessage(form, "Login is required before checkout.", "error");
      showToast("Login is required before checkout.", "error");
      setBusy(submitButton, false);
      return;
    }

    try {
      await syncLocalCartToBackend();
      const result = await api.orders.create(getAuthToken(), {
        deliveryAddress,
        couponCode: localStorage.getItem("archhaCoupon") || ""
      });
      orderId = result.order.id;
      savedToBackend = true;
    } catch (error) {
      setFormMessage(form, error.message || "Order could not be placed.", "error");
      showToast(error.message || "Order could not be placed.", "error");
      setBusy(submitButton, false);
      return;
    }

    const order = {
      id: orderId,
      status: "PLACED",
      trackingSteps: [
        { label: "Placed", done: true, at: new Date().toISOString() },
        { label: "Packed", done: false },
        { label: "Out for delivery", done: false },
        { label: "Delivered", done: false }
      ],
      returnStatus: "NOT_REQUESTED",
      cancelStatus: "AVAILABLE",
      total,
      items: rows,
      deliveryAddress,
      savedToBackend,
      createdAt: new Date().toISOString()
    };

    saveLocalOrder(order);
    saveNotification("Order placed", `Order ${orderId} was placed successfully.`, "success");
    await clearCart(true);
    form.reset();
    setBusy(submitButton, false);

    window.location.href = `order-confirmation.html?id=${encodeURIComponent(orderId)}`;
  });
}

function getOrderDate(order) {
  const value = order.createdAt || order.updatedAt;
  if (!value) return "Today";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeOrder(order) {
  const items = order.items || [];
  const total = Number(order.total || order.summary?.total || 0);
  const address = order.deliveryAddress || {};
  return {
    id: order.id || order.orderId || "ORDER",
    status: order.status || "PLACED",
    trackingSteps: order.trackingSteps || [
      { label: "Placed", done: true, at: order.createdAt },
      { label: "Packed", done: ["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) },
      { label: "Out for delivery", done: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) },
      { label: "Delivered", done: order.status === "DELIVERED" }
    ],
    returnStatus: order.returnStatus || "NOT_REQUESTED",
    cancelStatus: order.cancelStatus || (["CANCELLED", "DELIVERED"].includes(order.status) ? "CLOSED" : "AVAILABLE"),
    total,
    items,
    deliveryAddress: address,
    savedToBackend: Boolean(order.savedToBackend),
    createdAt: order.createdAt || order.updatedAt
  };
}

function updateLocalOrder(orderId, patch) {
  const orders = getLocalOrders();
  const nextOrders = orders.map(order => order.id === orderId ? { ...order, ...patch, updatedAt: new Date().toISOString() } : order);
  localStorage.setItem("archhaOrders", JSON.stringify(nextOrders));
  const updated = nextOrders.find(order => order.id === orderId);
  if (updated) localStorage.setItem("archhaLastOrder", JSON.stringify(updated));
  return updated;
}

async function cancelOrder(orderId) {
  if (!getAuthToken()) {
    showToast("Login is required to cancel orders.", "error");
    return;
  }
  if (getAuthToken()) {
    try {
      await api.orders.cancel(getAuthToken(), orderId, "Customer requested cancellation");
    } catch (error) {
      showToast(error.message || "Order cancellation failed.", "error");
      return;
    }
  }
  updateLocalOrder(orderId, {
    status: "CANCELLED",
    cancelStatus: "CANCELLED",
    trackingSteps: [
      { label: "Placed", done: true },
      { label: "Cancelled", done: true, at: new Date().toISOString() }
    ]
  });
  saveNotification("Order cancelled", `Order ${orderId} has been cancelled.`, "error");
  showToast("Order cancelled.", "success");
  renderOrdersPage();
  renderOrderConfirmationPage();
}

async function requestReturn(orderId) {
  if (!getAuthToken()) {
    showToast("Login is required to request returns.", "error");
    return;
  }
  if (getAuthToken()) {
    try {
      await api.orders.requestReturn(getAuthToken(), orderId, "Customer requested return");
    } catch (error) {
      showToast(error.message || "Return request failed.", "error");
      return;
    }
  }
  updateLocalOrder(orderId, {
    returnStatus: "REQUESTED",
    trackingSteps: [
      { label: "Placed", done: true },
      { label: "Delivered", done: true },
      { label: "Return requested", done: true, at: new Date().toISOString() }
    ]
  });
  saveNotification("Return requested", `Return request for ${orderId} has been logged.`, "info");
  showToast("Return requested.", "success");
  renderOrdersPage();
  renderOrderConfirmationPage();
}

function renderTracking(order) {
  return `
    <div class="tracking-rail">
      ${(order.trackingSteps || []).map(step => `
        <div class="tracking-step ${step.done ? "done" : ""}">
          <span></span>
          <strong>${step.label}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderOrderItems(items = []) {
  return items.length ? items.map(item => {
    const name = item.name || item.product?.name || item.productId || "Grocery item";
    const qty = item.qty || item.quantity || 1;
    const price = item.price || item.lineTotal || item.product?.price || 0;
    const lineTotal = item.lineTotal || price * qty;
    return `
      <div class="checkout-mini-item">
        <span>${qty} x ${name}</span>
        <strong>${formatMoney(lineTotal)}</strong>
      </div>
    `;
  }).join("") : `<p class="section-text">No item details were saved for this order.</p>`;
}

async function loadVisibleOrders() {
  if (getAuthToken()) {
    try {
      const result = await api.orders.list(getAuthToken());
      if (Array.isArray(result.orders)) return result.orders.map(normalizeOrder);
    } catch (error) {
      showToast(error.message || "Orders could not be loaded.", "error");
      return [];
    }
  }
  return [];
}

async function renderOrdersPage() {
  const list = document.getElementById("ordersList");
  const summary = document.getElementById("ordersSummary");
  if (!list) return;

  list.innerHTML = loadingMarkup("Loading your grocery orders...");
  const orders = await loadVisibleOrders();
  if (summary) {
    const noun = orders.length === 1 ? "order" : "orders";
    summary.textContent = orders.length ? `${orders.length} ${noun} available for this account.` : "No orders have been placed yet.";
  }

  list.innerHTML = orders.length ? orders.map(order => `
    <article class="order-card">
      <div class="order-card-head">
        <div>
          <span class="tag static-tag">${order.status}</span>
          <h3>${order.id}</h3>
          <p>${getOrderDate(order)}</p>
        </div>
        <strong>${formatMoney(order.total)}</strong>
      </div>
      <div class="order-card-items">${renderOrderItems(order.items)}</div>
      ${renderTracking(order)}
      <div class="order-card-actions">
        <a class="btn btn-dark" href="order-confirmation.html?id=${encodeURIComponent(order.id)}">View Details</a>
        ${order.cancelStatus === "AVAILABLE" ? `<button class="clear-btn inline-action" type="button" onclick="cancelOrder('${order.id}')">Cancel Order</button>` : ""}
        ${order.status === "DELIVERED" && order.returnStatus !== "REQUESTED" ? `<button class="clear-btn inline-action" type="button" onclick="requestReturn('${order.id}')">Request Return</button>` : ""}
      </div>
    </article>
  `).join("") : `
    <div class="empty-state">
      <div class="empty-illustration" aria-hidden="true"></div>
      <h2>No orders yet.</h2>
      <p class="section-text">Place a grocery order from the shop and it will appear here for quick tracking.</p>
      <a class="btn btn-dark" href="shop.html">Shop Groceries</a>
    </div>
  `;
}

async function renderOrderConfirmationPage() {
  const root = document.getElementById("orderConfirmationDetail");
  if (!root) return;

  root.innerHTML = loadingMarkup("Preparing your confirmation...");
  const requestedId = new URLSearchParams(window.location.search).get("id");
  const localOrders = getLocalOrders().map(normalizeOrder);
  let orders = localOrders;

  if (getAuthToken()) {
    try {
      const result = await api.orders.list(getAuthToken());
      if (Array.isArray(result.orders)) orders = result.orders.map(normalizeOrder).concat(localOrders);
    } catch (error) {
      showToast(error.message || "Order confirmation could not be refreshed.", "error");
    }
  }

  let lastOrder = null;
  try {
    lastOrder = normalizeOrder(JSON.parse(localStorage.getItem("archhaLastOrder") || "null"));
  } catch {
    lastOrder = null;
  }

  const order = orders.find(item => item.id === requestedId) || lastOrder;
  if (!order) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration" aria-hidden="true"></div>
        <h2>No confirmation found.</h2>
        <p class="section-text">Place an order first, then this page will show the saved confirmation details.</p>
        <a class="btn btn-dark" href="shop.html">Shop Groceries</a>
      </div>
    `;
    return;
  }

  const address = order.deliveryAddress || {};
  root.innerHTML = `
    <div class="success-box confirmation-card">
      <span class="tag static-tag">${order.status}</span>
      <h2>Thank you. Your order is confirmed.</h2>
      <p>Order ID <strong>${order.id}</strong> was placed on ${getOrderDate(order)}.</p>
      <div class="actions">
        <a class="btn btn-dark" href="orders.html">View Orders</a>
        <a class="btn btn-primary" href="shop.html">Continue Shopping</a>
        ${order.cancelStatus === "AVAILABLE" ? `<button class="clear-btn inline-action" type="button" onclick="cancelOrder('${order.id}')">Cancel Order</button>` : ""}
        ${order.status === "DELIVERED" && order.returnStatus !== "REQUESTED" ? `<button class="clear-btn inline-action" type="button" onclick="requestReturn('${order.id}')">Request Return</button>` : ""}
      </div>
      ${renderTracking(order)}
    </div>
    <aside class="cart-panel confirmation-panel">
      <h2>Order summary</h2>
      <div class="checkout-items">${renderOrderItems(order.items)}</div>
      <div class="summary-row total"><span>Total</span><strong>${formatMoney(order.total)}</strong></div>
      <h2 class="panel-subhead">Delivery details</h2>
      <p class="section-text">${address.fullName || "Customer"}<br>${address.phone || ""}<br>${address.address || ""}${address.city ? `, ${address.city}` : ""}${address.pincode ? ` - ${address.pincode}` : ""}</p>
    </aside>
  `;
}

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  const status = document.getElementById("registerStatus");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Creating...");
    const payload = Object.fromEntries(new FormData(form).entries());
    const phone = String(payload.phone || "").trim();
    if (!/^[0-9]{10}$/.test(phone)) {
      setFormMessage(form, "Enter a valid 10 digit mobile number.", "error");
      showToast("Enter a valid 10 digit mobile number.", "error");
      setBusy(submitButton, false);
      return;
    }

    let user;
    try {
      const result = await api.auth.register({ ...payload, phone });
      user = {
        ...(result.user || payload),
        phone,
        registeredAt: new Date().toISOString()
      };
    } catch (error) {
      setFormMessage(form, error.message || "Account could not be created.", "error");
      showToast(error.message || "Account could not be created.", "error");
      setBusy(submitButton, false);
      return;
    }

    localStorage.setItem("archhaUser", JSON.stringify(user));
    form.reset();
    setBusy(submitButton, false);
    status?.classList.remove("hidden");
    if (status) {
      status.innerHTML = `
        <h2>Account created.</h2>
        <p><strong>${user.fullName}</strong> is registered for checkout and order tracking.</p>
        <a class="btn btn-dark" href="shop.html">Start Shopping</a>
      `;
    }
    saveNotification("Account created", `${user.fullName} registered successfully.`, "success");
    showToast("Account created.", "success");
  });
}

function initPhoneLogin() {
  const phoneForm = document.getElementById("phoneLoginForm");
  const otpForm = document.getElementById("otpForm");
  const changeNumberBtn = document.getElementById("changeNumberBtn");
  const status = document.getElementById("loginStatus");
  if (!phoneForm || !otpForm) return;

  let pendingPhone = "";

  phoneForm.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = phoneForm.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Sending OTP...");
    const phone = document.getElementById("loginPhone").value.trim();
    if (!/^[0-9]{10}$/.test(phone)) {
      setFormMessage(phoneForm, "Enter a valid 10 digit mobile number.", "error");
      showToast("Enter a valid 10 digit mobile number.", "error");
      setBusy(submitButton, false);
      return;
    }

    pendingPhone = phone;
    try {
      const result = await api.auth.requestOtp(phone);
      const expiryMinutes = Math.max(1, Math.round(Number(result.expiresInSeconds || 600) / 60));
      setFormMessage(phoneForm, `OTP sent successfully. It expires in ${expiryMinutes} minutes.`, "success");
      showToast("OTP sent successfully.", "success");
      phoneForm.classList.add("hidden");
      otpForm.classList.remove("hidden");
    } catch (error) {
      setFormMessage(phoneForm, error.message || "OTP could not be sent.", "error");
      showToast(error.message || "OTP could not be sent.", "error");
    }
    setBusy(submitButton, false);
  });

  otpForm.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = otpForm.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Verifying...");
    const otp = document.getElementById("otpCode").value.trim();
    if (!/^[0-9]{6}$/.test(otp)) {
      setFormMessage(otpForm, "Enter a valid 6 digit OTP.", "error");
      showToast("Enter a valid 6 digit OTP.", "error");
      setBusy(submitButton, false);
      return;
    }

    try {
      const result = await api.auth.verifyOtp(pendingPhone, otp);
      const user = { phone: result.phone, token: result.token, loggedInAt: new Date().toISOString() };
      localStorage.setItem("archhaUser", JSON.stringify(user));
      await syncLocalCartToBackend();
    } catch (error) {
      setFormMessage(otpForm, error.message || "Invalid OTP.", "error");
      showToast(error.message || "Invalid OTP.", "error");
      setBusy(submitButton, false);
      return;
    }

    setBusy(submitButton, false);
    otpForm.classList.add("hidden");
    status.classList.remove("hidden");
    status.innerHTML = `
      <h2>Login successful.</h2>
      <p>Mobile number <strong>${pendingPhone}</strong> is logged in.</p>
      <a class="btn btn-dark" href="shop.html">Continue Shopping</a>
    `;
  });

  changeNumberBtn?.addEventListener("click", () => {
    otpForm.reset();
    otpForm.classList.add("hidden");
    phoneForm.classList.remove("hidden");
  });
}

function saveLocalEnquiry(payload) {
  const enquiries = JSON.parse(localStorage.getItem("archhaEnquiries") || "[]");
  const enquiry = { id: `LOCAL-${Date.now().toString().slice(-6)}`, ...payload, createdAt: new Date().toISOString() };
  enquiries.push(enquiry);
  localStorage.setItem("archhaEnquiries", JSON.stringify(enquiries));
  return enquiry;
}

function getProductRequests() {
  try {
    return JSON.parse(localStorage.getItem("archhaProductRequests") || "[]");
  } catch {
    return [];
  }
}

function saveProductRequest(request) {
  const requests = [request, ...getProductRequests()].slice(0, 30);
  localStorage.setItem("archhaProductRequests", JSON.stringify(requests));
}

function renderProductRequests() {
  const list = document.getElementById("productRequestList");
  if (!list) return;
  const requests = getProductRequests();
  list.innerHTML = requests.length ? requests.slice(0, 5).map(request => `
    <article class="request-mini-card ${String(request.urgency).includes("Emergency") ? "urgent" : ""}">
      <span class="tag static-tag">${escapeHtml(request.status)}</span>
      <strong>${escapeHtml(request.productName)}</strong>
      <p>${escapeHtml(request.quantity)} | ${escapeHtml(request.urgency)}</p>
    </article>
  `).join("") : `<p class="section-text">No emergency product requests have been sent yet.</p>`;
}

function initProductRequestForm() {
  const form = document.getElementById("productRequestForm");
  if (!form) return;

  const user = getAuthUser();
  if (user?.fullName) document.getElementById("requestName").value = user.fullName;
  if (user?.phone) document.getElementById("requestPhone").value = user.phone;
  if (user?.city) document.getElementById("requestAddress").value = user.city;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Sending...");
    const payload = Object.fromEntries(new FormData(form).entries());
    const phone = String(payload.phone || "").trim();
    if (!/^[0-9]{10}$/.test(phone)) {
      setFormMessage(form, "Enter a valid 10 digit mobile number.", "error");
      showToast("Enter a valid 10 digit mobile number.", "error");
      setBusy(submitButton, false);
      return;
    }

    const request = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      ...payload,
      phone,
      status: String(payload.urgency).includes("Emergency") ? "URGENT" : "NEW",
      createdAt: new Date().toISOString()
    };
    try {
      const result = await api.productRequests.create(request);
      saveProductRequest(result.request || request);
    } catch (error) {
      setFormMessage(form, error.message || "Product request could not be sent.", "error");
      showToast(error.message || "Product request could not be sent.", "error");
      setBusy(submitButton, false);
      return;
    }

    form.reset();
    setBusy(submitButton, false);
    setFormMessage(form, `Emergency request saved: ${request.id}.`, "success");
    saveNotification("Product request sent", `${request.productName} request was saved as ${request.status}.`, request.status === "URGENT" ? "error" : "info");
    showToast("Emergency product request sent.", "success");
    renderProductRequests();
  });

  renderProductRequests();
}

function initForms() {
  document.querySelectorAll("[data-enquiry-form]").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = form.querySelector("button[type='submit']");
      setBusy(submitButton, true, "Saving...");
      const payload = Object.fromEntries(new FormData(form).entries());
      let enquiry = null;

      try {
        const result = await api.enquiries.create(payload);
        enquiry = result.enquiry;
      } catch (error) {
        setFormMessage(form, error.message || "Enquiry could not be saved.", "error");
        showToast(error.message || "Enquiry could not be saved.", "error");
        setBusy(submitButton, false);
        return;
      }

      form.reset();
      setBusy(submitButton, false);
      setFormMessage(form, `Enquiry saved: ${enquiry.id}.`, "success");
      showToast(`Enquiry saved: ${enquiry.id}.`, "success");
    });
  });
}

function initNavSearch() {
  document.querySelectorAll("[data-nav-search]").forEach(form => {
    const input = form.querySelector("input[name='q']");
    const currentQuery = new URLSearchParams(window.location.search).get("q");
    if (input && currentQuery) input.value = currentQuery;

    form.addEventListener("submit", event => {
      event.preventDefault();
      const query = (input?.value || "").trim();
      saveSearchHistory(query, "nav");
      window.location.href = query ? `shop.html?q=${encodeURIComponent(query)}` : "shop.html";
    });
  });
}

function initFloatingRequestButton() {
  if (document.body.dataset.page === "admin" || document.querySelector(".floating-request-btn")) return;

  const link = document.createElement("a");
  link.className = "floating-request-btn";
  link.href = "request-product.html";
  link.setAttribute("aria-label", "Request product");
  link.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.5 20.5 21 3l-6.2 18-3.7-8.1L3.5 20.5Z"></path>
      <path d="m11.1 12.9 9.9-9.9"></path>
    </svg>
    <span>Request product</span>
  `;
  document.body.append(link);
}

function initActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach(link => {
    link.classList.toggle("active", link.dataset.nav === page);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductsFromApi();
  updateCartCount();
  initActiveNav();
  initNavSearch();
  initFloatingRequestButton();
  initProductGrid();
  initProductDetail();
  renderCart();
  initCoupon();
  renderCheckout();
  initCheckoutForm();
  initPhoneLogin();
  initRegisterForm();
  initProductRequestForm();
  initForms();
  renderSearchHistoryPanel();
  renderNotifications();
  renderOrdersPage();
  renderOrderConfirmationPage();
});
