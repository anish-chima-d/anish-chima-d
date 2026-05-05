const api = window.ArchhaApi;

const adminState = {
  products: [],
  orders: [],
  enquiries: [],
  trackerOrderId: ""
};

const categoryLabels = {
  produce: "Produce",
  pantry: "Pantry",
  dairy: "Dairy",
  snacks: "Snacks",
  home: "Home care",
  basket: "Basket"
};

const orderStatuses = ["PLACED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const enquiryStatuses = ["NEW", "CONTACTED", "CLOSED"];

const statusLabels = {
  PLACED: "Placed",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  NEW: "New",
  CONTACTED: "Contacted",
  CLOSED: "Closed"
};

const trackerSteps = [
  {
    key: "PLACED",
    title: "Order placed",
    detail: "Customer order received by Archha Admin."
  },
  {
    key: "PACKED",
    title: "Packed",
    detail: "Products are packed and ready for dispatch."
  },
  {
    key: "OUT_FOR_DELIVERY",
    title: "Out for delivery",
    detail: "Courier is moving toward the customer area."
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    detail: "Order has reached the customer."
  }
];

function byId(id) {
  return document.getElementById(id);
}

function getAdminToken() {
  return localStorage.getItem("archhaAdminToken") || "";
}

function setAdminToken(token) {
  localStorage.setItem("archhaAdminToken", token);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const toast = byId("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.className = "toast";
  }, 2600);
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function loadingMarkup(message = "Loading...") {
  return `<div class="loading-state"><span class="spinner" aria-hidden="true"></span><span>${escapeHtml(message)}</span></div>`;
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
  let box = Array.from(form.children).find(child => child.classList?.contains("form-message"));
  if (!box) {
    box = document.createElement("div");
    box.className = "form-message";
    const title = form.querySelector(".admin-form-title");
    if (title) title.after(box);
    else form.prepend(box);
  }
  box.className = `form-message ${type}`;
  box.textContent = message;
}

function clearFormMessage(form) {
  const box = Array.from(form.children).find(child => child.classList?.contains("form-message"));
  if (box) box.remove();
}

function tableMessage(content, type = "info", colspan = 6) {
  return `
    <tbody>
      <tr>
        <td colspan="${colspan}"><div class="inline-alert ${type}">${content}</div></td>
      </tr>
    </tbody>
  `;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusLabel(status) {
  return statusLabels[status] || String(status || "-");
}

function statusClass(status) {
  if (["DELIVERED", "CLOSED"].includes(status)) return "success";
  if (["CANCELLED"].includes(status)) return "danger";
  if (["PACKED", "OUT_FOR_DELIVERY", "CONTACTED"].includes(status)) return "warning";
  return "info";
}

function statusOptions(current, options) {
  return options
    .map(option => `<option value="${escapeHtml(option)}" ${option === current ? "selected" : ""}>${escapeHtml(statusLabel(option))}</option>`)
    .join("");
}

function syncApiBaseDisplay() {
  const input = byId("adminApiBase");
  const label = byId("adminApiLabel");
  if (input) input.value = api.getBaseUrl();
  if (label) label.textContent = api.getBaseUrl().replace(/^https?:\/\//, "");
}

function updateTabCounts() {
  const activeTrackers = adminState.orders.filter(order => !["DELIVERED", "CANCELLED"].includes(order.status || "PLACED"));
  const counts = {
    productTabCount: adminState.products.length,
    orderTabCount: adminState.orders.length,
    enquiryTabCount: adminState.enquiries.length,
    trackerTabCount: activeTrackers.length || adminState.orders.length
  };
  Object.entries(counts).forEach(([id, value]) => {
    const element = byId(id);
    if (element) element.textContent = value;
  });
}

async function loadDashboard() {
  const token = getAdminToken();
  const statsRoot = byId("adminStats");
  statsRoot.innerHTML = loadingMarkup("Loading dashboard...");
  try {
    const data = await api.admin.dashboard(token);
    const stats = data.dashboard;

    statsRoot.innerHTML = `
      <div class="admin-kpi-card accent-products">
        <span>Products</span>
        <strong>${escapeHtml(stats.products)}</strong>
        <small>Catalog items</small>
      </div>
      <div class="admin-kpi-card accent-orders">
        <span>Orders</span>
        <strong>${escapeHtml(stats.orders)}</strong>
        <small>Customer purchases</small>
      </div>
      <div class="admin-kpi-card accent-enquiries">
        <span>Enquiries</span>
        <strong>${escapeHtml(stats.enquiries)}</strong>
        <small>Follow-up queue</small>
      </div>
      <div class="admin-kpi-card accent-revenue">
        <span>Revenue</span>
        <strong>${money(stats.revenue)}</strong>
        <small>Gross demo total</small>
      </div>
    `;
  } catch (error) {
    statsRoot.innerHTML = `<div class="inline-alert error">Dashboard unavailable. ${escapeHtml(error.message)}</div>`;
    throw error;
  }
}

function productMatches(product, query, type) {
  const text = [
    product.name,
    product.fragrance,
    product.sub,
    product.description,
    product.tag,
    product.pack
  ].join(" ").toLowerCase();
  const matchesText = !query || text.includes(query);
  const matchesType = type === "all" || product.type === type;
  return matchesText && matchesType;
}

function renderProducts() {
  const table = byId("adminProductsTable");
  const summary = byId("adminProductSummary");
  const query = (byId("adminProductSearch")?.value || "").trim().toLowerCase();
  const type = byId("adminProductTypeFilter")?.value || "all";
  const products = adminState.products.filter(product => productMatches(product, query, type));

  if (summary) {
    summary.textContent = `${products.length} of ${adminState.products.length} products shown`;
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Product</th>
        <th>Category</th>
        <th>Aisle</th>
        <th>Pack</th>
        <th>Price</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${products.length ? products.map(product => `
        <tr>
          <td>
            <strong class="admin-table-title">${escapeHtml(product.name)}</strong>
            <span class="muted">${escapeHtml(product.sub || product.description || "No short detail")}</span>
          </td>
          <td><span class="admin-badge category">${escapeHtml(categoryLabels[product.type] || product.type || "-")}</span></td>
          <td>${escapeHtml(product.fragrance || "-")}</td>
          <td>
            ${escapeHtml(product.pack || "-")}
            <span class="muted">${escapeHtml(product.burnTime || "")}</span>
          </td>
          <td><strong>${money(product.price)}</strong></td>
          <td>
            <button class="small-btn" type="button" data-product-action="edit" data-product-id="${escapeHtml(product.id)}">Edit</button>
            <button class="small-btn danger" type="button" data-product-action="delete" data-product-id="${escapeHtml(product.id)}">Delete</button>
          </td>
        </tr>
      `).join("") : `<tr><td colspan="6"><div class="inline-alert">No products match the current view.</div></td></tr>`}
    </tbody>
  `;
}

async function loadProducts() {
  const token = getAdminToken();
  const table = byId("adminProductsTable");
  table.innerHTML = tableMessage(loadingMarkup("Loading products..."), "info", 6);
  try {
    const result = await api.admin.products.list(token);
    adminState.products = result.products || [];
    renderProducts();
    updateTabCounts();
  } catch (error) {
    table.innerHTML = tableMessage(`Products unavailable. ${escapeHtml(error.message)}`, "error", 6);
  }
}

function orderItemsSummary(items = []) {
  if (!items.length) return "-";
  const names = items.slice(0, 2).map(item => `${item.quantity || 1} x ${item.name || item.productId || "Item"}`);
  const extra = items.length > 2 ? ` +${items.length - 2} more` : "";
  return `${names.join(", ")}${extra}`;
}

function renderOrders() {
  const table = byId("adminOrdersTable");
  const summary = byId("adminOrderSummary");
  const filter = byId("adminOrderStatusFilter")?.value || "all";
  const orders = filter === "all"
    ? adminState.orders
    : adminState.orders.filter(order => (order.status || "PLACED") === filter);

  if (summary) {
    summary.textContent = `${orders.length} of ${adminState.orders.length} orders shown`;
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Items</th>
        <th>Total</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${orders.length ? orders.map(order => {
        const status = order.status || "PLACED";
        return `
          <tr>
            <td>
              <strong class="admin-table-title">${escapeHtml(order.id)}</strong>
              <span class="muted">${escapeHtml(order.paymentStatus || "PENDING")} payment</span>
            </td>
            <td>
              ${escapeHtml(order.deliveryAddress?.fullName || "-")}
              <span class="muted">${escapeHtml(order.deliveryAddress?.phone || order.userPhone || "-")}</span>
              <span class="muted">${escapeHtml(order.deliveryAddress?.city || "")}</span>
            </td>
            <td>${escapeHtml(orderItemsSummary(order.items))}</td>
            <td>
              <strong>${money(order.total)}</strong>
              <span class="muted">Subtotal ${money(order.subtotal)}</span>
            </td>
            <td>
              <div class="admin-status-stack">
                <span class="admin-badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>
                <select class="table-select" data-order-status data-order-id="${escapeHtml(order.id)}">
                  ${statusOptions(status, orderStatuses)}
                </select>
              </div>
            </td>
            <td>${escapeHtml(formatDate(order.createdAt))}</td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="6"><div class="inline-alert">No orders in this view.</div></td></tr>`}
    </tbody>
  `;
}

async function loadOrders() {
  const token = getAdminToken();
  const table = byId("adminOrdersTable");
  table.innerHTML = tableMessage(loadingMarkup("Loading orders..."), "info", 6);
  try {
    const result = await api.admin.orders.list(token);
    adminState.orders = result.orders || [];
    renderOrders();
    renderTracker();
    updateTabCounts();
  } catch (error) {
    table.innerHTML = tableMessage(`Orders unavailable. ${escapeHtml(error.message)}`, "error", 6);
    renderTracker();
  }
}

function renderEnquiries() {
  const table = byId("adminEnquiriesTable");
  const summary = byId("adminEnquirySummary");
  const filter = byId("adminEnquiryStatusFilter")?.value || "all";
  const enquiries = filter === "all"
    ? adminState.enquiries
    : adminState.enquiries.filter(enquiry => (enquiry.status || "NEW") === filter);

  if (summary) {
    summary.textContent = `${enquiries.length} of ${adminState.enquiries.length} enquiries shown`;
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Customer</th>
        <th>Need</th>
        <th>Message</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${enquiries.length ? enquiries.map(enquiry => {
        const status = enquiry.status || "NEW";
        return `
          <tr>
            <td>
              <strong class="admin-table-title">${escapeHtml(enquiry.name)}</strong>
              <span class="muted">${escapeHtml(enquiry.phone || "-")}</span>
              <span class="muted">${escapeHtml(enquiry.city || "")}</span>
            </td>
            <td>${escapeHtml(enquiry.need || "General enquiry")}</td>
            <td>${escapeHtml(enquiry.message || "-")}</td>
            <td>
              <div class="admin-status-stack">
                <span class="admin-badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>
                <select class="table-select" data-enquiry-status data-enquiry-id="${escapeHtml(enquiry.id)}">
                  ${statusOptions(status, enquiryStatuses)}
                </select>
              </div>
            </td>
            <td>${escapeHtml(formatDate(enquiry.createdAt))}</td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="5"><div class="inline-alert">No enquiries in this view.</div></td></tr>`}
    </tbody>
  `;
}

function trackerProgress(status = "PLACED") {
  const progressByStatus = {
    PLACED: 16,
    PACKED: 42,
    OUT_FOR_DELIVERY: 72,
    DELIVERED: 100,
    CANCELLED: 42
  };
  return progressByStatus[status] || 16;
}

function trackerMarkerStyle(status = "PLACED") {
  const positions = {
    PLACED: { left: "15%", top: "70%" },
    PACKED: { left: "39%", top: "48%" },
    OUT_FOR_DELIVERY: { left: "66%", top: "36%" },
    DELIVERED: { left: "84%", top: "68%" },
    CANCELLED: { left: "39%", top: "48%" }
  };
  const position = positions[status] || positions.PLACED;
  return `left: ${position.left}; top: ${position.top};`;
}

function customerDestination(order) {
  const address = order?.deliveryAddress || {};
  const city = address.city || "Customer area";
  const pincode = address.pincode ? ` - ${address.pincode}` : "";
  return `${city}${pincode}`;
}

function renderRouteMap(order) {
  const status = order?.status || "PLACED";
  const isCancelled = status === "CANCELLED";
  const destination = order ? customerDestination(order) : "Customer location";
  const progress = isCancelled ? 42 : trackerProgress(status);

  return `
    <div class="admin-map-grid" aria-hidden="true"></div>
    <svg class="admin-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path class="admin-map-road" d="M 12 74 C 28 66, 32 43, 45 47 S 62 23, 73 35 S 78 68, 88 66" pathLength="100" />
      <path class="admin-map-progress" d="M 12 74 C 28 66, 32 43, 45 47 S 62 23, 73 35 S 78 68, 88 66" pathLength="100" style="stroke-dasharray: ${progress} 100" />
    </svg>
    <div class="admin-map-marker store" style="left: 12%; top: 74%;">
      <strong>Store</strong>
      <span>Archha warehouse</span>
    </div>
    <div class="admin-map-marker stop" style="left: 39%; top: 48%;">
      <strong>Pack</strong>
      <span>Dispatch desk</span>
    </div>
    <div class="admin-map-marker stop" style="left: 66%; top: 36%;">
      <strong>Courier</strong>
      <span>Delivery route</span>
    </div>
    <div class="admin-map-marker customer" style="left: 84%; top: 68%;">
      <strong>Customer</strong>
      <span>${escapeHtml(destination)}</span>
    </div>
    <div class="admin-map-vehicle ${isCancelled ? "cancelled" : ""}" style="${trackerMarkerStyle(status)}">
      <span>${isCancelled ? "!" : ">"}</span>
    </div>
  `;
}

function resolveTrackerOrder() {
  if (!adminState.orders.length) return null;
  const selected = adminState.orders.find(order => order.id === adminState.trackerOrderId);
  if (selected) return selected;

  const active = adminState.orders.find(order => !["DELIVERED", "CANCELLED"].includes(order.status || "PLACED"));
  return active || adminState.orders[0];
}

function renderTrackerOptions(order) {
  const select = byId("adminTrackerOrderSelect");
  if (!select) return;

  if (!adminState.orders.length) {
    adminState.trackerOrderId = "";
    select.innerHTML = `<option value="">No orders yet</option>`;
    select.disabled = true;
    return;
  }

  adminState.trackerOrderId = order?.id || adminState.trackerOrderId || adminState.orders[0].id;
  select.disabled = false;
  select.innerHTML = adminState.orders.map(item => `
    <option value="${escapeHtml(item.id)}" ${item.id === adminState.trackerOrderId ? "selected" : ""}>
      ${escapeHtml(item.id)} - ${escapeHtml(statusLabel(item.status || "PLACED"))}
    </option>
  `).join("");
}

function trackerStepClass(step, order) {
  if (!order) return "pending";
  const status = order.status || "PLACED";
  const index = trackerSteps.findIndex(item => item.key === step.key);

  if (status === "CANCELLED") {
    if (index === 0) return "done";
    if (index === 1) return "cancelled";
    return "pending";
  }

  const currentIndex = Math.max(0, trackerSteps.findIndex(item => item.key === status));
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "active";
  return "pending";
}

function renderTrackerTimeline(order) {
  const timeline = byId("adminTrackerTimeline");
  if (!timeline) return;

  const cancelledNote = order?.status === "CANCELLED"
    ? `<div class="inline-alert error">This order is cancelled. Route movement has stopped.</div>`
    : "";

  timeline.innerHTML = `
    <h3>Delivery Timeline</h3>
    ${cancelledNote}
    ${trackerSteps.map(step => `
      <div class="admin-timeline-step ${trackerStepClass(step, order)}">
        <span></span>
        <div>
          <strong>${escapeHtml(step.title)}</strong>
          <p>${escapeHtml(step.detail)}</p>
        </div>
      </div>
    `).join("")}
  `;
}

function renderTrackerDetails(order) {
  const details = byId("adminTrackerDetails");
  if (!details) return;

  if (!order) {
    details.innerHTML = `
      <div class="admin-tracker-card">
        <span class="admin-title-chip">MAP</span>
        <div>
          <h3>No active orders yet</h3>
          <p>Orders will appear here after checkout with route progress, customer city, and status history.</p>
        </div>
      </div>
    `;
    return;
  }

  const address = order.deliveryAddress || {};
  details.innerHTML = `
    <div class="admin-tracker-card">
      <span class="admin-title-chip">ORD</span>
      <div>
        <h3>${escapeHtml(order.id)}</h3>
        <p>${escapeHtml(orderItemsSummary(order.items))}</p>
      </div>
    </div>
    <div class="admin-tracker-facts">
      <div>
        <span>Customer</span>
        <strong>${escapeHtml(address.fullName || "-")}</strong>
        <small>${escapeHtml(address.phone || order.userPhone || "-")}</small>
      </div>
      <div>
        <span>Destination</span>
        <strong>${escapeHtml(customerDestination(order))}</strong>
        <small>${escapeHtml(address.address || "Delivery address")}</small>
      </div>
      <div>
        <span>Total</span>
        <strong>${money(order.total)}</strong>
        <small>${escapeHtml(order.paymentStatus || "PENDING")} payment</small>
      </div>
      <div>
        <span>Updated</span>
        <strong>${escapeHtml(statusLabel(order.status || "PLACED"))}</strong>
        <small>${escapeHtml(formatDate(order.updatedAt || order.createdAt))}</small>
      </div>
    </div>
  `;
}

function renderTracker() {
  const order = resolveTrackerOrder();
  if (order) adminState.trackerOrderId = order.id;

  renderTrackerOptions(order);
  renderTrackerDetails(order);
  renderTrackerTimeline(order);

  const mapTitle = byId("adminTrackerMapTitle");
  const mapSub = byId("adminTrackerMapSub");
  const statusBadge = byId("adminTrackerStatusBadge");
  const map = byId("adminRouteMap");

  if (mapTitle) mapTitle.textContent = order ? `Route for ${order.id}` : "Delivery Map Preview";
  if (mapSub) mapSub.textContent = order ? `Store to ${customerDestination(order)}` : "Store to customer route preview";
  if (statusBadge) {
    const status = order?.status || "PREVIEW";
    statusBadge.className = `admin-badge ${statusClass(status)}`;
    statusBadge.textContent = order ? statusLabel(status) : "Preview";
  }
  if (map) map.innerHTML = renderRouteMap(order);
}

async function loadEnquiries() {
  const token = getAdminToken();
  const table = byId("adminEnquiriesTable");
  table.innerHTML = tableMessage(loadingMarkup("Loading enquiries..."), "info", 5);
  try {
    const result = await api.admin.enquiries.list(token);
    adminState.enquiries = result.enquiries || [];
    renderEnquiries();
    updateTabCounts();
  } catch (error) {
    table.innerHTML = tableMessage(`Enquiries unavailable. ${escapeHtml(error.message)}`, "error", 5);
  }
}

async function loadAdminData() {
  const refreshButton = byId("adminRefreshBtn");
  setBusy(refreshButton, true, "Refreshing...");
  try {
    await loadDashboard();
    await Promise.all([loadProducts(), loadOrders(), loadEnquiries()]);
    updateTabCounts();
  } finally {
    setBusy(refreshButton, false);
  }
}

function resetProductForm(focusName = false) {
  const form = byId("adminProductForm");
  if (!form) return;
  form.reset();
  byId("adminProductId").value = "";
  byId("adminProductFormTitle").textContent = "Create Product";
  byId("adminProductFormHint").textContent = "Add a product to the backend catalog.";
  byId("adminProductSubmitBtn").textContent = "Save Product";
  clearFormMessage(form);
  if (focusName) byId("adminProductName").focus();
}

function editProduct(productId) {
  const product = adminState.products.find(item => item.id === productId);
  if (!product) return;

  byId("adminProductId").value = product.id;
  byId("adminProductName").value = product.name || "";
  byId("adminProductPrice").value = product.price || "";
  byId("adminProductFragrance").value = product.fragrance || "";
  byId("adminProductType").value = product.type || "daily";
  byId("adminProductTag").value = product.tag || "";
  byId("adminProductIcon").value = product.icon || "";
  byId("adminProductPack").value = product.pack || "";
  byId("adminProductBurnTime").value = product.burnTime || "";
  byId("adminProductRating").value = product.rating || "";
  byId("adminProductUse").value = product.use || "";
  byId("adminProductSub").value = product.sub || "";
  byId("adminProductDescription").value = product.description || "";
  byId("adminProductFormTitle").textContent = "Edit Product";
  byId("adminProductFormHint").textContent = product.id;
  byId("adminProductSubmitBtn").textContent = "Update Product";
  clearFormMessage(byId("adminProductForm"));
  byId("adminProductName").focus();
}

async function deleteProduct(productId) {
  if (!confirm("Delete this product from the backend demo catalog?")) return;
  try {
    await api.admin.products.remove(getAdminToken(), productId);
    showToast("Product deleted.", "success");
    await loadProducts();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await api.admin.orders.updateStatus(getAdminToken(), orderId, status);
    const order = adminState.orders.find(item => item.id === orderId);
    if (order) order.status = status;
    renderOrders();
    renderTracker();
    showToast("Order status updated.", "success");
    await loadDashboard();
  } catch (error) {
    showToast(error.message, "error");
    await loadOrders();
  }
}

async function updateEnquiryStatus(enquiryId, status) {
  try {
    await api.admin.enquiries.updateStatus(getAdminToken(), enquiryId, status);
    const enquiry = adminState.enquiries.find(item => item.id === enquiryId);
    if (enquiry) enquiry.status = status;
    renderEnquiries();
    showToast("Enquiry status updated.", "success");
  } catch (error) {
    showToast(error.message, "error");
    await loadEnquiries();
  }
}

function showPanel() {
  byId("adminLoginScreen").classList.add("hidden");
  byId("adminPanel").classList.remove("hidden");
  byId("adminLogoutBtn").classList.remove("hidden");
  syncApiBaseDisplay();
}

function showLogin() {
  byId("adminPanel").classList.add("hidden");
  byId("adminLoginScreen").classList.remove("hidden");
  byId("adminLogoutBtn").classList.add("hidden");
  syncApiBaseDisplay();
}

function initAdminTabs() {
  document.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-admin-tab]").forEach(tab => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".admin-section").forEach(section => section.classList.add("hidden"));
      byId(`admin-${button.dataset.adminTab}`).classList.remove("hidden");
    });
  });
}

function initAdminLogin() {
  const form = byId("adminLoginForm");
  const logout = byId("adminLogoutBtn");

  syncApiBaseDisplay();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Opening...");
    const formData = new FormData(form);
    const pin = formData.get("pin");
    const apiBase = String(formData.get("apiBase") || "").trim();
    if (apiBase) api.setBaseUrl(apiBase);
    syncApiBaseDisplay();

    try {
      const result = await api.admin.login(pin);
      setAdminToken(result.token);
      showPanel();
      showToast("Admin login successful.", "success");
      await loadAdminData();
    } catch (error) {
      setFormMessage(form, `${error.message}. Start backend and use PIN 9999 for demo.`, "error");
      showToast(error.message, "error");
    } finally {
      setBusy(submitButton, false);
    }
  });

  logout.addEventListener("click", () => {
    localStorage.removeItem("archhaAdminToken");
    showLogin();
    showToast("Admin logged out.", "info");
  });

  if (getAdminToken()) {
    showPanel();
    loadAdminData().catch(error => {
      showToast(error.message, "error");
      localStorage.removeItem("archhaAdminToken");
      showLogin();
    });
  } else {
    showLogin();
  }
}

function initProductForm() {
  const form = byId("adminProductForm");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    setBusy(submitButton, true, "Saving...");
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const payload = Object.fromEntries(formData.entries());
    let successMessage = "";
    delete payload.id;
    Object.keys(payload).forEach(key => {
      if (typeof payload[key] === "string") payload[key] = payload[key].trim();
    });

    try {
      if (id) {
        await api.admin.products.update(getAdminToken(), id, payload);
        successMessage = "Product updated in backend catalog.";
        showToast("Product updated.", "success");
      } else {
        await api.admin.products.create(getAdminToken(), payload);
        successMessage = "Product created in backend catalog.";
        showToast("Product created.", "success");
      }
      await loadProducts();
      await loadDashboard();
    } catch (error) {
      setFormMessage(form, error.message, "error");
      showToast(error.message, "error");
    } finally {
      setBusy(submitButton, false);
    }

    if (successMessage) {
      resetProductForm(false);
      setFormMessage(form, successMessage, "success");
    }
  });

  byId("adminProductResetBtn").addEventListener("click", () => resetProductForm(true));
  byId("adminNewProductBtn").addEventListener("click", () => resetProductForm(true));
}

function initTableActions() {
  byId("adminProductsTable").addEventListener("click", event => {
    const button = event.target.closest("[data-product-action]");
    if (!button) return;
    const productId = button.dataset.productId;
    if (button.dataset.productAction === "edit") editProduct(productId);
    if (button.dataset.productAction === "delete") deleteProduct(productId);
  });

  byId("adminOrdersTable").addEventListener("change", event => {
    const select = event.target.closest("[data-order-status]");
    if (!select) return;
    updateOrderStatus(select.dataset.orderId, select.value);
  });

  byId("adminEnquiriesTable").addEventListener("change", event => {
    const select = event.target.closest("[data-enquiry-status]");
    if (!select) return;
    updateEnquiryStatus(select.dataset.enquiryId, select.value);
  });
}

function initFilters() {
  byId("adminProductSearch").addEventListener("input", renderProducts);
  byId("adminProductTypeFilter").addEventListener("change", renderProducts);
  byId("adminOrderStatusFilter").addEventListener("change", renderOrders);
  byId("adminEnquiryStatusFilter").addEventListener("change", renderEnquiries);
  byId("adminTrackerOrderSelect").addEventListener("change", event => {
    adminState.trackerOrderId = event.target.value;
    renderTracker();
  });
  byId("adminRefreshBtn").addEventListener("click", () => {
    loadAdminData().catch(error => showToast(error.message, "error"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminTabs();
  initAdminLogin();
  initProductForm();
  initTableActions();
  initFilters();
});
