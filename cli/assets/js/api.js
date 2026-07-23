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
    const list = document.querySelector(".recent-job-inner-area .container > .row:first-of-type");
    if (!list || !window.location.pathname.endsWith("job.html")) return;

    const page = Math.max(Number.parseInt(getQueryParam("page") || "1", 10), 1);
    const filters = {
      category: getQueryParam("category"),
      search: getQueryParam("search"),
      location: getQueryParam("location")
    };
    const perPage = 9;
    list.innerHTML = `<div class="col-12"><p class="job-list-status">Loading jobs...</p></div>`;

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
    container.innerHTML = `<div class="row"><div class="col-12"><p class="job-list-status">Loading job details...</p></div></div>`;

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

    list.innerHTML = `<div class="col-12"><p class="job-list-status">Loading recent jobs...</p></div>`;

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
    loadPublicJobs();
    loadPublicJobDetails();
    loadHomeCategories();
    loadHomeJobs();
    bindHomeSearchForm();
  });
})();
