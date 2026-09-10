// Main 4 cities (always displayed)
const ZONES = [
  { id: "stockholm", city: "Stockholm", country: "Sweden", zone: "Europe/Stockholm", accent: "#c8f35b" },
  { id: "ottawa", city: "Ottawa", country: "Canada", zone: "America/Toronto", accent: "#ff725e" },
  { id: "dhaka", city: "Dhaka", country: "Bangladesh", zone: "Asia/Dhaka", accent: "#6ba8ff" },
  { id: "kuala-lumpur", city: "Kuala Lumpur", country: "Malaysia", zone: "Asia/Kuala_Lumpur", accent: "#5ce0c2" }
];

const state = {
  anchorId: "stockholm",
  instant: new Date(),
  live: true,
  snapshotBlob: null,
  snapshotUrl: null,
  additionalCities: []
};

const el = {
  anchor: document.querySelector("#anchor-select"),
  input: document.querySelector("#time-input"),
  hoursSlider: document.querySelector("#hours-slider"),
  minutesSlider: document.querySelector("#minutes-slider"),
  hoursDisplay: document.querySelector("#hours-display"),
  minutesDisplay: document.querySelector("#minutes-display"),
  grid: document.querySelector("#clock-grid"),
  now: document.querySelector("#now-button"),
  minus: document.querySelector("#minus-hour"),
  plus: document.querySelector("#plus-hour"),
  copy: document.querySelector("#copy-button"),
  capture: document.querySelector("#capture-button"),
  dialog: document.querySelector("#share-dialog"),
  preview: document.querySelector("#snapshot-preview"),
  close: document.querySelector("#dialog-close"),
  download: document.querySelector("#download-button"),
  share: document.querySelector("#share-button"),
  shareNote: document.querySelector("#share-note"),
  livePill: document.querySelector("#live-pill"),
  modeLabel: document.querySelector("#mode-label"),
  summary: document.querySelector("#moment-summary"),
  toast: document.querySelector("#toast"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeIcon: document.querySelector(".theme-icon"),
  addCityBtn: document.querySelector("#add-city-btn"),
  addCityDialog: document.querySelector("#add-city-dialog"),
  cityAddClose: document.querySelector("#add-city-close"),
  citySearch: document.querySelector("#city-search"),
  citySelect: document.querySelector("#city-select"),
  citySuggestions: document.querySelector("#city-suggestions"),
  cityAddConfirm: document.querySelector("#city-add-confirm"),
  cityCancel: document.querySelector("#city-cancel"),
  citiesList: document.querySelector("#cities-list")
};

// Theme Management
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  applyTheme(saved);
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "light") {
    html.classList.remove("dark-mode");
    html.classList.add("light-mode");
    el.themeIcon.textContent = "☀️";
  } else {
    html.classList.remove("light-mode");
    html.classList.add("dark-mode");
    el.themeIcon.textContent = "🌙";
  }
  localStorage.setItem("theme", theme);
}

el.themeToggle.addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
});

// Timezone utilities
function partsInZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });
  return Object.fromEntries(formatter.formatToParts(date).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
}

