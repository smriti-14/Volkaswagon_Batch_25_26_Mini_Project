const domCache = {
  loginScreen: null,
  mainApp: null,
  bookingList: null,
  editId: null,
  modelSelect: null,
  modelOther: null,
  regNum: null,
  datePick: null,
  timePick: null,
  notes: null,
  submitBtn: null,
  cancelEdit: null,
  otherInputContainer: null,
  hamburger: null,
  navMenu: null,
  sections: null,
  navButtons: null,
  catBtns: null,
  servicePanels: null,
  loginForm: null,
  registerForm: null,
  authTabs: null,
  authPanels: null,
  authError: null,
  loginIdentifier: null,
  loginPassword: null,
  registerUsername: null,
  registerEmail: null,
  registerPassword: null,
  registerConfirm: null,
  logoutButton: null,
  mainForm: null,
  userName: null,
  userEmail: null,
  userMode: null,

  init() {
    this.loginScreen = document.getElementById("login-screen");
    this.mainApp = document.getElementById("main-app");
    this.bookingList = document.getElementById("booking-list");
    this.editId = document.getElementById("edit-id");
    this.modelSelect = document.getElementById("model-select");
    this.modelOther = document.getElementById("model-other");
    this.regNum = document.getElementById("reg-num");
    this.datePick = document.getElementById("date-pick");
    this.timePick = document.getElementById("time-pick");
    this.notes = document.getElementById("notes");
    this.submitBtn = document.getElementById("submit-btn");
    this.cancelEdit = document.getElementById("cancel-edit");
    this.otherInputContainer = document.getElementById("other-input-container");
    this.hamburger = document.querySelector(".hamburger");
    this.navMenu = document.querySelector(".nav-menu");
    this.sections = document.querySelectorAll(".section");
    this.navButtons = document.querySelectorAll("[data-view]");
    this.catBtns = document.querySelectorAll(".cat-btn");
    this.servicePanels = document.querySelectorAll(".service-panel");
    this.loginForm = document.getElementById("login-form");
    this.registerForm = document.getElementById("register-form");
    this.authTabs = document.querySelectorAll("[data-auth-tab]");
    this.authPanels = document.querySelectorAll("[data-auth-panel]");
    this.authError = document.getElementById("auth-error");
    this.loginIdentifier = document.getElementById("login-identifier");
    this.loginPassword = document.getElementById("login-password");
    this.registerUsername = document.getElementById("register-username");
    this.registerEmail = document.getElementById("register-email");
    this.registerPassword = document.getElementById("register-password");
    this.registerConfirm = document.getElementById("register-confirm");
    this.logoutButton = document.getElementById("nav-logout");
    this.mainForm = document.getElementById("mainForm");
    this.userName = document.getElementById("user-name");
    this.userEmail = document.getElementById("user-email");
    this.userMode = document.getElementById("user-mode");
  },
};

const appState = {
  bookings: [],
  bookingMap: new Map(),
  user: null,
};

const DEMO_IDENTIFIER = "demo";
const DEMO_PASSWORD = "demo1234";
const DEMO_MODE_KEY = "vw_demo_mode";
const DEMO_BOOKINGS_KEY = "vw_demo_bookings";

function setAuthError(message) {
  if (!domCache.authError) return;
  domCache.authError.textContent = message || "";
}

function setUserInfo(user) {
  appState.user = user || null;
  if (!domCache.userName || !domCache.userEmail) return;
  domCache.userName.textContent = user?.username || "—";
  domCache.userEmail.textContent = user?.email || "—";
  if (domCache.userMode) {
    const isDemo = isDemoMode();
    domCache.userMode.classList.toggle("is-hidden", !isDemo);
  }
}

function getToken() {
  return sessionStorage.getItem("vw_token");
}

function setToken(token) {
  sessionStorage.setItem("vw_token", token);
}

function clearToken() {
  sessionStorage.removeItem("vw_token");
}

function isDemoMode() {
  return sessionStorage.getItem(DEMO_MODE_KEY) === "true";
}

function enableDemoMode() {
  sessionStorage.setItem(DEMO_MODE_KEY, "true");
  setToken("demo-token");
  setUserInfo({ username: "Demo User", email: "demo@preview.local" });
}

