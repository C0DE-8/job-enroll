(function () {
  const baseURL = window.CAREER_RECRUIT_API_URL || "http://localhost:5000/api";
  const client = axios.create({ baseURL });

  function setStatus(element, message, isError) {
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#d93025" : "#038f42";
  }

  function authHeaders() {
    const token = localStorage.getItem("careerRecruitToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  window.CareerRecruitApi = {
    client,
    getPaymentSettings() {
      return client.get("/settings/payment").then((response) => response.data.data);
    },
    register(payload) {
      return client.post("/auth/register", payload).then((response) => response.data.data);
    },
    login(payload) {
      return client.post("/auth/login", payload).then((response) => response.data.data);
    },
    updatePaymentSettings(payload) {
      return client.put("/admin/payment-settings", payload, { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    listPendingEmployers() {
      return client.get("/admin/employers/pending", { headers: authHeaders() })
        .then((response) => response.data.data);
    },
    verifyEmployer(id) {
      return client.put(`/admin/employers/${id}/verify`, {}, { headers: authHeaders() })
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
          const user = await window.CareerRecruitApi.register(Object.fromEntries(formData.entries()));
          const message = user.role === "employer"
            ? "Employer account submitted. Admin verification is required after payment."
            : "Candidate account created. You can now log in.";
          setStatus(status, message, false);
          form.reset();
          loadEmployerPaymentSettings();
        } catch (error) {
          setStatus(status, error.response?.data?.error || "Registration failed.", true);
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
        const result = await window.CareerRecruitApi.login(Object.fromEntries(formData.entries()));
        localStorage.setItem("careerRecruitToken", result.token);
        localStorage.setItem("careerRecruitUser", JSON.stringify(result.user));
        setStatus(status, `Signed in as ${result.user.role}.`, false);
        if (result.user.role === "admin") {
          window.location.href = "admin.html";
        }
      } catch (error) {
        setStatus(status, error.response?.data?.error || "Login failed.", true);
      }
    });
  }

  async function loadAdminPage() {
    const form = document.querySelector("[data-admin-payment-form]");
    const list = document.querySelector("[data-pending-employers]");

    if (!form && !list) return;

    const user = JSON.parse(localStorage.getItem("careerRecruitUser") || "null");
    if (!user || user.role !== "admin") {
      setStatus(document.querySelector("[data-admin-status]"), "Admin login required.", true);
      return;
    }

    try {
      const settings = await window.CareerRecruitApi.getPaymentSettings();
      if (form) {
        form.registration_fee.value = settings.registration_fee;
        form.fee_currency.value = settings.fee_currency;
        form.wallet_name.value = settings.wallet_name;
        form.wallet_address.value = settings.wallet_address;
      }

      if (list) {
        const employers = await window.CareerRecruitApi.listPendingEmployers();
        list.innerHTML = employers.length ? "" : "<p>No pending employers.</p>";
        employers.forEach((employer) => {
          const item = document.createElement("div");
          item.className = "admin-list-item";
          item.innerHTML = `<span>${employer.email}</span><button class="btn-theme btn-sm" type="button">Verify</button>`;
          item.querySelector("button").addEventListener("click", async () => {
            await window.CareerRecruitApi.verifyEmployer(employer.id);
            item.remove();
          });
          list.appendChild(item);
        });
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
        await window.CareerRecruitApi.updatePaymentSettings(Object.fromEntries(new FormData(form).entries()));
        setStatus(status, "Payment settings saved.", false);
      } catch (error) {
        setStatus(status, error.response?.data?.error || "Unable to save settings.", true);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadEmployerPaymentSettings();
    bindRegistrationForms();
    bindLoginForm();
    loadAdminPage();
    bindAdminPaymentForm();
  });
})();