function localInputValue(date, timeZone) {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function zonedLocalToDate(value, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  const desiredAsUtc = Date.UTC(y, m - 1, d, h, min, 0);
  let guess = desiredAsUtc;
  for (let i = 0; i < 3; i += 1) {
    const p = partsInZone(new Date(guess), timeZone);
    const shownAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    guess += desiredAsUtc - shownAsUtc;
  }
  return new Date(guess);
}

function formatZone(date, item) {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: item.zone, hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
  const dateText = new Intl.DateTimeFormat("en-GB", { timeZone: item.zone, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date);
  const hour = Number(partsInZone(date, item.zone).hour);
  const offset = new Intl.DateTimeFormat("en-GB", { timeZone: item.zone, timeZoneName: "shortOffset" }).formatToParts(date).find(p => p.type === "timeZoneName")?.value || "UTC";
  return { time, dateText, hour, offset: offset.replace("GMT", "UTC") };
}

function dayNumber(date, timeZone) {
  const p = partsInZone(date, timeZone);
  return Date.UTC(+p.year, +p.month - 1, +p.day) / 86400000;
}

function dayShiftLabel(date, zone, anchorZone) {
  const shift = dayNumber(date, zone) - dayNumber(date, anchorZone);
  if (shift === 0) return "Same day";
  return shift > 0 ? `Next day +${shift}` : `Previous day ${shift}`;
}

function workLabel(hour) {
  if (hour >= 9 && hour < 17) return { label: "Working hours", className: "good" };
  if (hour >= 7 && hour < 9) return { label: "Early morning", className: "" };
  if (hour >= 17 && hour < 22) return { label: "Evening", className: "" };
  return { label: "Outside hours", className: "" };
}

function render(updateInput = true) {
  const anchor = ZONES.find(z => z.id === state.anchorId);
  if (updateInput && document.activeElement !== el.input) el.input.value = localInputValue(state.instant, anchor.zone);
  
  // Update sliders
  if (document.activeElement !== el.hoursSlider && document.activeElement !== el.minutesSlider) {
    const p = partsInZone(state.instant, anchor.zone);
    const hour = Number(p.hour);
    const minute = Number(p.minute);
    el.hoursSlider.value = hour;
    el.hoursDisplay.textContent = String(hour).padStart(2, "0");
    el.minutesSlider.value = Math.floor(minute / 5) * 5;
    el.minutesDisplay.textContent = String(Math.floor(minute / 5) * 5).padStart(2, "0");
  }
  
  el.anchor.value = state.anchorId;
  el.livePill.classList.toggle("planned", !state.live);
  el.modeLabel.textContent = state.live ? "Live now" : "Planning mode";
  el.summary.textContent = state.live ? "Live local times across four zones" : `Anchored to ${anchor.city} local time`;

  el.grid.innerHTML = ZONES.map(item => {
    const data = formatZone(state.instant, item);
    const work = workLabel(data.hour);
    return `
      <button class="clock-card ${item.id === state.anchorId ? "selected" : ""}" style="--accent:${item.accent}" data-zone="${item.id}" type="button" aria-label="Use ${item.city} as the starting city">
        <span class="card-head"><span><span class="city">${item.city}</span><span class="country">${item.country}</span></span><span class="city-dot"></span></span>
        <span class="clock-time">${data.time}<small>${data.offset}</small></span>
        <span class="clock-date">${data.dateText}</span>
        <span class="card-foot"><span class="work-status ${work.className}">${work.label}</span><span class="day-shift">${dayShiftLabel(state.instant, item.zone, anchor.zone)}</span></span>
      </button>
    `;
  }).join("");
  
  renderAdditionalCities();
}

function renderAdditionalCities() {
  if (state.additionalCities.length === 0) {
    el.citiesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px 20px; color: var(--muted); font-size: 0.9rem;">No additional cities yet. Click "+ Add City" to add one.</div>';
    return;
  }
  
  el.citiesList.innerHTML = state.additionalCities.map((item, index) => {
    const data = formatZone(state.instant, item);
    const anchor = ZONES.find(z => z.id === state.anchorId);
    return `
      <div class="city-card">
        <button class="city-card-remove" data-index="${index}" type="button" title="Remove city">✕</button>
        <span class="city-card-time">${data.time}</span>
        <span class="city-card-name">${item.city}</span>
        <span class="city-card-tz">${item.country}</span>
        <span class="city-card-offset" style="font-size: 0.7rem; color: var(--muted);">${data.offset}</span>
      </div>
    `;
  }).join("");
  
  document.querySelectorAll(".city-card-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index);
      state.additionalCities.splice(idx, 1);
      localStorage.setItem("additionalCities", JSON.stringify(state.additionalCities));
      render(false);
    });
  });
}

function setPlanned(date) {
  if (date) { state.instant = date; state.live = false; render(); }
}

function summaryText() {
  const anchor = ZONES.find(z => z.id === state.anchorId);
  const times = ZONES.map(z => {
    const d = formatZone(state.instant, z.zone);
    return `${z.city}: ${d.time}`;
  }).join(" · ");
  return `Time Bridge: ${times}`;
}

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 3000);
}

