(function () {
  const DEFAULT_BASE_URL = "http://localhost:5000/api";

  function getBaseUrl() {
    return localStorage.getItem("archhaApiBase") || DEFAULT_BASE_URL;
  }

  function setBaseUrl(url) {
    localStorage.setItem("archhaApiBase", url.replace(/\/$/, ""));
  }

  function buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });
    const queryText = query.toString();
    return queryText ? `?${queryText}` : "";
  }

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${getBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || "Backend request failed.");
    }
    return data;
  }

  const products = {
    list(params = {}) {
      return request(`/products${buildQuery(params)}`);
    },
    get(id) {
      return request(`/products/${encodeURIComponent(id)}`);
    }
  };

  const auth = {
    requestOtp(phone) {
      return request("/auth/request-otp", {
        method: "POST",
        body: { phone }
      });
    },
    verifyOtp(phone, otp) {
      return request("/auth/verify-otp", {
        method: "POST",
        body: { phone, otp }
      });
    }
  };

  const cart = {
    get(token, coupon = "") {
      return request(`/cart${buildQuery({ coupon })}`, { token });
    },
    add(token, productId, quantity = 1) {
      return request("/cart/items", {
        method: "POST",
        token,
        body: { productId, quantity }
      });
    },
    update(token, productId, quantity) {
      return request(`/cart/items/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        token,
        body: { quantity }
      });
    },
    remove(token, productId) {
      return request(`/cart/items/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        token
      });
    },
    clear(token) {
      return request("/cart", {
        method: "DELETE",
        token
      });
    }
  };

  const coupons = {
    validate(code, subtotal) {
      return request("/coupons/validate", {
        method: "POST",
        body: { code, subtotal }
      });
    }
  };

  const orders = {
    create(token, payload) {
      return request("/orders", {
        method: "POST",
        token,
        body: payload
      });
    },
    list(token) {
      return request("/orders", { token });
    },
    get(token, id) {
      return request(`/orders/${encodeURIComponent(id)}`, { token });
    },
    cancel(token, id, reason = "") {
      return request(`/orders/${encodeURIComponent(id)}/cancel`, {
        method: "PATCH",
        token,
        body: { reason }
      });
    },
    requestReturn(token, id, reason = "") {
      return request(`/orders/${encodeURIComponent(id)}/return`, {
        method: "PATCH",
        token,
        body: { reason }
      });
    }
  };

  const reviews = {
    list(productId) {
      return request(`/reviews${buildQuery({ productId })}`);
    },
    create(payload) {
      return request("/reviews", {
        method: "POST",
        body: payload
      });
    }
  };

  const notifications = {
    list(phone = "") {
      return request(`/notifications${buildQuery({ phone })}`);
    },
    create(payload) {
      return request("/notifications", {
        method: "POST",
        body: payload
      });
    }
  };

  const searchHistory = {
    list(phone = "") {
      return request(`/search-history${buildQuery({ phone })}`);
    },
    create(payload) {
      return request("/search-history", {
        method: "POST",
        body: payload
      });
    }
  };

  const productRequests = {
    list(params = {}) {
      return request(`/product-requests${buildQuery(params)}`);
    },
    create(payload) {
      return request("/product-requests", {
        method: "POST",
        body: payload
      });
    }
  };

  const enquiries = {
    create(payload) {
      return request("/enquiries", {
        method: "POST",
        body: payload
      });
    },
    list() {
      return request("/enquiries");
    }
  };

  const admin = {
    login(pin) {
      return request("/admin/login", {
        method: "POST",
        body: { pin }
      });
    },
    dashboard(token) {
      return request("/admin/dashboard", { token });
    },
    products: {
      list(token) {
        return request("/admin/products", { token });
      },
      create(token, payload) {
        return request("/admin/products", {
          method: "POST",
          token,
          body: payload
        });
      },
      update(token, id, payload) {
        return request(`/admin/products/${encodeURIComponent(id)}`, {
          method: "PATCH",
          token,
          body: payload
        });
      },
      remove(token, id) {
        return request(`/admin/products/${encodeURIComponent(id)}`, {
          method: "DELETE",
          token
        });
      }
    },
    orders: {
      list(token) {
        return request("/admin/orders", { token });
      },
      updateStatus(token, id, status) {
        return request(`/admin/orders/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          token,
          body: { status }
        });
      }
    },
    enquiries: {
      list(token) {
        return request("/admin/enquiries", { token });
      },
      updateStatus(token, id, status) {
        return request(`/admin/enquiries/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          token,
          body: { status }
        });
      }
    }
  };

  window.ArchhaApi = {
    getBaseUrl,
    setBaseUrl,
    request,
    products,
    auth,
    cart,
    coupons,
    orders,
    reviews,
    notifications,
    searchHistory,
    productRequests,
    enquiries,
    admin
  };
})();
