(function () {
  const baseURL = "https://job-enroll.vercel.app/api";
  const client = window.axios ? axios.create({ baseURL }) : createFetchClient(baseURL);
  let employerPaymentSettings = null;
  let pendingEmployerPayload = null;

  function createFetchClient(apiBaseUrl) {
    async function request(path, options = {}) {
      const query = options.params ? `?${new URLSearchParams(options.params).toString()}` : "";
      const response = await fetch(`${apiBaseUrl}${path}${query}`, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        body: options.body
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.error || "API request failed.");
        error.response = { data };
        throw error;
      }

      return { data };
    }

    return {
      get(path, options = {}) {
        return request(path, options);
      },
      post(path, payload, options = {}) {
        return request(path, { ...options, method: "POST", body: JSON.stringify(payload) });
      },
      put(path, payload, options = {}) {
        return request(path, { ...options, method: "PUT", body: JSON.stringify(payload) });
      },
      delete(path, options = {}) {
        return request(path, { ...options, method: "DELETE" });
      }
    };
  }

  function requireClient() {
    if (!client) {
      throw new Error("Axios is required before calling the API.");
    }

    return client;
  }

  function setStatus(element, message, isError) {
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#d93025" : "#038f42";
  }

  function getToastRoot() {
    let root = document.querySelector("[data-toast-root]");

    if (!root) {
      root = document.createElement("div");
      root.className = "toast-root";
      root.setAttribute("data-toast-root", "");
      document.body.appendChild(root);
    }

    return root;
  }

  function toast(message, type = "info") {
    const root = getToastRoot();
    const item = document.createElement("div");
    item.className = `glass-toast glass-toast-${type}`;
    item.setAttribute("role", "status");
    item.innerHTML = `
      <span class="glass-toast-icon"></span>
      <span class="glass-toast-message">${message}</span>
      <button class="glass-toast-close" type="button" aria-label="Dismiss">&times;</button>
    `;

    const close = () => {
      item.classList.add("is-hiding");
      setTimeout(() => item.remove(), 220);
    };

    item.querySelector("button").addEventListener("click", close);
    root.appendChild(item);
    requestAnimationFrame(() => item.classList.add("is-visible"));
    setTimeout(close, type === "error" ? 6500 : 4200);
  }

  function authHeaders() {
    const token = localStorage.getItem("careerRecruitToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("careerRecruitUser") || "null");
    } catch (error) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem("careerRecruitToken");
    localStorage.removeItem("careerRecruitUser");
    toast("You have been logged out.", "info");
    window.location.href = window.location.pathname.includes("/admin/") ? "../login.html" : "login.html";
  }

  function withAuth(role) {
    const token = localStorage.getItem("careerRecruitToken");
    const user = getStoredUser();

    if (!token || !user) {
      return false;
    }

    return role ? user.role === role : true;
  }

  function renderAuthHeader() {
    document.querySelectorAll(".header-action-area").forEach((area) => {
      const existing = area.querySelector("[data-auth-state]");
      if (existing) existing.remove();

      const user = getStoredUser();
      const wrap = document.createElement("div");
      wrap.className = "auth-state";
      wrap.setAttribute("data-auth-state", "");

      if (user) {
        wrap.innerHTML = `
          <span class="auth-pill">${user.role}: ${user.email}</span>
          <button class="auth-logout" type="button" aria-label="Logout" title="Logout"><i class="icofont-logout"></i></button>
        `;
        wrap.querySelector("button").addEventListener("click", logout);
        const registrationButton = area.querySelector(".btn-registration");
        if (registrationButton) registrationButton.style.display = "none";
      } else {
        const registrationButton = area.querySelector(".btn-registration");
        if (registrationButton) registrationButton.style.display = "";
        wrap.innerHTML = "";
      }

      area.insertBefore(wrap, area.firstChild);
    });
  }

  function renderAsideAuth() {
    document.querySelectorAll(".off-canvas-wrapper .offcanvas-body").forEach((body) => {
      const existing = body.querySelector("[data-aside-auth]");
      if (existing) existing.remove();

      const user = getStoredUser();
      const panel = document.createElement("div");
      panel.className = "aside-auth-panel";
      panel.setAttribute("data-aside-auth", "");

      if (user) {
        const dashboardHref = user.role === "admin" ? "admin/" : "job.html";
        panel.innerHTML = `
          <div class="aside-auth-user">
            <div>
              <strong>${user.email}</strong>
              <small>${user.role}</small>
            </div>
          </div>
          <div class="aside-auth-actions">
            <a href="${dashboardHref}"><i class="icofont-dashboard"></i> ${user.role === "admin" ? "Dashboard" : "Jobs"}</a>
            <button type="button" aria-label="Logout" title="Logout"><i class="icofont-logout"></i></button>
          </div>
        `;
        panel.querySelector("button").addEventListener("click", logout);
      } else {
        panel.innerHTML = `
          <div class="aside-auth-user">
            <div>
              <strong>Account</strong>
              <small>Login or create an account</small>
            </div>
          </div>
          <div class="aside-auth-actions">
            <a href="login.html">Login</a>
            <a href="registration.html"><i class="icofont-plus"></i> Register</a>
          </div>
        `;
      }

      body.insertBefore(panel, body.firstChild);
    });
  }

  function setLoading(form, isLoading, label) {
    const button = form.querySelector("button[type='submit']");
    if (!button) return;

    if (!button.dataset.defaultText) {
      button.dataset.defaultText = button.textContent;
    }

    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
    button.textContent = isLoading ? label : button.dataset.defaultText;
  }

  function setButtonLoading(button, isLoading, label) {
    if (!button) return;

    if (!button.dataset.defaultText) {
      button.dataset.defaultText = button.textContent;
    }

    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
    button.textContent = isLoading ? label : button.dataset.defaultText;
  }

  function formPayload(form) {
    const payload = Object.fromEntries(new FormData(form).entries());
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") payload[key] = null;
    });
    return payload;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function skeletonLine(width = "100%") {
    return `<span class="skeleton-line" style="width:${width}"></span>`;
  }

  function skeletonJobCard() {
    return `
      <div class="col-md-6 col-lg-4">
        <div class="recent-job-item recent-job-style2-item skeleton-card" aria-hidden="true">
          <div class="company-info">
            <div class="logo skeleton-box skeleton-logo"></div>
            <div class="content">
              ${skeletonLine("72%")}
              ${skeletonLine("52%")}
            </div>
          </div>
          <div class="main-content">
            ${skeletonLine("84%")}
            ${skeletonLine("36%")}
            ${skeletonLine("100%")}
            ${skeletonLine("78%")}
          </div>
          <div class="recent-job-info">
            <div class="salary">${skeletonLine("90px")}</div>
            <span class="skeleton-button"></span>
          </div>
        </div>
      </div>
    `;
  }

  function skeletonJobCards(count = 6) {
    return Array.from({ length: count }, skeletonJobCard).join("");
  }

  function skeletonCategoryCards(count = 8) {
    return Array.from({ length: count }, () => `
      <div class="col-sm-6 col-lg-3">
        <div class="job-category-item skeleton-card" aria-hidden="true">
          <div class="content">
            ${skeletonLine("80%")}
            ${skeletonLine("42%")}
          </div>
        </div>
      </div>
    `).join("");
  }

  function skeletonCandidateCards(count = 4) {
    return Array.from({ length: count }, () => `
      <div class="col-sm-6 col-md-6 col-lg-4 col-xl-3">
        <div class="team-item skeleton-card" aria-hidden="true">
          <div class="thumb"><span class="skeleton-box skeleton-candidate-photo"></span></div>
          <div class="content">
            ${skeletonLine("76%")}
            ${skeletonLine("54%")}
            ${skeletonLine("100%")}
            <span class="skeleton-button"></span>
          </div>
        </div>
      </div>
    `).join("");
  }

  function skeletonBlogCards(count = 6) {
    return Array.from({ length: count }, () => `
      <div class="col-sm-6 col-lg-4 col-xl-6">
        <div class="post-item skeleton-card" aria-hidden="true">
          <div class="thumb"><span class="skeleton-box" style="display:block;height:210px"></span></div>
          <div class="content">
            ${skeletonLine("62%")}
            ${skeletonLine("92%")}
            ${skeletonLine("84%")}
            ${skeletonLine("100%")}
            ${skeletonLine("72%")}
          </div>
        </div>
      </div>
    `).join("");
  }

  function skeletonTestimonialSlides(count = 3) {
    return Array.from({ length: count }, () => `
      <div class="swiper-slide">
        <div class="testimonial-item skeleton-card" aria-hidden="true">
          <div class="testi-inner-content">
            <div class="testi-author">
              <div class="testi-thumb"><span class="skeleton-box skeleton-logo"></span></div>
              <div class="testi-info">
                ${skeletonLine("130px")}
                ${skeletonLine("95px")}
              </div>
            </div>
            <div class="testi-content">
              ${skeletonLine("100%")}
              ${skeletonLine("92%")}
              ${skeletonLine("74%")}
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  function skeletonAdminRows(count = 5) {
    return Array.from({ length: count }, () => `
      <div class="admin-list-item admin-table-list skeleton-card" aria-hidden="true">
        <span>
          ${skeletonLine("260px")}
          ${skeletonLine("190px")}
        </span>
        <div class="admin-actions">
          <span class="skeleton-button"></span>
          <span class="skeleton-button skeleton-button-small"></span>
        </div>
      </div>
    `).join("");
  }

  function skeletonJobDetails() {
    return `
      <div class="row">
        <div class="col-12">
          <div class="job-details-wrap skeleton-card" aria-hidden="true">
            <div class="job-details-info">
              <div class="thumb skeleton-box skeleton-detail-logo"></div>
              <div class="content">
                ${skeletonLine("320px")}
                ${skeletonLine("220px")}
                ${skeletonLine("260px")}
              </div>
            </div>
            <div class="job-details-price">
              ${skeletonLine("140px")}
              <span class="skeleton-button"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-7 col-xl-8">
          <div class="job-details-item skeleton-detail-body" aria-hidden="true">
            ${skeletonLine("180px")}
            ${skeletonLine("100%")}
            ${skeletonLine("92%")}
            ${skeletonLine("96%")}
            ${skeletonLine("62%")}
            ${skeletonLine("210px")}
            ${skeletonLine("88%")}
            ${skeletonLine("74%")}
          </div>
        </div>
        <div class="col-lg-5 col-xl-4">
          <div class="job-sidebar">
            <div class="widget-item skeleton-card" aria-hidden="true">
              ${skeletonLine("150px")}
              ${skeletonLine("100%")}
              ${skeletonLine("92%")}
              ${skeletonLine("88%")}
              ${skeletonLine("94%")}
              ${skeletonLine("78%")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.CareerRecruitApi = {
    client,
    getStoredUser,
    logout,
    renderAsideAuth,
    renderAuthHeader,
    toast,
    withAuth,
    getPaymentSettings() {
      return requireClient().get("/settings/payment").then((response) => response.data.data);
    },
    register(payload) {
      return requireClient().post("/auth/register", payload).then((response) => response.data.data);
    },
    login(payload) {
      return requireClient().post("/auth/login", payload).then((response) => response.data.data);
    },
    updatePaymentSettings(payload) {
      return requireClient().put("/admin/payment-settings", payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listPendingEmployers() {
      return requireClient().get("/admin/employers/pending", { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    verifyEmployer(id) {
      return requireClient().put(`/admin/employers/${id}/verify`, {}, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listCategories(params = {}) {
      return requireClient().get("/categories", { params }).then((response) => response.data.data);
    },
    createCategory(payload) {
      return requireClient().post("/admin/categories", payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    updateCategory(id, payload) {
      return requireClient().put(`/admin/categories/${id}`, payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    deleteCategory(id) {
      return requireClient().delete(`/admin/categories/${id}`, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listJobs(params = {}) {
      return requireClient().get("/jobs", { params }).then((response) => response.data.data);
    },
    getJob(id) {
      return requireClient().get(`/jobs/${id}`).then((response) => response.data.data);
    },
    createJob(payload) {
      return requireClient().post("/admin/jobs", payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    updateJob(id, payload) {
      return requireClient().put(`/admin/jobs/${id}`, payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    deleteJob(id) {
      return requireClient().delete(`/admin/jobs/${id}`, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listCandidates(params = {}) {
      return requireClient().get("/candidates", { params }).then((response) => response.data.data);
    },
    listAdminCandidates(params = {}) {
      return requireClient().get("/admin/candidates", { params, headers: authHeaders() })
        .then((response) => response.data.data);
    },
    getCandidate(id) {
      return requireClient().get(`/candidates/${id}`).then((response) => response.data.data);
    },
    createCandidate(payload) {
      return requireClient().post("/admin/candidates", payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    updateCandidate(id, payload) {
      return requireClient().put(`/admin/candidates/${id}`, payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    deleteCandidate(id) {
      return requireClient().delete(`/admin/candidates/${id}`, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listTestimonials(params = {}) {
      return requireClient().get("/testimonials", { params }).then((response) => response.data.data);
    },
    listAdminTestimonials(params = {}) {
      return requireClient().get("/admin/testimonials", { params, headers: authHeaders() })
        .then((response) => response.data.data);
    },
    createTestimonial(payload) {
      return requireClient().post("/admin/testimonials", payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    updateTestimonial(id, payload) {
      return requireClient().put(`/admin/testimonials/${id}`, payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    deleteTestimonial(id) {
      return requireClient().delete(`/admin/testimonials/${id}`, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listBlogs(params = {}) {
      return requireClient().get("/blogs", { params }).then((response) => response.data.data);
    },
    getBlog(id) {
      return requireClient().get(`/blogs/${id}`).then((response) => response.data.data);
    },
    listBlogCategories() {
      return requireClient().get("/blogs/categories/list").then((response) => response.data.data);
    },
    listBlogComments(id, params = {}) {
      return requireClient().get(`/blogs/${id}/comments`, { params }).then((response) => response.data.data);
    },
    createBlogComment(id, payload) {
      return requireClient().post(`/blogs/${id}/comments`, payload).then((response) => response.data.data);
    },
    listAdminBlogComments(params = {}) {
      return requireClient().get("/admin/blog-comments", { params, headers: authHeaders() })
        .then((response) => response.data.data);
    },
    deleteBlogComment(id) {
      return requireClient().delete(`/admin/blog-comments/${id}`, { headers: authHeaders() })
        .then((response) => response.data.data);
    }
  };

  async function loadEmployerPaymentSettings() {
    const fees = document.querySelectorAll("[data-employer-fee]");
    const walletNames = document.querySelectorAll("[data-wallet-name]");
    const walletAddresses = document.querySelectorAll("[data-wallet-address]");
    const feeInput = document.querySelector("[name='employer_fee_amount']");

    if (!fees.length && !walletNames.length && !walletAddresses.length) return;

    try {
      const settings = await window.CareerRecruitApi.getPaymentSettings();
      employerPaymentSettings = settings;
      fees.forEach((fee) => { fee.textContent = `${settings.registration_fee} ${settings.fee_currency}`; });
      walletNames.forEach((walletName) => { walletName.textContent = settings.wallet_name; });
      walletAddresses.forEach((walletAddress) => { walletAddress.textContent = settings.wallet_address; });
      if (feeInput) feeInput.value = settings.registration_fee;
    } catch (error) {
      const message = "Unable to load employer payment settings.";
      setStatus(document.querySelector("[data-register-status]"), message, true);
      toast(message, "error");
    }
  }

  function setPaymentModal(open) {
    const modal = document.querySelector("[data-employer-payment-modal]");
    if (!modal) return;

    modal.hidden = !open;
    document.body.classList.toggle("modal-open", open);
  }

  function openEmployerPaymentModal(payload) {
    pendingEmployerPayload = payload;
    const status = document.querySelector("[data-payment-modal-status]");
    const reference = document.querySelector("[data-payment-reference]");

    if (status) {
      status.textContent = "";
    }

    if (reference) {
      reference.value = payload.payment_reference || "";
    }

    if (!employerPaymentSettings) {
      toast("Payment settings are still loading. Try again in a moment.", "info");
    }

    setPaymentModal(true);
  }

  function bindRegistrationForms() {
    document.querySelectorAll("[data-register-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const status = form.querySelector("[data-register-status]") || document.querySelector("[data-register-status]");
        const formData = new FormData(form);

        if (formData.get("password") !== formData.get("confirm_password")) {
          const message = "Passwords do not match.";
          setStatus(status, message, true);
          toast(message, "error");
          return;
        }

        if (formData.get("role") === "employer") {
          openEmployerPaymentModal(Object.fromEntries(formData.entries()));
          return;
        }

        try {
          setLoading(form, true, "Creating account...");
          const user = await window.CareerRecruitApi.register(Object.fromEntries(formData.entries()));
          const message = user.role === "employer"
            ? "Employer account submitted. Admin verification is required after payment."
            : "Candidate account created. You can now log in.";
          setStatus(status, message, false);
          toast(message, "success");
          form.reset();
          loadEmployerPaymentSettings();
        } catch (error) {
          const message = error.response?.data?.error || "Registration failed.";
          setStatus(status, message, true);
          toast(message, "error");
        } finally {
          setLoading(form, false);
        }
      });
    });
  }

  function bindEmployerPaymentModal() {
    const modal = document.querySelector("[data-employer-payment-modal]");
    if (!modal) return;

    modal.querySelectorAll("[data-payment-modal-close]").forEach((button) => {
      button.addEventListener("click", () => setPaymentModal(false));
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        setPaymentModal(false);
      }
    });

    const copyButton = modal.querySelector("[data-copy-wallet]");
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        const address = modal.querySelector("[data-wallet-address]")?.textContent?.trim();
        if (!address || address === "Loading...") {
          toast("Wallet address is not ready yet.", "error");
          return;
        }

        try {
          await navigator.clipboard.writeText(address);
          toast("Wallet address copied.", "success");
        } catch (error) {
          const textarea = document.createElement("textarea");
          textarea.value = address;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
          toast("Wallet address copied.", "success");
        }
      });
    }

    const paidButton = modal.querySelector("[data-payment-paid]");
    if (paidButton) {
      paidButton.addEventListener("click", async () => {
        const status = modal.querySelector("[data-payment-modal-status]");
        const reference = modal.querySelector("[data-payment-reference]")?.value?.trim();

        if (!pendingEmployerPayload) {
          toast("Employer registration form is missing.", "error");
          return;
        }

        if (!reference) {
          const message = "Enter your payment transaction reference.";
          setStatus(status, message, true);
          toast(message, "error");
          return;
        }

        try {
          setButtonLoading(paidButton, true, "Submitting...");
          const payload = {
            ...pendingEmployerPayload,
            payment_reference: reference,
            employer_fee_amount: employerPaymentSettings?.registration_fee || pendingEmployerPayload.employer_fee_amount
          };
          const user = await window.CareerRecruitApi.register(payload);
          const message = "Employer account submitted. Admin verification is required after payment.";
          setStatus(status, message, false);
          toast(message, "success");
          document.querySelector("form[data-register-form] input[name='role'][value='employer']")?.closest("form")?.reset();
          pendingEmployerPayload = null;
          setPaymentModal(false);
          loadEmployerPaymentSettings();
        } catch (error) {
          const message = error.response?.data?.error || "Registration failed.";
          setStatus(status, message, true);
          toast(message, "error");
        } finally {
          setButtonLoading(paidButton, false);
        }
      });
    }
  }

  function bindLoginForm() {
    const form = document.querySelector("[data-login-form]");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const status = form.querySelector("[data-login-status]");
      const formData = new FormData(form);

      try {
        setLoading(form, true, "Signing in...");
        const result = await window.CareerRecruitApi.login(Object.fromEntries(formData.entries()));
        localStorage.setItem("careerRecruitToken", result.token);
        localStorage.setItem("careerRecruitUser", JSON.stringify(result.user));
        renderAuthHeader();
        renderAsideAuth();
        const message = `Signed in as ${result.user.role}.`;
        setStatus(status, message, false);
        toast(message, "success");
        if (result.user.role === "admin") {
          window.location.href = "admin/";
        }
      } catch (error) {
        const message = error.response?.data?.error || "Login failed.";
        setStatus(status, message, true);
        toast(message, "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  async function loadAdminPage() {
    const form = document.querySelector("[data-admin-payment-form]");
    const list = document.querySelector("[data-pending-employers]");
    const adminPage = document.querySelector("[data-admin-page]");

    if (!adminPage && !form && !list) return;

    if (!withAuth("admin")) {
      const message = "Admin login required.";
      setStatus(document.querySelector("[data-admin-status]"), message, true);
      toast(message, "error");
      setTimeout(() => {
        window.location.href = "../login.html";
      }, 800);
      return;
    }

    const user = getStoredUser();

    try {
      const settings = await window.CareerRecruitApi.getPaymentSettings();
      if (form) {
        form.registration_fee.value = settings.registration_fee;
        form.fee_currency.value = settings.fee_currency;
        form.wallet_name.value = settings.wallet_name;
        form.wallet_address.value = settings.wallet_address;
      }

      const walletName = document.querySelector("[data-dashboard-wallet]");
      const fee = document.querySelector("[data-dashboard-fee]");
      if (walletName) walletName.textContent = settings.wallet_name;
      if (fee) fee.textContent = `${settings.registration_fee} ${settings.fee_currency}`;

      if (list) {
        const employers = await window.CareerRecruitApi.listPendingEmployers();
        const pendingCount = document.querySelector("[data-pending-count]");
        if (pendingCount) pendingCount.textContent = employers.length;
        list.innerHTML = employers.length ? "" : "<p>No pending employers.</p>";
        employers.forEach((employer) => {
          const item = document.createElement("div");
          item.className = "admin-list-item";
          item.innerHTML = `<span><strong>${employer.email}</strong><small>${employer.payment_status || "pending payment"}</small></span><button class="btn-theme btn-sm" type="button">Verify</button>`;
          item.querySelector("button").addEventListener("click", async () => {
            await window.CareerRecruitApi.verifyEmployer(employer.id);
            item.remove();
            toast("Employer verified.", "success");
            if (pendingCount) pendingCount.textContent = Math.max(Number(pendingCount.textContent) - 1, 0);
          });
          list.appendChild(item);
        });
      } else {
        const employers = await window.CareerRecruitApi.listPendingEmployers();
        const pendingCount = document.querySelector("[data-pending-count]");
        if (pendingCount) pendingCount.textContent = employers.length;
      }
    } catch (error) {
      const message = error.response?.data?.error || "Unable to load admin data.";
      setStatus(document.querySelector("[data-admin-status]"), message, true);
      toast(message, "error");
    }
  }

  function bindAdminPaymentForm() {
    const form = document.querySelector("[data-admin-payment-form]");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.querySelector("[data-admin-status]");

      try {
        setLoading(form, true, "Saving...");
        await window.CareerRecruitApi.updatePaymentSettings(Object.fromEntries(new FormData(form).entries()));
        setStatus(status, "Payment settings saved.", false);
        toast("Payment settings saved.", "success");
        loadAdminPage();
      } catch (error) {
        const message = error.response?.data?.error || "Unable to save settings.";
        setStatus(status, message, true);
        toast(message, "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  function fillForm(form, row) {
    Object.keys(row).forEach((key) => {
      if (form.elements[key]) {
        form.elements[key].value = row[key] || "";
      }
    });
  }

  async function loadAdminCategories() {
    const list = document.querySelector("[data-admin-categories]");
    if (!list) return;

    list.innerHTML = skeletonAdminRows();

    try {
      const categories = await window.CareerRecruitApi.listCategories({ limit: 200 });
      list.innerHTML = categories.length ? "" : "<p>No categories found.</p>";
      categories.forEach((category) => {
        const item = document.createElement("div");
        item.className = "admin-list-item admin-table-list";
        item.innerHTML = `
          <span>
            <strong>${escapeHtml(category.name)}</strong>
            <small>${escapeHtml(category.slug)} · ${Number(category.job_count || 0)} jobs · ${escapeHtml(category.status)}</small>
          </span>
          <div class="admin-actions">
            <button class="btn-theme btn-sm" type="button" data-action="edit">Edit</button>
            <button class="admin-danger-btn" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector("[data-action='edit']").addEventListener("click", () => {
          const form = document.querySelector("[data-category-form]");
          if (!form) return;
          fillForm(form, category);
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        item.querySelector("[data-action='delete']").addEventListener("click", async () => {
          await window.CareerRecruitApi.deleteCategory(category.id);
          toast("Category deleted.", "success");
          loadAdminCategories();
        });
        list.appendChild(item);
      });
    } catch (error) {
      toast(error.response?.data?.error || "Unable to load categories.", "error");
    }
  }

  function bindAdminCategoryForm() {
    const form = document.querySelector("[data-category-form]");
    if (!form) return;

    const resetButton = form.querySelector("[data-reset-form]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        form.reset();
        form.elements.id.value = "";
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formPayload(form);
      const id = payload.id;
      delete payload.id;
      if (!payload.slug) payload.slug = slugify(payload.name);

      try {
        setLoading(form, true, "Saving...");
        if (id) {
          await window.CareerRecruitApi.updateCategory(id, payload);
        } else {
          await window.CareerRecruitApi.createCategory(payload);
        }
        toast("Category saved.", "success");
        form.reset();
        form.elements.id.value = "";
        loadAdminCategories();
      } catch (error) {
        toast(error.response?.data?.error || "Unable to save category.", "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  async function loadAdminJobs() {
    const list = document.querySelector("[data-admin-jobs]");
    const categorySelect = document.querySelector("[data-job-form] select[name='category']");
    if (!list && !categorySelect) return;

    try {
      const categories = await window.CareerRecruitApi.listCategories({ limit: 200, status: "active" });
      if (categorySelect) {
        const current = categorySelect.value;
        categorySelect.innerHTML = `<option value="">Category</option>${categories.map((category) => (
          `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`
        )).join("")}`;
        categorySelect.value = current;
      }

      if (!list) return;

      list.innerHTML = skeletonAdminRows();

      const jobs = await window.CareerRecruitApi.listJobs({ limit: 100 });
      list.innerHTML = jobs.length ? "" : "<p>No jobs found.</p>";
      jobs.forEach((job) => {
        const item = document.createElement("div");
        item.className = "admin-list-item admin-table-list";
        item.innerHTML = `
          <span>
            <strong>${escapeHtml(job.title)}</strong>
            <small>${escapeHtml(job.company_name)} · ${escapeHtml(job.category)} · ${escapeHtml(job.location)} · ${escapeHtml(job.status)}</small>
          </span>
          <div class="admin-actions">
            <button class="btn-theme btn-sm" type="button" data-action="edit">Edit</button>
            <button class="admin-danger-btn" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector("[data-action='edit']").addEventListener("click", () => {
          const form = document.querySelector("[data-job-form]");
          if (!form) return;
          fillForm(form, job);
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        item.querySelector("[data-action='delete']").addEventListener("click", async () => {
          await window.CareerRecruitApi.deleteJob(job.id);
          toast("Job deleted.", "success");
          loadAdminJobs();
        });
        list.appendChild(item);
      });
    } catch (error) {
      toast(error.response?.data?.error || "Unable to load jobs.", "error");
    }
  }

  function bindAdminJobForm() {
    const form = document.querySelector("[data-job-form]");
    if (!form) return;

    const resetButton = form.querySelector("[data-reset-form]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        form.reset();
        form.elements.id.value = "";
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formPayload(form);
      const id = payload.id;
      delete payload.id;
      if (!payload.slug) payload.slug = slugify(`${payload.title}-${payload.company_name}`);

      try {
        setLoading(form, true, "Saving...");
        if (id) {
          await window.CareerRecruitApi.updateJob(id, payload);
        } else {
          await window.CareerRecruitApi.createJob(payload);
        }
        toast("Job saved.", "success");
        form.reset();
        form.elements.id.value = "";
        loadAdminJobs();
      } catch (error) {
        toast(error.response?.data?.error || "Unable to save job.", "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  async function loadAdminCandidates() {
    const list = document.querySelector("[data-admin-candidates]");
    if (!list) return;

    list.innerHTML = skeletonAdminRows();

    try {
      const candidates = await window.CareerRecruitApi.listAdminCandidates({ limit: 100 });
      list.innerHTML = candidates.length ? "" : "<p>No candidates found.</p>";
      candidates.forEach((candidate) => {
        const item = document.createElement("div");
        item.className = "admin-list-item admin-table-list";
        item.innerHTML = `
          <span>
            <strong>${escapeHtml(candidateName(candidate))}</strong>
            <small>${escapeHtml(candidate.title)} · ${escapeHtml(candidate.location)} · ${escapeHtml(candidate.email)}</small>
          </span>
          <div class="admin-actions">
            <button class="btn-theme btn-sm" type="button" data-action="edit">Edit</button>
            <button class="admin-danger-btn" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector("[data-action='edit']").addEventListener("click", () => {
          const form = document.querySelector("[data-candidate-form]");
          if (!form) return;
          fillForm(form, candidate);
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        item.querySelector("[data-action='delete']").addEventListener("click", async () => {
          await window.CareerRecruitApi.deleteCandidate(candidate.id);
          toast("Candidate deleted.", "success");
          loadAdminCandidates();
        });
        list.appendChild(item);
      });
    } catch (error) {
      toast(error.response?.data?.error || "Unable to load candidates.", "error");
    }
  }

  function bindAdminCandidateForm() {
    const form = document.querySelector("[data-candidate-form]");
    if (!form) return;

    const resetButton = form.querySelector("[data-reset-form]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        form.reset();
        form.elements.id.value = "";
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formPayload(form);
      const id = payload.id;
      delete payload.id;

      try {
        setLoading(form, true, "Saving...");
        if (id) {
          await window.CareerRecruitApi.updateCandidate(id, payload);
        } else {
          await window.CareerRecruitApi.createCandidate(payload);
        }
        toast("Candidate saved.", "success");
        form.reset();
        form.elements.id.value = "";
        loadAdminCandidates();
      } catch (error) {
        toast(error.response?.data?.error || "Unable to save candidate.", "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  async function loadAdminTestimonials() {
    const list = document.querySelector("[data-admin-testimonials]");
    if (!list) return;

    list.innerHTML = skeletonAdminRows();

    try {
      const testimonials = await window.CareerRecruitApi.listAdminTestimonials({ limit: 100 });
      list.innerHTML = testimonials.length ? "" : "<p>No testimonials found.</p>";
      testimonials.forEach((testimonial) => {
        const item = document.createElement("div");
        item.className = "admin-list-item admin-table-list";
        item.innerHTML = `
          <span>
            <strong>${escapeHtml(testimonial.client_name)}</strong>
            <small>${escapeHtml(testimonial.designation)} · ${escapeHtml(testimonial.company || "No company")} · ${escapeHtml(testimonial.status)} · ${Number(testimonial.rating || 0)} stars</small>
          </span>
          <div class="admin-actions">
            <button class="btn-theme btn-sm" type="button" data-action="edit">Edit</button>
            <button class="admin-danger-btn" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector("[data-action='edit']").addEventListener("click", () => {
          const form = document.querySelector("[data-testimonial-form]");
          if (!form) return;
          fillForm(form, testimonial);
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        item.querySelector("[data-action='delete']").addEventListener("click", async () => {
          await window.CareerRecruitApi.deleteTestimonial(testimonial.id);
          toast("Testimonial deleted.", "success");
          loadAdminTestimonials();
        });
        list.appendChild(item);
      });
    } catch (error) {
      toast(error.response?.data?.error || "Unable to load testimonials.", "error");
    }
  }

  function bindAdminTestimonialForm() {
    const form = document.querySelector("[data-testimonial-form]");
    if (!form) return;

    const resetButton = form.querySelector("[data-reset-form]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        form.reset();
        form.elements.id.value = "";
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formPayload(form);
      const id = payload.id;
      delete payload.id;
      if (!payload.slug) payload.slug = slugify(payload.client_name);

      try {
        setLoading(form, true, "Saving...");
        if (id) {
          await window.CareerRecruitApi.updateTestimonial(id, payload);
        } else {
          await window.CareerRecruitApi.createTestimonial(payload);
        }
        toast("Testimonial saved.", "success");
        form.reset();
        form.elements.id.value = "";
        loadAdminTestimonials();
      } catch (error) {
        toast(error.response?.data?.error || "Unable to save testimonial.", "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  async function loadAdminBlogComments() {
    const list = document.querySelector("[data-admin-blog-comments]");
    if (!list) return;

    list.innerHTML = skeletonAdminRows();

    try {
      const comments = await window.CareerRecruitApi.listAdminBlogComments({ limit: 100 });
      list.innerHTML = comments.length ? "" : "<p>No blog comments found.</p>";
      comments.forEach((comment) => {
        const item = document.createElement("div");
        item.className = "admin-list-item admin-table-list";
        item.innerHTML = `
          <span>
            <strong>${escapeHtml(comment.name)} on ${escapeHtml(comment.blog_title || "Blog post")}</strong>
            <small>${escapeHtml(comment.email)} · ${escapeHtml(comment.status)} · ${escapeHtml(formatDate(comment.created_at))}</small>
            <small>${escapeHtml(truncateText(comment.message, 130))}</small>
          </span>
          <div class="admin-actions">
            <a class="admin-secondary-btn" href="../blog-details.html?id=${encodeURIComponent(comment.blog_slug || comment.blog_id)}">View</a>
            <button class="admin-danger-btn" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector("[data-action='delete']").addEventListener("click", async () => {
          await window.CareerRecruitApi.deleteBlogComment(comment.id);
          toast("Comment deleted.", "success");
          loadAdminBlogComments();
        });
        list.appendChild(item);
      });
    } catch (error) {
      toast(error.response?.data?.error || "Unable to load blog comments.", "error");
    }
  }

  function bindAdminSubnavToggle() {
    document.querySelectorAll(".admin-management-layout").forEach((layout) => {
      if (layout.querySelector("[data-admin-nav-toggle]")) return;
      const nav = layout.querySelector(".admin-subnav");
      if (!nav) return;

      const button = document.createElement("button");
      button.className = "admin-nav-toggle";
      button.type = "button";
      button.setAttribute("data-admin-nav-toggle", "");
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = `<i class="icofont-navigation-menu"></i><span>Admin Menu</span>`;

      button.addEventListener("click", () => {
        const open = layout.classList.toggle("is-admin-nav-open");
        button.setAttribute("aria-expanded", open ? "true" : "false");
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          layout.classList.remove("is-admin-nav-open");
          button.setAttribute("aria-expanded", "false");
        });
      });

      layout.insertBefore(button, nav);
    });
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function formatDate(value) {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).split("T")[0];
    return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }

  function splitList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function truncateText(value, maxLength = 95) {
    const text = String(value || "").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3).trim()}...`;
  }

  function companyLogo(job) {
    const id = Number(job.id || 1);
    return `assets/img/companies/w${((id - 1) % 9) + 1}.jpg`;
  }

  function jobDetailsHref(job) {
    return `job-details.html?id=${encodeURIComponent(job.id)}`;
  }

  function renderJobCard(job) {
    const workTypeColor = String(job.job_type || "").toLowerCase().includes("remote")
      ? "#0054ff"
      : String(job.job_type || "").toLowerCase().includes("part")
        ? "#ff7e00"
        : "#03a84e";

    return `
      <div class="col-md-6 col-lg-4">
        <div class="recent-job-item recent-job-style2-item db-job-card">
          <div class="company-info">
            <div class="logo">
              <a href="${jobDetailsHref(job)}"><img src="${companyLogo(job)}" width="75" height="75" alt="${escapeHtml(job.company_name)} logo"></a>
            </div>
            <div class="content">
              <h4 class="name"><a href="${jobDetailsHref(job)}">${escapeHtml(job.company_name)}</a></h4>
              <p class="address">${escapeHtml(job.location)}</p>
            </div>
          </div>
          <div class="main-content">
            <h3 class="title"><a href="${jobDetailsHref(job)}">${escapeHtml(job.title)}</a></h3>
            <h5 class="work-type" data-text-color="${workTypeColor}">${escapeHtml(job.job_type || "Full-time")}</h5>
            <p class="desc">${escapeHtml(truncateText(job.description || job.requirements || job.category))}</p>
            <p class="job-card-meta">${escapeHtml(job.category || "")}${job.experience ? ` · ${escapeHtml(job.experience)}` : ""}</p>
          </div>
          <div class="recent-job-info">
            <div class="salary">
              <h4>${escapeHtml(job.salary || "Negotiable")}</h4>
            </div>
            <a class="btn-theme btn-sm" href="${jobDetailsHref(job)}">Apply Now</a>
          </div>
        </div>
      </div>
    `;
  }

  function jobPageHref(page, filters = {}) {
    const params = new URLSearchParams();
    params.set("page", page);
    if (filters.category) params.set("category", filters.category);
    if (filters.search) params.set("search", filters.search);
    if (filters.location) params.set("location", filters.location);
    return `job.html?${params.toString()}`;
  }

  function renderPagination(page, hasNext, filters) {
    const pagination = document.querySelector(".recent-job-inner-area .page-numbers");
    if (!pagination) return;

    const items = [];
    if (page > 1) {
      items.push(`<li><a class="page-number prev" href="${jobPageHref(page - 1, filters)}"><i class="icofont-long-arrow-left"></i></a></li>`);
    }
    if (page > 2) {
      items.push(`<li><a class="page-number" href="${jobPageHref(page - 2, filters)}">${page - 2}</a></li>`);
    }
    if (page > 1) {
      items.push(`<li><a class="page-number" href="${jobPageHref(page - 1, filters)}">${page - 1}</a></li>`);
    }
    items.push(`<li><a class="page-number active" href="${jobPageHref(page, filters)}">${page}</a></li>`);
    if (hasNext) {
      items.push(`<li><a class="page-number" href="${jobPageHref(page + 1, filters)}">${page + 1}</a></li>`);
      items.push(`<li><a class="page-number next" href="${jobPageHref(page + 1, filters)}"><i class="icofont-long-arrow-right"></i></a></li>`);
    }

    pagination.innerHTML = items.join("");
  }

  async function loadPublicJobs() {
    const list = document.querySelector("[data-job-list]");
    if (!list || !window.location.pathname.endsWith("job.html")) return;

    const page = Math.max(Number.parseInt(getQueryParam("page") || "1", 10), 1);
    const filters = {
      category: getQueryParam("category"),
      search: getQueryParam("search"),
      location: getQueryParam("location")
    };
    const perPage = 9;
    list.innerHTML = skeletonJobCards(perPage);

    try {
      const rows = await window.CareerRecruitApi.listJobs({
        status: "active",
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.location ? { location: filters.location } : {}),
        limit: perPage + 1,
        offset: (page - 1) * perPage
      });
      const jobs = rows.slice(0, perPage);
      const hasNext = rows.length > perPage;

      list.innerHTML = jobs.length
        ? jobs.map(renderJobCard).join("")
        : `<div class="col-12"><p class="job-list-status">No jobs found.</p></div>`;
      renderPagination(page, hasNext, filters);
    } catch (error) {
      list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load jobs right now.</p></div>`;
      toast(error.response?.data?.error || "Unable to load jobs.", "error");
    }
  }

  async function bindJobSearchForm() {
    const form = document.querySelector("[data-job-search-form]");
    if (!form) return;

    const categorySelect = form.querySelector("[data-job-category-filter]");
    const filters = {
      search: getQueryParam("search") || "",
      location: getQueryParam("location") || "",
      category: getQueryParam("category") || ""
    };

    if (form.elements.search) form.elements.search.value = filters.search;
    if (form.elements.location) form.elements.location.value = filters.location;

    if (categorySelect) {
      try {
        const categories = await window.CareerRecruitApi.listCategories({ status: "active", limit: 100 });
        categorySelect.innerHTML = `<option value="">All Categories</option>${categories.map((category) => (
          `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`
        )).join("")}`;
        categorySelect.value = filters.category;
      } catch (error) {
        toast("Unable to load job categories.", "error");
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      const data = new FormData(form);
      ["search", "location", "category"].forEach((key) => {
        const value = String(data.get(key) || "").trim();
        if (value) params.set(key, value);
      });
      window.location.href = params.toString() ? `job.html?${params.toString()}` : "job.html";
    });
  }

  function renderDetailList(title, value) {
    const items = splitList(value);
    if (!items.length) return "";

    return `
      <div class="content">
        <h4 class="title">${escapeHtml(title)}</h4>
        <ul class="job-details-list">
          ${items.map((item) => `<li><i class="icofont-check"></i> ${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function summaryRow(name, value, color) {
    return `
      <tr>
        <td class="table-name">${escapeHtml(name)}</td>
        <td class="dotted">:</td>
        <td${color ? ` data-text-color="${color}"` : ""}>${escapeHtml(value || "Not set")}</td>
      </tr>
    `;
  }

  function renderJobDetails(job) {
    const container = document.querySelector(".job-details-area .container");
    if (!container) return;

    container.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="job-details-wrap">
            <div class="job-details-info">
              <div class="thumb">
                <img src="${companyLogo(job)}" width="130" height="130" alt="${escapeHtml(job.company_name)} logo">
              </div>
              <div class="content">
                <h4 class="title">${escapeHtml(job.title)}</h4>
                <h5 class="sub-title">${escapeHtml(job.company_name)}</h5>
                <ul class="info-list">
                  <li><i class="icofont-location-pin"></i> ${escapeHtml(job.location)}</li>
                  <li><i class="icofont-briefcase"></i> ${escapeHtml(job.category)}</li>
                </ul>
              </div>
            </div>
            <div class="job-details-price">
              <h4 class="title">${escapeHtml(job.salary || "Negotiable")}</h4>
              <a href="contact.html" class="btn-theme">Apply Now</a>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-7 col-xl-8">
          <div class="job-details-item">
            <div class="content">
              <h4 class="title">Description</h4>
              <p class="desc">${escapeHtml(job.description || "No description provided.")}</p>
            </div>
            ${renderDetailList("Responsibilities", job.responsibilities)}
            ${renderDetailList("Requirements", job.requirements)}
            ${job.education_requirements ? `<div class="content"><h4 class="title">Educational Requirements</h4><p class="desc">${escapeHtml(job.education_requirements)}</p></div>` : ""}
            ${renderDetailList("Working Hours", job.working_hours)}
            ${renderDetailList("Benefits", job.benefits)}
            <div class="content">
              <h4 class="title">Statement</h4>
              <p class="desc">${escapeHtml(job.statement || "Career Recruit is committed to equal opportunity for all qualified applicants.")}</p>
              <a class="btn-apply-now" href="contact.html">Apply Now <i class="icofont-long-arrow-right"></i></a>
            </div>
          </div>
        </div>
        <div class="col-lg-5 col-xl-4">
          <div class="job-sidebar">
            <div class="widget-item">
              <div class="widget-title">
                <h3 class="title">Summary</h3>
              </div>
              <div class="summery-info">
                <table class="table">
                  <tbody>
                    ${summaryRow("Job Type", job.job_type || "Full-time", "#03a84e")}
                    ${summaryRow("Category", job.category)}
                    ${summaryRow("Posted", formatDate(job.created_at))}
                    ${summaryRow("Salary", job.salary || "Negotiable")}
                    ${summaryRow("Experience", job.experience)}
                    ${summaryRow("Gender", job.gender)}
                    ${summaryRow("Qualification", job.qualification)}
                    ${summaryRow("Level", job.level)}
                    ${summaryRow("Vacancy", job.vacancy)}
                    ${summaryRow("Application End", formatDate(job.deadline || job.expires_at), "#ff6000")}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="widget-item widget-tag">
              <div class="widget-title">
                <h3 class="title">Tags:</h3>
              </div>
              <div class="widget-tag-list">
                <a href="job.html?category=${encodeURIComponent(job.category || "")}">${escapeHtml(job.category)}</a>
                <a href="job.html">${escapeHtml(job.job_type || "Full-time")}</a>
                <a href="job.html">${escapeHtml(job.location || "Remote")}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadPublicJobDetails() {
    if (!window.location.pathname.endsWith("job-details.html")) return;
    const container = document.querySelector(".job-details-area .container");
    if (!container) return;

    const id = getQueryParam("id");
    container.innerHTML = skeletonJobDetails();

    try {
      let job;
      if (id) {
        job = await window.CareerRecruitApi.getJob(id);
      } else {
        const jobs = await window.CareerRecruitApi.listJobs({ status: "active", limit: 1, offset: 0 });
        job = jobs[0];
      }

      if (!job) {
        container.innerHTML = `<div class="row"><div class="col-12"><p class="job-list-status">Job not found.</p></div></div>`;
        return;
      }

      renderJobDetails(job);
    } catch (error) {
      container.innerHTML = `<div class="row"><div class="col-12"><p class="job-list-status is-error">Unable to load job details.</p></div></div>`;
      toast(error.response?.data?.error || "Unable to load job details.", "error");
    }
  }

  function renderHomeCategory(category) {
    const href = `job.html?category=${encodeURIComponent(category.name)}`;
    return `
      <div class="col-sm-6 col-lg-3">
        <div class="job-category-item">
          <div class="content">
            <h3 class="title"><a href="${href}">${escapeHtml(category.name)} <span>(${Number(category.job_count || 0)})</span></a></h3>
          </div>
          <a class="overlay-link" href="${href}"></a>
        </div>
      </div>
    `;
  }

  async function loadHomeCategories() {
    const list = document.querySelector("[data-home-categories]");
    const categorySelect = document.querySelector("[data-home-category-select]");
    if (!list && !categorySelect) return;

    if (list) list.innerHTML = skeletonCategoryCards();

    try {
      const categories = await window.CareerRecruitApi.listCategories({ status: "active", limit: 100 });
      if (list) {
        list.innerHTML = categories.length
          ? categories.map(renderHomeCategory).join("")
          : `<div class="col-12"><p class="job-list-status">No categories found.</p></div>`;
      }

      if (categorySelect) {
        categorySelect.innerHTML = `<option value="">Category</option>${categories.map((category) => (
          `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`
        )).join("")}`;
      }
    } catch (error) {
      if (list) {
        list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load categories.</p></div>`;
      }
      toast(error.response?.data?.error || "Unable to load categories.", "error");
    }
  }

  function renderHomeJobCard(job) {
    const workTypeColor = String(job.job_type || "").toLowerCase().includes("remote")
      ? "#0054ff"
      : String(job.job_type || "").toLowerCase().includes("part")
        ? "#ff7e00"
        : "#03a84e";

    return `
      <div class="col-md-6 col-lg-4">
        <div class="recent-job-item db-job-card">
          <div class="company-info">
            <div class="logo">
              <a href="${jobDetailsHref(job)}"><img src="${companyLogo(job)}" width="75" height="75" alt="${escapeHtml(job.company_name)} logo"></a>
            </div>
            <div class="content">
              <h4 class="name"><a href="${jobDetailsHref(job)}">${escapeHtml(job.company_name)}</a></h4>
              <p class="address">${escapeHtml(job.location)}</p>
            </div>
          </div>
          <div class="main-content">
            <h3 class="title"><a href="${jobDetailsHref(job)}">${escapeHtml(job.title)}</a></h3>
            <h5 class="work-type" data-text-color="${workTypeColor}">${escapeHtml(job.job_type || "Full-time")}</h5>
            <p class="desc">${escapeHtml(truncateText(job.description || job.category))}</p>
            <p class="job-card-meta">${escapeHtml(job.category || "")}${job.experience ? ` · ${escapeHtml(job.experience)}` : ""}</p>
          </div>
          <div class="recent-job-info">
            <div class="salary">
              <h4>${escapeHtml(job.salary || "Negotiable")}</h4>
            </div>
            <a class="btn-theme btn-sm" href="${jobDetailsHref(job)}">Apply Now</a>
          </div>
        </div>
      </div>
    `;
  }

  async function loadHomeJobs() {
    const list = document.querySelector("[data-home-jobs]");
    if (!list) return;

    list.innerHTML = skeletonJobCards(6);

    try {
      const jobs = await window.CareerRecruitApi.listJobs({ status: "active", limit: 9, offset: 0 });
      list.innerHTML = jobs.length
        ? jobs.map(renderHomeJobCard).join("")
        : `<div class="col-12"><p class="job-list-status">No jobs found.</p></div>`;
    } catch (error) {
      list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load jobs.</p></div>`;
      toast(error.response?.data?.error || "Unable to load jobs.", "error");
    }
  }

  function bindHomeSearchForm() {
    const form = document.querySelector("[data-home-search-form]");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      const data = new FormData(form);
      ["search", "location", "category"].forEach((key) => {
        const value = String(data.get(key) || "").trim();
        if (value) params.set(key, value);
      });
      window.location.href = params.toString() ? `job.html?${params.toString()}` : "job.html";
    });
  }

  function candidatePhoto(candidate) {
    return candidate.photo_url || `assets/img/team/${((Number(candidate.id || 1) - 1) % 8) + 1}.jpg`;
  }

  function candidateName(candidate) {
    return `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim();
  }

  function candidateHref(candidate) {
    return `candidate-details.html?id=${encodeURIComponent(candidate.id)}`;
  }

  function ratingStars() {
    return Array.from({ length: 5 }, () => `<i class="icofont-star"></i>`).join("");
  }

  function ratingIcons(rating = 5) {
    const count = Math.max(1, Math.min(Number.parseInt(rating, 10) || 5, 5));
    return Array.from({ length: count }, () => `<i class="icofont-star"></i>`).join("");
  }

  function renderCandidateCard(candidate) {
    const href = candidateHref(candidate);
    return `
      <div class="col-sm-6 col-md-6 col-lg-4 col-xl-3">
        <div class="team-item db-candidate-card">
          <div class="thumb">
            <a href="${href}">
              <img src="${candidatePhoto(candidate)}" width="160" height="160" alt="${escapeHtml(candidateName(candidate))}">
            </a>
          </div>
          <div class="content">
            <h4 class="title"><a href="${href}">${escapeHtml(candidateName(candidate))}</a></h4>
            <h5 class="sub-title">${escapeHtml(candidate.title || "Candidate")}</h5>
            <div class="rating-box">${ratingStars()}</div>
            <p class="desc">${escapeHtml(truncateText(candidate.skills || candidate.bio || "", 70))}</p>
            <a class="btn-theme btn-white btn-sm" href="${href}">View Profile</a>
          </div>
          <div class="bookmark-icon"><img src="assets/img/icons/bookmark1.png" alt="Career Recruit image"></div>
          <div class="bookmark-icon-hover"><img src="assets/img/icons/bookmark2.png" alt="Career Recruit image"></div>
        </div>
      </div>
    `;
  }

  function candidatePageHref(page) {
    const params = new URLSearchParams();
    params.set("page", page);
    return `candidate.html?${params.toString()}`;
  }

  function renderCandidatePagination(page, hasNext) {
    const pagination = document.querySelector("[data-candidate-pagination]");
    if (!pagination) return;
    const items = [];
    if (page > 1) {
      items.push(`<li><a class="page-number prev" href="${candidatePageHref(page - 1)}"><i class="icofont-long-arrow-left"></i></a></li>`);
    }
    if (page > 2) {
      items.push(`<li><a class="page-number" href="${candidatePageHref(page - 2)}">${page - 2}</a></li>`);
    }
    if (page > 1) {
      items.push(`<li><a class="page-number" href="${candidatePageHref(page - 1)}">${page - 1}</a></li>`);
    }
    items.push(`<li><a class="page-number active" href="${candidatePageHref(page)}">${page}</a></li>`);
    if (hasNext) {
      items.push(`<li><a class="page-number" href="${candidatePageHref(page + 1)}">${page + 1}</a></li>`);
      items.push(`<li><a class="page-number next" href="${candidatePageHref(page + 1)}"><i class="icofont-long-arrow-right"></i></a></li>`);
    }
    pagination.innerHTML = items.join("");
  }

  async function loadCandidateListPage() {
    const list = document.querySelector("[data-candidate-list]");
    if (!list || !window.location.pathname.endsWith("candidate.html")) return;
    const page = Math.max(Number.parseInt(getQueryParam("page") || "1", 10), 1);
    const perPage = 8;
    list.innerHTML = skeletonCandidateCards(perPage);
    try {
      const rows = await window.CareerRecruitApi.listCandidates({ limit: perPage + 1, offset: (page - 1) * perPage });
      const candidates = rows.slice(0, perPage);
      list.innerHTML = candidates.length
        ? candidates.map(renderCandidateCard).join("")
        : `<div class="col-12"><p class="job-list-status">No candidates found.</p></div>`;
      renderCandidatePagination(page, rows.length > perPage);
    } catch (error) {
      list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load candidates.</p></div>`;
      toast(error.response?.data?.error || "Unable to load candidates.", "error");
    }
  }

  async function loadHomeCandidates() {
    const list = document.querySelector("[data-home-candidates]");
    if (!list) return;
    list.innerHTML = skeletonCandidateCards(4);
    try {
      const candidates = await window.CareerRecruitApi.listCandidates({ limit: 4, offset: 0 });
      list.innerHTML = candidates.length
        ? candidates.map(renderCandidateCard).join("")
        : `<div class="col-12"><p class="job-list-status">No candidates found.</p></div>`;
    } catch (error) {
      list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load candidates.</p></div>`;
      toast(error.response?.data?.error || "Unable to load candidates.", "error");
    }
  }

  function testimonialPhoto(testimonial) {
    return testimonial.photo_url || `assets/img/testimonial/${((Number(testimonial.id || 1) - 1) % 5) + 1}.jpg`;
  }

  function renderTestimonialSlide(testimonial) {
    return `
      <div class="swiper-slide">
        <div class="testimonial-item">
          <div class="testi-inner-content">
            <div class="testi-author">
              <div class="testi-thumb">
                <img src="${escapeHtml(testimonialPhoto(testimonial))}" width="75" height="75" alt="${escapeHtml(testimonial.client_name)}">
              </div>
              <div class="testi-info">
                <h4 class="name">${escapeHtml(testimonial.client_name)}</h4>
                <span class="designation">${escapeHtml(testimonial.designation || testimonial.company || "Client")}</span>
              </div>
            </div>
            <div class="testi-content">
              <p class="desc">${escapeHtml(testimonial.message)}</p>
              <div class="rating-box">${ratingIcons(testimonial.rating)}</div>
              <div class="testi-quote"><img src="assets/img/icons/quote1.png" alt="Career Recruit image"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function refreshTestimonialSwiper() {
    const container = document.querySelector(".testi-slider-container");
    if (!container || !window.Swiper) return;

    if (container.swiper) {
      container.swiper.destroy(true, true);
    }

    new Swiper(".testi-slider-container", {
      slidesPerGroup: 1,
      slidesPerView: 3,
      spaceBetween: 30,
      speed: 600,
      pagination: {
        el: ".testi-slider-container .swiper-pagination",
        clickable: true
      },
      breakpoints: {
        1200: { slidesPerView: 3 },
        992: { slidesPerView: 2 },
        768: { slidesPerView: 2 },
        0: { slidesPerView: 1, spaceBetween: 30 }
      }
    });
  }

  async function loadHomeTestimonials() {
    const list = document.querySelector("[data-home-testimonials]");
    if (!list) return;

    list.innerHTML = skeletonTestimonialSlides();

    try {
      const testimonials = await window.CareerRecruitApi.listTestimonials({ status: "active", limit: 8 });
      list.innerHTML = testimonials.length
        ? testimonials.map(renderTestimonialSlide).join("")
        : `<div class="swiper-slide"><p class="job-list-status">No testimonials found.</p></div>`;
      refreshTestimonialSwiper();
    } catch (error) {
      list.innerHTML = `<div class="swiper-slide"><p class="job-list-status is-error">Unable to load testimonials.</p></div>`;
      toast(error.response?.data?.error || "Unable to load testimonials.", "error");
      refreshTestimonialSwiper();
    }
  }

  function blogImage(blog) {
    return blog.image_url || `assets/img/blog/${((Number(blog.id || 1) - 1) % 12) + 1}.jpg`;
  }

  function blogHeroImage(blog) {
    return blog.hero_image_url || blogImage(blog);
  }

  function blogHref(blog) {
    return `blog-details.html?id=${encodeURIComponent(blog.slug || blog.id)}`;
  }

  function renderBlogCard(blog, className = "col-sm-6 col-lg-4 col-xl-6") {
    return `
      <div class="${className}">
        <div class="post-item">
          <div class="thumb">
            <a href="${blogHref(blog)}"><img src="${escapeHtml(blogImage(blog))}" alt="${escapeHtml(blog.title)}" width="370" height="270"></a>
          </div>
          <div class="content">
            <div class="author">By <a href="blog.html">${escapeHtml(blog.author || "Career Recruit Editorial")}</a></div>
            <h4 class="title"><a href="${blogHref(blog)}">${escapeHtml(blog.title)}</a></h4>
            <p>${escapeHtml(truncateText(blog.excerpt || blog.content, 130))}</p>
            <div class="meta">
              <span class="post-date">${escapeHtml(formatDate(blog.published_at || blog.created_at))}</span>
              <span class="dots"></span>
              <span class="post-time">${escapeHtml(blog.read_time || "6 min read")}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function blogPageHref(page, filters = {}) {
    const params = new URLSearchParams();
    params.set("page", page);
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    return `blog.html?${params.toString()}`;
  }

  function renderBlogPagination(page, hasNext, filters) {
    const items = [];
    if (page > 1) {
      items.push(`<li><a class="page-number prev" href="${blogPageHref(page - 1, filters)}"><i class="icofont-long-arrow-left"></i></a></li>`);
    }
    if (page > 2) {
      items.push(`<li><a class="page-number" href="${blogPageHref(page - 2, filters)}">${page - 2}</a></li>`);
    }
    if (page > 1) {
      items.push(`<li><a class="page-number" href="${blogPageHref(page - 1, filters)}">${page - 1}</a></li>`);
    }
    items.push(`<li><a class="page-number active" href="${blogPageHref(page, filters)}">${page}</a></li>`);
    if (hasNext) {
      items.push(`<li><a class="page-number" href="${blogPageHref(page + 1, filters)}">${page + 1}</a></li>`);
      items.push(`<li><a class="page-number next" href="${blogPageHref(page + 1, filters)}"><i class="icofont-long-arrow-right"></i></a></li>`);
    }

    return `
      <div class="col-12 text-left">
        <div class="pagination-area">
          <nav><ul class="page-numbers d-inline-flex">${items.join("")}</ul></nav>
        </div>
      </div>
    `;
  }

  async function loadBlogListPage() {
    const list = document.querySelector("[data-blog-list]");
    if (!list || !window.location.pathname.endsWith("blog.html")) return;

    const page = Math.max(Number.parseInt(getQueryParam("page") || "1", 10), 1);
    const filters = {
      search: getQueryParam("search") || "",
      category: getQueryParam("category") || ""
    };
    const perPage = 8;
    list.innerHTML = skeletonBlogCards(perPage);

    try {
      const rows = await window.CareerRecruitApi.listBlogs({
        status: "published",
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        limit: perPage + 1,
        offset: (page - 1) * perPage
      });
      const blogs = rows.slice(0, perPage);
      list.innerHTML = blogs.length
        ? `${blogs.map((blog) => renderBlogCard(blog)).join("")}${renderBlogPagination(page, rows.length > perPage, filters)}`
        : `<div class="col-12"><p class="job-list-status">No blog posts found.</p></div>`;
    } catch (error) {
      list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load blog posts.</p></div>`;
      toast(error.response?.data?.error || "Unable to load blog posts.", "error");
    }
  }

  async function loadBlogSidebar() {
    const categoryList = document.querySelector("[data-blog-categories]");
    const recentList = document.querySelector("[data-blog-recent]");
    const tagList = document.querySelector("[data-blog-tags]");
    if (!categoryList && !recentList && !tagList) return;

    try {
      if (categoryList) {
        const categories = await window.CareerRecruitApi.listBlogCategories();
        categoryList.innerHTML = categories.map((category) => (
          `<li><a href="blog.html?category=${encodeURIComponent(category.category)}">${escapeHtml(category.category)}<span>(${Number(category.post_count || 0)})</span></a></li>`
        )).join("");
      }

      const recent = await window.CareerRecruitApi.listBlogs({ status: "published", limit: 4 });
      if (recentList) {
        recentList.innerHTML = recent.map((blog) => `
          <div class="widget-blog-post">
            <div class="thumb">
              <a href="${blogHref(blog)}"><img src="${escapeHtml(blogImage(blog))}" alt="${escapeHtml(blog.title)}" width="71" height="70"></a>
            </div>
            <div class="content">
              <h4><a href="${blogHref(blog)}">${escapeHtml(truncateText(blog.title, 54))}</a></h4>
              <div class="meta">
                <span class="post-date"><i class="icofont-ui-calendar"></i> ${escapeHtml(formatDate(blog.published_at))}</span>
              </div>
            </div>
          </div>
        `).join("");
      }

      if (tagList) {
        const tags = Array.from(new Set(recent.flatMap((blog) => splitList(blog.tags)))).slice(0, 10);
        tagList.innerHTML = tags.map((tag) => `<li><a href="blog.html?search=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a></li>`).join("");
      }
    } catch (error) {
      toast(error.response?.data?.error || "Unable to load blog sidebar.", "error");
    }
  }

  function bindBlogSearchForm() {
    const form = document.querySelector("[data-blog-search-form]");
    if (!form) return;
    if (form.elements.search) form.elements.search.value = getQueryParam("search") || "";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const search = String(new FormData(form).get("search") || "").trim();
      window.location.href = search ? `blog.html?search=${encodeURIComponent(search)}` : "blog.html";
    });
  }

  async function loadHomeBlogs() {
    const list = document.querySelector("[data-home-blogs]");
    if (!list) return;
    list.innerHTML = skeletonBlogCards(3);

    try {
      const blogs = await window.CareerRecruitApi.listBlogs({ status: "published", limit: 4 });
      if (!blogs.length) {
        list.innerHTML = `<div class="col-12"><p class="job-list-status">No blog posts found.</p></div>`;
        return;
      }

      const [featured, imageOnly, ...sidePosts] = blogs;
      list.innerHTML = `
        ${featured ? renderBlogCard(featured, "col-md-6 col-lg-4") : ""}
        ${imageOnly ? `
          <div class="col-md-6 col-lg-4">
            <div class="post-item">
              <div class="thumb mb--0">
                <a href="${blogHref(imageOnly)}"><img src="${escapeHtml(blogImage(imageOnly))}" alt="${escapeHtml(imageOnly.title)}" width="370" height="440"></a>
              </div>
            </div>
          </div>
        ` : ""}
        <div class="col-lg-4">
          <div class="post-home-list-style">
            ${sidePosts.map((blog) => `
              <div class="post-item">
                <div class="content">
                  <div class="author">By <a href="blog.html">${escapeHtml(blog.author || "Career Recruit Editorial")}</a></div>
                  <h4 class="title"><a href="${blogHref(blog)}">${escapeHtml(blog.title)}</a></h4>
                  <div class="meta">
                    <span class="post-date">${escapeHtml(formatDate(blog.published_at))}</span>
                    <span class="dots"></span>
                    <span class="post-time">${escapeHtml(blog.read_time || "6 min read")}</span>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    } catch (error) {
      list.innerHTML = `<div class="col-12"><p class="job-list-status is-error">Unable to load blog posts.</p></div>`;
      toast(error.response?.data?.error || "Unable to load blog posts.", "error");
    }
  }

  function renderBlogComments(comments) {
    return `
      <div class="comment-view-area">
        <h2 class="main-title">Comments (${comments.length.toString().padStart(2, "0")})</h2>
        <div class="comment-content">
          ${comments.length ? comments.map((comment, index) => `
            <div class="single-comment${index ? " comment-reply" : ""}${index === comments.length - 1 ? " mb--0" : ""}">
              <div class="author-info">
                <div class="thumb">
                  <img src="assets/img/blog/a${(index % 3) + 1}.png" alt="${escapeHtml(comment.name)}" width="72" height="72">
                </div>
                <div class="author-details">
                  <h4 class="title">${escapeHtml(comment.name)}</h4>
                  <ul>
                    <li>${escapeHtml(comment.role_location || "Reader")} || <span>${escapeHtml(formatDate(comment.created_at))}</span></li>
                  </ul>
                </div>
              </div>
              <p class="desc">${escapeHtml(comment.message)}</p>
            </div>
          `).join("") : `<p class="job-list-status">No comments yet.</p>`}
        </div>
      </div>
    `;
  }

  function renderBlogDetailsPage(blog, related, comments) {
    const section = document.querySelector("[data-blog-details]");
    if (!section) return;
    const tags = splitList(blog.tags);

    section.innerHTML = `
      <div class="post-details-item">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-12">
              <div class="post-details-info text-center">
                <div class="meta">
                  <span class="author">By <a href="blog.html">${escapeHtml(blog.author || "Career Recruit Editorial")}</a></span>
                  <span class="dots"></span>
                  <span class="post-date">${escapeHtml(formatDate(blog.published_at || blog.created_at))}</span>
                  <span class="dots"></span>
                  <span class="post-time">${escapeHtml(blog.read_time || "6 min read")}</span>
                </div>
                <h4 class="title">${escapeHtml(blog.title)}</h4>
                <div class="widget-tags">
                  <ul>
                    ${tags.map((tag, index) => `<li><a${index === 0 ? " class=\"active\"" : ""} href="blog.html?search=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a></li>`).join("")}
                  </ul>
                </div>
              </div>
              <div class="post-details-thumb">
                <img class="w-100" src="${escapeHtml(blogHeroImage(blog))}" alt="${escapeHtml(blog.title)}" width="1170" height="550">
              </div>
            </div>
            <div class="col-lg-10">
              <div class="post-details-content">
                <h4 class="desc-title">${escapeHtml(blog.excerpt)}</h4>
                <p>${escapeHtml(blog.content)}</p>
                <div class="post-details-content-list">
                  <h4 class="title">Table of Content:</h4>
                  <ul class="list-style">
                    <li><a href="job.html"><i class="icofont-double-right"></i>Browse active job listings by category</a></li>
                    <li><a href="candidate.html"><i class="icofont-double-right"></i>Review candidate profiles and skills</a></li>
                    <li><a href="registration.html"><i class="icofont-double-right"></i>Create an employer or candidate account</a></li>
                  </ul>
                </div>
                <h4 class="desc-title2">Career Recruit practical note</h4>
                <p>Use this advice together with current listings, candidate profiles, and employer verification. A strong hiring flow is clear for candidates, controlled by admins, and easy for employers to trust.</p>
                <blockquote class="blockquote-item">
                  <div class="content">
                    <p>Better job information creates better applications and faster hiring decisions.</p>
                  </div>
                </blockquote>
                <div class="post-details-footer">
                  <div class="widget-social-icons">
                    <span>Share this article:</span>
                    <div class="social-icons">
                      <a href="https://www.facebook.com/" target="_blank" rel="noopener"><i class="icofont-facebook"></i></a>
                      <a href="https://twitter.com/" target="_blank" rel="noopener"><i class="icofont-twitter"></i></a>
                      <a href="https://www.linkedin.com/signup" target="_blank" rel="noopener"><i class="icofont-linkedin"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="related-posts-area related-post-area bg-color-gray">
        <div class="container">
          <div class="row">
            <div class="col-12">
              <div class="post-title-wrap">
                <h4 class="title">You may also like</h4>
              </div>
            </div>
          </div>
          <div class="row">
            ${related.map((item) => renderBlogCard(item, "col-md-6 col-lg-4")).join("")}
          </div>
        </div>
      </div>
      <div class="comment-area">
        <div class="container pt--0 pb--0">
          <div class="row justify-content-center">
            <div class="col-lg-10">
              ${renderBlogComments(comments)}
              <div class="comment-form-wrap">
                <h2 class="main-title">Leave a Comment</h2>
                <form class="comment-form" action="#" data-blog-comment-form>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="form-group">
                        <input class="form-control" type="text" name="name" placeholder="Name" required>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-group">
                        <input class="form-control" type="email" name="email" placeholder="Email" required>
                      </div>
                    </div>
                    <div class="col-md-12">
                      <div class="form-group">
                        <input class="form-control" type="text" name="role_location" placeholder="Role and location">
                      </div>
                    </div>
                    <div class="col-md-12">
                      <div class="form-group">
                        <textarea class="form-control" name="message" placeholder="Message" required></textarea>
                      </div>
                    </div>
                    <div class="col-md-12">
                      <div class="form-group text-center mb--0">
                        <button class="btn btn-theme" type="submit">Submit Now <i class="icofont-long-arrow-right"></i></button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadBlogDetailsPage() {
    const section = document.querySelector("[data-blog-details]");
    if (!section || !window.location.pathname.endsWith("blog-details.html")) return;

    const id = getQueryParam("id");
    section.innerHTML = `<div class="container"><div class="row"><div class="col-12">${skeletonBlogCards(2)}</div></div></div>`;

    try {
      let blog;
      if (id) {
        blog = await window.CareerRecruitApi.getBlog(id);
      } else {
        const blogs = await window.CareerRecruitApi.listBlogs({ status: "published", limit: 1 });
        blog = blogs[0];
      }

      if (!blog) {
        section.innerHTML = `<div class="container"><p class="job-list-status">Blog post not found.</p></div>`;
        return;
      }

      const [comments, relatedRows] = await Promise.all([
        window.CareerRecruitApi.listBlogComments(blog.slug || blog.id, { limit: 20 }),
        window.CareerRecruitApi.listBlogs({ status: "published", category: blog.category, limit: 4 })
      ]);
      const related = relatedRows.filter((item) => item.id !== blog.id).slice(0, 3);
      renderBlogDetailsPage(blog, related, comments);
      bindBlogCommentForm(blog);
    } catch (error) {
      section.innerHTML = `<div class="container"><p class="job-list-status is-error">Unable to load blog details.</p></div>`;
      toast(error.response?.data?.error || "Unable to load blog details.", "error");
    }
  }

  function bindBlogCommentForm(blog) {
    const form = document.querySelector("[data-blog-comment-form]");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formPayload(form);

      try {
        setLoading(form, true, "Submitting...");
        await window.CareerRecruitApi.createBlogComment(blog.slug || blog.id, payload);
        toast("Comment submitted.", "success");
        form.reset();
        loadBlogDetailsPage();
      } catch (error) {
        toast(error.response?.data?.error || "Unable to submit comment.", "error");
      } finally {
        setLoading(form, false);
      }
    });
  }

  function detailItems(value) {
    return splitList(value).map((item) => `<li><i class="icofont-check"></i> ${escapeHtml(item)}</li>`).join("");
  }

  function timelineItems(value) {
    return String(value || "").split("|").map((entry) => {
      const [title, years, place, description] = entry.split("//").map((part) => (part || "").trim());
      if (!title) return "";
      return `
        <div class="content-item">
          <h4 class="title">${escapeHtml(title)} ${years ? `<span>//</span> <span>${escapeHtml(years)}</span>` : ""}</h4>
          ${place ? `<h5 class="sub-title">${escapeHtml(place)}</h5>` : ""}
          ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ""}
        </div>
      `;
    }).join("");
  }

  function candidateInfoRow(name, value) {
    return `
      <tr>
        <td class="table-name">${escapeHtml(name)}</td>
        <td class="dotted">:</td>
        <td>${escapeHtml(value || "Not set")}</td>
      </tr>
    `;
  }

  function renderCandidateDetails(candidate) {
    const container = document.querySelector(".team-details-area .container");
    if (!container) return;
    const name = candidateName(candidate);
    container.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="team-details-wrap">
            <div class="team-details-info">
              <div class="thumb">
                <img src="${candidatePhoto(candidate)}" width="130" height="130" alt="${escapeHtml(name)}">
              </div>
              <div class="content">
                <h4 class="title">${escapeHtml(name)}</h4>
                <h5 class="sub-title">${escapeHtml(candidate.title || "Candidate")}</h5>
                <ul class="info-list">
                  <li><i class="icofont-location-pin"></i> ${escapeHtml(candidate.location || "Remote")}</li>
                  <li><i class="icofont-phone"></i> ${escapeHtml(candidate.phone || "Available on request")}</li>
                </ul>
              </div>
            </div>
            <div class="team-details-btn">
              <button type="button" class="btn-theme btn-light">Short List</button>
              <a href="${escapeHtml(candidate.resume_url || "#")}" class="btn-theme">Download Resume</a>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-7 col-xl-8">
          <div class="team-details-item">
            <div class="content">
              <h4 class="title">About Candidate</h4>
              <p class="desc">${escapeHtml(candidate.bio || "No candidate bio provided.")}</p>
            </div>
            <div class="candidate-details-wrap">
              <h4 class="content-title">Education</h4>
              <div class="candidate-details-content">${timelineItems(candidate.education)}</div>
            </div>
            <div class="candidate-details-wrap">
              <h4 class="content-title">Work & Experience</h4>
              <div class="candidate-details-content">${timelineItems(candidate.work_experience)}</div>
            </div>
            <div class="content-list-wrap">
              <div class="content mb--0">
                <h4 class="title">Professional Skills</h4>
                <ul class="team-details-list mb--0">${detailItems(candidate.professional_skills || candidate.skills)}</ul>
              </div>
              <div class="content mb--0">
                <h4 class="title">Software Skills</h4>
                <ul class="team-details-list mb--0">${detailItems(candidate.software_skills)}</ul>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-5 col-xl-4">
          <div class="team-sidebar">
            <div class="widget-item">
              <div class="widget-title"><h3 class="title">Information</h3></div>
              <div class="summery-info">
                <table class="table">
                  <tbody>
                    ${candidateInfoRow("Category", candidate.category)}
                    ${candidateInfoRow("Offered Salary", candidate.offered_salary)}
                    ${candidateInfoRow("Experience", candidate.experience)}
                    ${candidateInfoRow("Language", candidate.language)}
                    ${candidateInfoRow("Age", candidate.age)}
                    ${candidateInfoRow("Gender", candidate.gender)}
                    ${candidateInfoRow("Qualification", candidate.qualification)}
                    ${candidateInfoRow("Level", candidate.level)}
                    ${candidateInfoRow("Views", Number(candidate.views || 0).toLocaleString())}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadCandidateDetailsPage() {
    if (!window.location.pathname.endsWith("candidate-details.html")) return;
    const container = document.querySelector(".team-details-area .container");
    if (!container) return;
    const id = getQueryParam("id");
    container.innerHTML = skeletonJobDetails();
    try {
      let candidate;
      if (id) {
        candidate = await window.CareerRecruitApi.getCandidate(id);
      } else {
        const candidates = await window.CareerRecruitApi.listCandidates({ limit: 1, offset: 0 });
        candidate = candidates[0];
      }
      if (!candidate) {
        container.innerHTML = `<div class="row"><div class="col-12"><p class="job-list-status">Candidate not found.</p></div></div>`;
        return;
      }
      renderCandidateDetails(candidate);
    } catch (error) {
      container.innerHTML = `<div class="row"><div class="col-12"><p class="job-list-status is-error">Unable to load candidate details.</p></div></div>`;
      toast(error.response?.data?.error || "Unable to load candidate details.", "error");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAuthHeader();
    renderAsideAuth();
    loadEmployerPaymentSettings();
    bindRegistrationForms();
    bindEmployerPaymentModal();
    bindLoginForm();
    loadAdminPage();
    bindAdminPaymentForm();
    loadAdminCategories();
    bindAdminCategoryForm();
    loadAdminJobs();
    bindAdminJobForm();
    loadAdminCandidates();
    bindAdminCandidateForm();
    loadAdminTestimonials();
    bindAdminTestimonialForm();
    loadAdminBlogComments();
    bindAdminSubnavToggle();
    loadPublicJobs();
    bindJobSearchForm();
    loadPublicJobDetails();
    loadHomeCategories();
    loadHomeJobs();
    bindHomeSearchForm();
    loadHomeCandidates();
    loadHomeTestimonials();
    loadHomeBlogs();
    loadBlogListPage();
    loadBlogSidebar();
    bindBlogSearchForm();
    loadBlogDetailsPage();
    loadCandidateListPage();
    loadCandidateDetailsPage();
  });
})();
