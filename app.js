const ZONES = [
  { id: "stockholm", city: "Stockholm", country: "Sweden", zone: "Europe/Stockholm", accent: "#c8f35b" },
  { id: "ottawa", city: "Ottawa", country: "Canada", zone: "America/Toronto", accent: "#ff725e" },
  { id: "dhaka", city: "Dhaka", country: "Bangladesh", zone: "Asia/Dhaka", accent: "#6ba8ff" },
  { id: "kuala-lumpur", city: "Kuala Lumpur", country: "Malaysia", zone: "Asia/Kuala_Lumpur", accent: "#5ce0c2" }
];

const state = { anchorId: "stockholm", instant: new Date(), live: true, snapshotBlob: null, snapshotUrl: null };

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
  toast: document.querySelector("#toast")
};

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
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: item.zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
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
      </button>`;
  }).join("");
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("from", state.anchorId);
  if (state.live) url.searchParams.delete("at");
  else url.searchParams.set("at", state.instant.toISOString());
  history.replaceState(null, "", url);
}

function setPlanned(date) {
  if (!date || Number.isNaN(date.getTime())) return;
  state.instant = date;
  state.live = false;
  render();
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function summaryText() {
  const anchor = ZONES.find(z => z.id === state.anchorId);
  const rows = ZONES.map(z => {
    const d = formatZone(state.instant, z);
    return `${z.city}: ${d.time} (${d.dateText}, ${d.offset})`;
  });
  return `Time Bridge — starting from ${anchor.city}\n${rows.join("\n")}\n${location.href}`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

async function makeSnapshot() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1400, 1000);
  gradient.addColorStop(0, "#080d18");
  gradient.addColorStop(.55, "#111c31");
  gradient.addColorStop(1, "#09111e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1400, 1000);

  ctx.fillStyle = "#c8f35b";
  ctx.font = "800 22px system-ui, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText("TIME BRIDGE", 80, 78);
  ctx.fillStyle = "#f5f7fb";
  ctx.font = "700 62px system-ui, sans-serif";
  ctx.letterSpacing = "-2px";
  ctx.fillText("One moment. Four cities.", 80, 164);
  ctx.fillStyle = "#8794ac";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.letterSpacing = "0px";
  const anchor = ZONES.find(z => z.id === state.anchorId);
  ctx.fillText(`Starting from ${anchor.city} · ${state.live ? "Live time" : "Planned time"}`, 82, 207);

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
    ctx.font = "700 74px system-ui, sans-serif";
    ctx.fillText(d.time, x + 32, y + 164);
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

ZONES.forEach(z => el.anchor.add(new Option(`${z.city}, ${z.country}`, z.id)));
loadStateFromUrl();
render();

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
