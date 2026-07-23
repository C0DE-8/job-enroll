(function () {
  const baseURL = "https://job-enroll.vercel.app/api";
  const client = window.axios ? axios.create({ baseURL }) : null;

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
        const dashboardHref = user.role === "admin"
          ? (window.location.pathname.includes("/admin/") ? "./" : "admin/")
          : "job.html";
        wrap.innerHTML = `
          <span class="auth-pill">${user.role}: ${user.email}</span>
          <a class="auth-link" href="${dashboardHref}">${user.role === "admin" ? "Dashboard" : "Jobs"}</a>
          <button class="auth-logout" type="button">Logout</button>
        `;
        wrap.querySelector("button").addEventListener("click", logout);
        const registrationButton = area.querySelector(".btn-registration");
        if (registrationButton) registrationButton.style.display = "none";
      } else {
        const registrationButton = area.querySelector(".btn-registration");
        if (registrationButton) registrationButton.style.display = "";
        const loginHref = window.location.pathname.includes("/admin/") ? "../login.html" : "login.html";
        wrap.innerHTML = `<a class="auth-link" href="${loginHref}">Login</a>`;
      }

      area.insertBefore(wrap, area.firstChild);
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

  window.CareerRecruitApi = {
    client,
    getStoredUser,
    logout,
    renderAuthHeader,
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
    }
  };

  async function loadEmployerPaymentSettings() {
    const fee = document.querySelector("[data-employer-fee]");
    const walletName = document.querySelector("[data-wallet-name]");
    const walletAddress = document.querySelector("[data-wallet-address]");
    const feeInput = document.querySelector("[name='employer_fee_amount']");

    if (!fee && !walletName && !walletAddress) return;

    try {
      const settings = await window.CareerRecruitApi.getPaymentSettings();
      if (fee) fee.textContent = `${settings.registration_fee} ${settings.fee_currency}`;
      if (walletName) walletName.textContent = settings.wallet_name;
      if (walletAddress) walletAddress.textContent = settings.wallet_address;
      if (feeInput) feeInput.value = settings.registration_fee;
    } catch (error) {
      setStatus(document.querySelector("[data-register-status]"), "Unable to load employer payment settings.", true);
    }
  }

  function bindRegistrationForms() {
    document.querySelectorAll("[data-register-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const status = form.querySelector("[data-register-status]") || document.querySelector("[data-register-status]");
        const formData = new FormData(form);

        if (formData.get("password") !== formData.get("confirm_password")) {
          setStatus(status, "Passwords do not match.", true);
          return;
        }

        try {
          setLoading(form, true, "Creating account...");
          const user = await window.CareerRecruitApi.register(Object.fromEntries(formData.entries()));
          const message = user.role === "employer"
            ? "Employer account submitted. Admin verification is required after payment."
            : "Candidate account created. You can now log in.";
          setStatus(status, message, false);
          form.reset();
          loadEmployerPaymentSettings();
        } catch (error) {
          setStatus(status, error.response?.data?.error || "Registration failed.", true);
        } finally {
          setLoading(form, false);
        }
      });
    });
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
        setStatus(status, `Signed in as ${result.user.role}.`, false);
        if (result.user.role === "admin") {
          window.location.href = "admin/";
        }
      } catch (error) {
        setStatus(status, error.response?.data?.error || "Login failed.", true);
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
      setStatus(document.querySelector("[data-admin-status]"), "Admin login required.", true);
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
      setStatus(document.querySelector("[data-admin-status]"), error.response?.data?.error || "Unable to load admin data.", true);
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
        loadAdminPage();
      } catch (error) {
        setStatus(status, error.response?.data?.error || "Unable to save settings.", true);
      } finally {
        setLoading(form, false);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAuthHeader();
    loadEmployerPaymentSettings();
    bindRegistrationForms();
    bindLoginForm();
    loadAdminPage();
    bindAdminPaymentForm();
  });
})();