function clearDemoMode() {
  sessionStorage.removeItem(DEMO_MODE_KEY);
}

function isDemoCredentials(identifier, password) {
  return (
    identifier.trim().toLowerCase() === DEMO_IDENTIFIER &&
    password === DEMO_PASSWORD
  );
}

function getDemoBookings() {
  return JSON.parse(localStorage.getItem(DEMO_BOOKINGS_KEY) || "[]");
}

function saveDemoBookings(bookings) {
  localStorage.setItem(DEMO_BOOKINGS_KEY, JSON.stringify(bookings));
}

function createDemoId() {
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (response.status === 401) {
    clearToken();
    showLoginScreen();
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      (Array.isArray(payload?.errors) ? payload.errors.join(" ") : null) ||
      payload?.message ||
      "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload;
}

function tabTo(cat) {
  domCache.catBtns.forEach((button) => button.classList.remove("active"));
  domCache.servicePanels.forEach((panel) => panel.classList.remove("active"));
  const btn = document.getElementById(`btn-${cat}`);
  const panel = document.getElementById(`panel-${cat}`);
  if (btn) btn.classList.add("active");
  if (panel) panel.classList.add("active");
}

function checkOther(val) {
  const isOther = val === "Other";
  domCache.otherInputContainer.classList.toggle("is-hidden", !isOther);
  domCache.modelOther.disabled = !isOther;
  domCache.modelOther.required = isOther;
  if (!isOther) domCache.modelOther.value = "";
}

function toggleMobileMenu() {
  const expanded = domCache.hamburger.getAttribute("aria-expanded") === "true";
  domCache.hamburger.setAttribute("aria-expanded", String(!expanded));
  domCache.hamburger.classList.toggle("active");
  domCache.navMenu.classList.toggle("active");
}

function showLoginScreen() {
  domCache.loginScreen.style.display = "flex";
  domCache.loginScreen.setAttribute("aria-hidden", "false");
  domCache.mainApp.style.display = "none";
  domCache.mainApp.setAttribute("aria-hidden", "true");
  setAuthView("login");
}

function hideLoginScreen() {
  domCache.loginScreen.style.display = "none";
  domCache.loginScreen.setAttribute("aria-hidden", "true");
  domCache.mainApp.style.display = "flex";
  domCache.mainApp.setAttribute("aria-hidden", "false");
}

function setAuthView(view) {
  domCache.authTabs.forEach((tab) => {
    const isActive = tab.dataset.authTab === view;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  domCache.authPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.authPanel !== view);
  });
  setAuthError("");
}

async function handleLogin(event) {
  event.preventDefault();
  const identifier = domCache.loginIdentifier.value.trim();
  const password = domCache.loginPassword.value;
  if (!identifier || !password) {
    setAuthError("Enter your username/email and password.");
    return;
  }

  if (isDemoCredentials(identifier, password)) {
    enableDemoMode();
    setAuthError("");
    domCache.loginPassword.value = "";
    hideLoginScreen();
    setView("garage");
    return;
  }

  try {
    const result = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    setToken(result.token);
    setUserInfo(result.user);
    domCache.loginPassword.value = "";
    setAuthError("");
    hideLoginScreen();
    setView("garage");
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError ||
      /failed to fetch|network/i.test(error.message);
    if (isNetworkError && isDemoCredentials(identifier, password)) {
      enableDemoMode();
      setAuthError("");
      domCache.loginPassword.value = "";
      hideLoginScreen();
      setView("garage");
      return;
    }
    if (isNetworkError) {
      setAuthError("Backend unavailable. Use demo login: demo / demo1234.");
    } else {
      setAuthError(error.message);
    }
    domCache.loginPassword.value = "";
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const username = domCache.registerUsername.value.trim();
  const email = domCache.registerEmail.value.trim();
  const password = domCache.registerPassword.value;
  const confirm = domCache.registerConfirm.value;

  if (!username || !email || !password || !confirm) {
    setAuthError("Complete all registration fields.");
    return;
  }
  if (password !== confirm) {
    setAuthError("Passwords do not match.");
    return;
  }

  try {
    const result = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    setToken(result.token);
    setUserInfo(result.user);
    domCache.registerPassword.value = "";
    domCache.registerConfirm.value = "";
    setAuthError("");
    hideLoginScreen();
    setView("garage");
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError ||
      /failed to fetch|network/i.test(error.message);
    setAuthError(
      isNetworkError
        ? "Registration requires the backend. Use demo login: demo / demo1234."
        : error.message
    );
  }
}

function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) return;
  clearDemoMode();
  clearToken();
  appState.bookings = [];
  appState.bookingMap = new Map();
  setUserInfo(null);
  resetForm();
  showLoginScreen();
}