async function makeSnapshot() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  
  ctx.fillStyle = "#0f182a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = "#f5f7fb";
  ctx.font = "800 44px system-ui, sans-serif";
  ctx.fillText("Time Bridge", 80, 70);
  
  const anchor = ZONES.find(z => z.id === state.anchorId);
  ctx.fillStyle = "#98a5bd";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText(`From: ${anchor.city}`, 80, 120);
  
  ZONES.forEach((z, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 80 + col * 630;
    const y = 270 + row * 300;
    const d = formatZone(state.instant, z);
    ctx.fillStyle = "rgba(15, 24, 42, .94)";
    ctx.strokeStyle = z.id === state.anchorId ? z.accent : "rgba(255,255,255,.12)";
    ctx.lineWidth = z.id === state.anchorId ? 4 : 2;
    roundedRect(ctx, x, y, 590, 255, 24);
    ctx.fillStyle = z.accent;
    ctx.beginPath(); ctx.arc(x + 524, y + 46, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f5f7fb";
    ctx.font = "800 22px system-ui, sans-serif";
    ctx.fillText(z.city.toUpperCase(), x + 34, y + 52);
    ctx.fillStyle = "#78869e";
    ctx.font = "500 18px system-ui, sans-serif";
    ctx.fillText(z.country, x + 34, y + 80);
    ctx.fillStyle = "#f5f7fb";
    ctx.font = "700 60px system-ui, sans-serif";
    ctx.fillText(d.time, x + 32, y + 160);
    ctx.fillStyle = "#9ba8bd";
    ctx.font = "600 19px system-ui, sans-serif";
    ctx.fillText(`${d.dateText}  ·  ${d.offset}`, x + 36, y + 210);
  });

  ctx.fillStyle = "#66748b";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.fillText("Made with Time Bridge", 80, 940);
  ctx.textAlign = "right";
  ctx.fillText("Stockholm  ·  Ottawa  ·  Dhaka  ·  Kuala Lumpur", 1320, 940);
  ctx.textAlign = "left";

  return new Promise(resolve => canvas.toBlob(resolve, "image/png", 1));
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

async function openSnapshot() {
  el.capture.disabled = true;
  el.capture.textContent = "Creating…";
  state.snapshotBlob = await makeSnapshot();
  if (state.snapshotUrl) URL.revokeObjectURL(state.snapshotUrl);
  state.snapshotUrl = URL.createObjectURL(state.snapshotBlob);
  el.preview.src = state.snapshotUrl;
  el.capture.disabled = false;
  el.capture.innerHTML = '<span aria-hidden="true">↗</span> Screenshot &amp; share';
  el.share.hidden = !navigator.share;
  if (!navigator.share) el.shareNote.textContent = "Sharing files is not supported here. Download the PNG, then attach it in Messenger.";
  el.dialog.showModal();
}

function downloadSnapshot() {
  const a = document.createElement("a");
  a.href = state.snapshotUrl;
  a.download = `time-bridge-${state.instant.toISOString().slice(0, 16).replaceAll(":", "-")}.png`;
  a.click();
}

async function shareSnapshot() {
  const file = new File([state.snapshotBlob], "time-bridge.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Time Bridge", text: summaryText(), files: [file] });
    } else {
      await navigator.share({ title: "Time Bridge", text: summaryText(), url: location.href });
    }
  } catch (error) {
    if (error.name !== "AbortError") showToast("Sharing was not available — download the image instead");
  }
}

// City Management
function populateCityDropdown() {
  el.citySelect.innerHTML = TIMEZONE_DATABASE.map(item => 
    `<option value="${item.zone}" data-city="${item.city}" data-country="${item.country}">${item.city}, ${item.country}</option>`
  ).join("");
}

el.citySearch.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  if (query.length < 1) {
    el.citySuggestions.classList.remove("active");
    return;
  }
  
  const filtered = TIMEZONE_DATABASE.filter(item =>
    item.city.toLowerCase().includes(query) || item.country.toLowerCase().includes(query)
  ).slice(0, 8);
  
  el.citySuggestions.innerHTML = filtered.map(item =>
    `<div class="city-suggestion-item" data-zone="${item.zone}" data-city="${item.city}" data-country="${item.country}">${item.city}, ${item.country}</div>`
  ).join("");
  
  el.citySuggestions.classList.add("active");
  
  document.querySelectorAll(".city-suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      const zone = item.dataset.zone;
      const city = item.dataset.city;
      const country = item.dataset.country;
      el.citySearch.value = `${city}, ${country}`;
      el.citySuggestions.classList.remove("active");
    });
  });
});