function setView(view) {
  domCache.sections.forEach((section) => section.classList.remove("active"));
  domCache.navButtons.forEach((button) => button.classList.remove("active"));
  const activeSection = document.getElementById(`${view}-section`);
  const activeNav = document.getElementById(`nav-${view}`);
  if (activeSection) activeSection.classList.add("active");
  if (activeNav) activeNav.classList.add("active");

  if (activeSection) {
    activeSection.setAttribute("aria-hidden", "false");
    domCache.sections.forEach((section) => {
      if (!section.classList.contains("active")) {
        section.setAttribute("aria-hidden", "true");
      }
    });
  }

  if (view === "garage") loadBookings();

  if (domCache.hamburger && domCache.navMenu) {
    domCache.hamburger.classList.remove("active");
    domCache.navMenu.classList.remove("active");
    domCache.hamburger.setAttribute("aria-expanded", "false");
  }

  window.scrollTo(0, 0);

  const mainHeading = activeSection?.querySelector("h1");
  if (mainHeading) mainHeading.focus();
}

function collectFormData() {
  const selectedTasks = Array.from(
    document.querySelectorAll('input[name="task"]:checked')
  ).map((input) => input.value);

  if (selectedTasks.length === 0) {
    return { error: "Technical requirement selection is mandatory." };
  }

  const modelVal = domCache.modelSelect.value;
  const otherModel = domCache.modelOther.value.trim();
  const finalModel = modelVal === "Other" ? otherModel : modelVal;

  if (!finalModel) {
    return { error: "Vehicle model is required." };
  }

  const reg = domCache.regNum.value.trim().toUpperCase();
  if (!reg) {
    return { error: "Registration number is required." };
  }

  const date = domCache.datePick.value;
  const time = domCache.timePick.value;
  if (!date || !time) {
    return { error: "Appointment date and time are required." };
  }

  return {
    data: {
      model: finalModel,
      reg,
      tasks: selectedTasks,
      date,
      time,
      notes: domCache.notes.value.trim(),
    },
  };
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const { data, error } = collectFormData();
  if (error) {
    alert(error);
    return;
  }

  try {
    if (isDemoMode()) {
      const entries = getDemoBookings();
      const entryId = domCache.editId.value || createDemoId();
      const entry = { id: entryId, ...data };
      const idx = entries.findIndex((item) => item.id === entryId);
      if (idx > -1) entries[idx] = entry;
      else entries.push(entry);
      saveDemoBookings(entries);
      resetForm();
      setView("garage");
      return;
    }
    if (domCache.editId.value) {
      await apiFetch(`/api/bookings/${domCache.editId.value}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } else {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
    resetForm();
    setView("garage");
  } catch (error) {
    alert(error.message);
  }
}

async function loadBookings() {
  try {
    if (isDemoMode()) {
      const data = getDemoBookings();
      appState.bookings = Array.isArray(data) ? data : [];
      appState.bookingMap = new Map(
        appState.bookings.map((booking) => [booking.id, booking])
      );
      renderGarage();
      return;
    }
    const data = await apiFetch("/api/bookings");
    appState.bookings = Array.isArray(data) ? data : [];
    appState.bookingMap = new Map(
      appState.bookings.map((booking) => [booking.id, booking])
    );
    renderGarage();
  } catch (error) {
    alert(error.message);
  }
}

function renderGarage() {
  const container = domCache.bookingList;
  container.innerHTML = "";

  if (!appState.bookings.length) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.textContent = "No active technical dossiers found.";
    container.appendChild(empty);
    return;
  }

  appState.bookings.forEach((item) => {
    const card = document.createElement("div");
    card.className = "booking-item";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", `Booking for ${item.model} - ${item.reg}`);

    const meta = document.createElement("div");
    meta.className = "booking-meta";

    const title = document.createElement("h3");
    title.textContent = `${item.model} - ${item.reg}`;

    const info = document.createElement("p");
    info.textContent = `Dossier Date: ${item.date} | Scheduled Slot: ${item.time}`;

    const tags = document.createElement("div");
    tags.className = "task-tags";
    tags.setAttribute("aria-label", "Service tasks");
    item.tasks.forEach((task) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = task;
      tag.setAttribute("aria-label", `Service task: ${task}`);
      tags.appendChild(tag);
    });

    meta.appendChild(title);
    meta.appendChild(info);
    meta.appendChild(tags);

    const actions = document.createElement("div");
    actions.className = "booking-actions";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-outline";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = item.id;
    editButton.textContent = "Modify";
    editButton.setAttribute("aria-label", `Modify booking for ${item.model}`);

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = "Cancel";
    deleteButton.setAttribute("aria-label", `Cancel booking for ${item.model}`);

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(meta);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to purge this technical booking?")) return;
  try {
    if (isDemoMode()) {
      const entries = getDemoBookings().filter((item) => item.id !== id);
      saveDemoBookings(entries);
      await loadBookings();
      return;
    }
    await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

function prepEdit(id) {
  const item = appState.bookingMap.get(id);
  if (!item) {
    alert("Booking not found.");
    return;
  }
  setView("book");

  domCache.editId.value = item.id;
  const isStandard = Array.from(domCache.modelSelect.options).some(
    (option) => option.value === item.model
  );

  if (isStandard) {
    domCache.modelSelect.value = item.model;
    checkOther("");
  } else {
    domCache.modelSelect.value = "Other";
    checkOther("Other");
    domCache.modelOther.value = item.model;
  }

  domCache.regNum.value = item.reg;
  domCache.datePick.value = item.date;
  domCache.timePick.value = item.time;
  domCache.notes.value = item.notes || "";

  document.querySelectorAll('input[name="task"]').forEach((checkbox) => {
    checkbox.checked = item.tasks.includes(checkbox.value);
  });

  domCache.submitBtn.textContent = "Update Records";
  domCache.cancelEdit.classList.remove("is-hidden");
}

function handleBookingListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit") {
    prepEdit(id);
  }
  if (button.dataset.action === "delete") {
    cancelBooking(id);
  }
}

function resetForm() {
  domCache.mainForm.reset();
  domCache.editId.value = "";
  domCache.submitBtn.textContent = "Submit Booking";
  domCache.cancelEdit.classList.add("is-hidden");
  checkOther(domCache.modelSelect.value);
  tabTo("maint");
}

async function bootstrap() {
  domCache.init();

  domCache.authTabs.forEach((tab) =>
    tab.addEventListener("click", () => setAuthView(tab.dataset.authTab))
  );
  domCache.loginForm.addEventListener("submit", handleLogin);
  domCache.registerForm.addEventListener("submit", handleRegister);
  domCache.logoutButton.addEventListener("click", handleLogout);
  domCache.navButtons.forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setView(button.dataset.view);
    })
  );
  domCache.hamburger.addEventListener("click", toggleMobileMenu);
  domCache.catBtns.forEach((button) =>
    button.addEventListener("click", () => tabTo(button.dataset.cat))
  );
  domCache.modelSelect.addEventListener("change", (event) =>
    checkOther(event.target.value)
  );
  domCache.mainForm.addEventListener("submit", handleFormSubmit);
  domCache.cancelEdit.addEventListener("click", resetForm);
  domCache.bookingList.addEventListener("click", handleBookingListClick);

  tabTo("maint");
  domCache.modelOther.disabled = true;
  domCache.datePick.min = new Date().toISOString().split("T")[0];

  if (!getToken()) {
    showLoginScreen();
    return;
  }

  try {
    if (isDemoMode()) {
      setUserInfo({ username: "Demo User", email: "demo@preview.local" });
      hideLoginScreen();
      setView("garage");
      return;
    }
    const data = await apiFetch("/api/auth/me");
    setUserInfo(data.user);
    hideLoginScreen();
    setView("garage");
  } catch (error) {
    clearDemoMode();
    clearToken();
    showLoginScreen();
  }
}

bootstrap();