el.cityAddConfirm.addEventListener("click", () => {
  let selected = null;
  
  // Try to find by search value first
  if (el.citySearch.value) {
    const searchTerm = el.citySearch.value.trim();
    selected = TIMEZONE_DATABASE.find(item => 
      `${item.city}, ${item.country}`.toLowerCase() === searchTerm.toLowerCase()
    );
    if (!selected) {
      selected = TIMEZONE_DATABASE.find(item => 
        item.city.toLowerCase() === searchTerm.split(",")[0]?.toLowerCase()
      );
    }
  }
  
  // Fall back to dropdown if not found
  if (!selected && el.citySelect.value) {
    selected = TIMEZONE_DATABASE.find(item => item.zone === el.citySelect.value);
  }
  
  if (selected && !state.additionalCities.find(c => c.zone === selected.zone)) {
    state.additionalCities.push(selected);
    localStorage.setItem("additionalCities", JSON.stringify(state.additionalCities));
    render(false);
    el.citySearch.value = "";
    el.citySuggestions.classList.remove("active");
    el.addCityDialog.close();
    showToast(`Added ${selected.city}!`);
  } else if (state.additionalCities.find(c => c.zone === selected?.zone)) {
    showToast(`${selected.city} is already added!`);
  } else {
    showToast("Please select a valid city");
  }
});

el.addCityBtn.addEventListener("click", () => {
  el.citySearch.value = "";
  el.citySuggestions.classList.remove("active");
  el.addCityDialog.showModal();
});

el.cityAddClose.addEventListener("click", () => el.addCityDialog.close());
el.cityCancel.addEventListener("click", () => el.addCityDialog.close());

function loadStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const from = params.get("from");
  const at = params.get("at");
  if (ZONES.some(z => z.id === from)) state.anchorId = from;
  if (at) {
    const parsed = new Date(at);
    if (!Number.isNaN(parsed.getTime())) { state.instant = parsed; state.live = false; }
  }
}

function loadAdditionalCities() {
  try {
    const saved = localStorage.getItem("additionalCities");
    if (saved) state.additionalCities = JSON.parse(saved);
  } catch (e) {
    state.additionalCities = [];
  }
}

// Initialize
initTheme();
ZONES.forEach(z => el.anchor.add(new Option(`${z.city}, ${z.country}`, z.id)));
populateCityDropdown();
loadStateFromUrl();
loadAdditionalCities();
render();
renderAdditionalCities();  // Ensure cities render on load

el.anchor.addEventListener("change", () => { state.anchorId = el.anchor.value; render(); });
el.input.addEventListener("change", () => {
  const zone = ZONES.find(z => z.id === state.anchorId);
  setPlanned(zonedLocalToDate(el.input.value, zone.zone));
});

el.hoursSlider.addEventListener("input", () => {
  const h = parseInt(el.hoursSlider.value, 10);
  el.hoursDisplay.textContent = String(h).padStart(2, "0");
  updateTimeFromSliders();
});

el.minutesSlider.addEventListener("input", () => {
  const m = parseInt(el.minutesSlider.value, 10);
  el.minutesDisplay.textContent = String(m).padStart(2, "0");
  updateTimeFromSliders();
});

function updateTimeFromSliders() {
  const zone = ZONES.find(z => z.id === state.anchorId);
  const h = parseInt(el.hoursSlider.value, 10);
  const m = parseInt(el.minutesSlider.value, 10);
  const p = partsInZone(state.instant, zone.zone);
  const newValue = `${p.year}-${p.month}-${p.day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  setPlanned(zonedLocalToDate(newValue, zone.zone));
}

el.grid.addEventListener("click", event => {
  const card = event.target.closest(".clock-card");
  if (!card) return;
  state.anchorId = card.dataset.zone;
  render();
  document.querySelector(".control-panel").scrollIntoView({ behavior: "smooth", block: "center" });
});

el.now.addEventListener("click", () => { state.live = true; state.instant = new Date(); render(); });
el.minus.addEventListener("click", () => setPlanned(new Date(state.instant.getTime() - 3600000)));
el.plus.addEventListener("click", () => setPlanned(new Date(state.instant.getTime() + 3600000)));
el.copy.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(location.href); showToast("Shareable app link copied"); }
  catch { showToast("Could not access the clipboard"); }
});
el.capture.addEventListener("click", openSnapshot);
el.close.addEventListener("click", () => el.dialog.close());
el.dialog.addEventListener("click", event => { if (event.target === el.dialog) el.dialog.close(); });
el.download.addEventListener("click", downloadSnapshot);
el.share.addEventListener("click", shareSnapshot);

setInterval(() => { if (state.live) { state.instant = new Date(); render(false); } }, 1000);
