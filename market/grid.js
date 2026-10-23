const EXCHANGE = ["TSX", "TSXV", "CSE", "Cboe Canada"];

const COLORS = {
  value: "#1F8A65",
  modest: "#2E79B5",
  hype: "#ff4d4d",
  neutral: "#ffffff",
  book: "#ffcf6b",
  ring: "#7fe7d6",
  floor: "rgba(127, 160, 180, 0.35)",
  wire: "rgba(155, 184, 200, 0.55)",
  label: "#9bb8c8",
  bg: "#04121f",
};

const cam = { yaw: 0.62, pitch: 0.74, zoom: 1 };
let listings = [];
let asof = "";
let shown = [];
let hoverId = null;
let pinnedId = null;
let latestHits = [];

const canvas = document.getElementById("grid");
const panel = document.getElementById("panel");
const counts = document.getElementById("counts");
const stats = document.getElementById("stats");

function listingId(row) {
  return row.x + ":" + row.s;
}

function money(n) {
  if (n >= 100) return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(3);
}

function logSpan(row) {
  return Math.log10(row.hi / row.lo);
}

function rangeFraction(row, price) {
  const span = logSpan(row);
  if (!(span > 0)) return 1;
  return Math.min(1, Math.max(0, Math.log10(price / row.lo) / span));
}

function bucketOf(row) {
  if (row.k === 1 || row.pb === null) return "neutral";
  if (row.pb < 0 || row.pb > 4) return "hype";
  if (row.pb <= 1.5) return "value";
  return "mixed";
}

function bucketLabel(row) {
  if (row.k === 1) return "Fund. No company book, so it stays white.";
  if (row.pb === null) return "No price-to-book on file.";
  if (row.pb < 0) return "Negative book. There is no positive equity under the price.";
  if (row.pb <= 1.5) return "Price is near book.";
  if (row.pb <= 4) return "Price is a modest premium to book.";
  return "Price is far above book.";
}

function applyFilters() {
  const market = document.getElementById("market").value;
  const kind = document.getElementById("kind").value;
  const ccy = document.getElementById("ccy").value;
  const needle = document.getElementById("q").value.trim().toLowerCase();
  shown = listings.filter((row) => {
    if (market !== "all" && String(row.x) !== market) return false;
    if (kind === "stock" && row.k !== 0) return false;
    if (kind === "etf" && row.k !== 1) return false;
    if (ccy === "cad" && row.usd === 1) return false;
    if (ccy === "usd" && row.usd !== 1) return false;
    if (!needle) return true;
    return row.s.toLowerCase().includes(needle) || row.n.toLowerCase().includes(needle);
  });
  const stocks = shown.filter((row) => row.k === 0).length;
  stats.textContent = shown.length.toLocaleString("en-CA") + " listings · " +
    stocks.toLocaleString("en-CA") + " stocks · " +
    (shown.length - stocks).toLocaleString("en-CA") + " funds";
  const parts = EXCHANGE.map((name, index) => {
    const n = shown.filter((row) => row.x === index).length;
    return n ? n.toLocaleString("en-CA") + " " + name : "";
  }).filter(Boolean);
  const when = asof ? " · prices " + asof : "";
  counts.textContent = parts.join(" · ") + when;
  draw();
  renderPanel();
}

function selectedRow() {
  if (pinnedId) {
    const pinned = listings.find((row) => listingId(row) === pinnedId);
    if (pinned) return pinned;
  }
  return shown.find((row) => listingId(row) === hoverId) || null;
}

function quoteDate(iso) {
  if (!iso) return "CAD quotes";
  const parts = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (parts.length !== 3 || parts.some((n) => !n)) return "CAD quotes · " + iso;
  return "CAD quotes · " + parts[2] + " " + months[parts[1] - 1] + " " + parts[0];
}

function field(label, value) {
  return '<div class="field"><dt>' + label + "</dt><dd>" + value + "</dd></div>";
}

function bookValue(row) {
  if (row.k === 1) return "Fund";
  if (row.pb === null) return "—";
  if (!(row.pb > 0)) return "Negative book";
  const ccy = row.usd === 1 ? "USD" : "CAD";
  return money(row.p / row.pb) + " " + ccy;
}

function capLabel(row) {
  if (!(row.mc > 0)) return "—";
  const ccy = row.usd === 1 ? "USD" : "CAD";
  const cap = row.mc >= 1000 ? (row.mc / 1000).toFixed(1) + " billion" : row.mc.toFixed(0) + " million";
  return cap + " " + ccy;
}

function renderPanel() {
  const row = selectedRow();
  const ccy = row ? (row.usd === 1 ? "USD" : "CAD") : "—";
  const kind = row ? (row.k === 1 ? "ETF or fund" : "Stock") : "—";
  let html = "<h2>" + (row ? escapeHtml(row.n) : "—") + "</h2>";
  html += '<p class="ticker">' + (row ? escapeHtml(row.s) : "—") + "</p>";
  if (row && pinnedId && listingId(row) === pinnedId) {
    html += '<button type="button" id="release">Unpin</button>';
  }
  html += "<dl>";
  html += field("Ticker", row ? escapeHtml(row.s) : "—");
  html += field("Market", row ? EXCHANGE[row.x] : "—");
  html += field("Kind", kind);
  html += field("Currency", ccy);
  html += field("Last price", row ? money(row.p) + " " + ccy : "—");
  html += field("Book value", row ? bookValue(row) : "—");
  html += field("Price to book", row && row.pb !== null ? row.pb.toFixed(2) : "—");
  html += field("Low", row ? money(row.lo) + " " + ccy : "—");
  html += field("High", row ? money(row.hi) + " " + ccy : "—");
  html += field("Price in range", row ? Math.round(rangeFraction(row, row.p) * 100) + "%" : "—");
  html += field("Years of history", row ? row.y.toFixed(1) : "—");
  html += field("Market cap", row ? capLabel(row) : "—");
  html += field("Versus book", row ? bucketLabel(row) : "—");
  html += "</dl>";
  panel.innerHTML = html;
  const release = document.getElementById("release");
  if (release) {
    release.addEventListener("click", () => {
      pinnedId = null;
      draw();
      renderPanel();
    });
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function draw() {
  const parent = canvas.parentElement;
  const width = parent.clientWidth || 800;
  const height = Math.max(760, Math.min(1200, Math.round(window.innerHeight - 120)));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.lineJoin = "round";
  ctx.font = "12px Inter, sans-serif";

  let minP = Infinity;
  let maxP = 0;
  let maxYear = 10;
  let maxSpan = 1;
  let priced = 0;
  for (const row of shown) {
    if (row.p > 0) {
      if (row.p < minP) minP = row.p;
      if (row.p > maxP) maxP = row.p;
      priced += 1;
    }
    if (row.y > maxYear) maxYear = row.y;
    const span = logSpan(row);
    if (span > maxSpan) maxSpan = span;
  }
  if (priced === 0) {
    minP = 0.1;
    maxP = 100;
  }
  if (maxP <= minP) maxP = minP * 10;
  const minLog = Math.log10(minP);
  const maxLog = Math.log10(maxP);
  const ccy = document.getElementById("ccy").value;

  function project(x, y, z) {
    const cy = Math.cos(cam.yaw);
    const sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch);
    const sp = Math.sin(cam.pitch);
    const x1 = x * cy - y * sy;
    const y1 = x * sy + y * cy;
    const y2 = y1 * cp - z * sp;
    const z2 = y1 * sp + z * cp;
    const f = (cam.zoom * Math.min(width, height)) / (5.1 - z2);
    return { x: width / 2 + x1 * f, y: height * 0.58 + y2 * f, z: z2 };
  }
  const wx = (price) => ((Math.log10(price) - minLog) / (maxLog - minLog || 1)) * 2 - 1;
  const wy = (year) => (year / maxYear) * 2 - 1;
  const wz = (span) => (Math.min(span, maxSpan) / maxSpan) * 0.78;

  ctx.strokeStyle = COLORS.floor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const floor = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  floor.forEach((point, index) => {
    const next = floor[(index + 1) % floor.length];
    const a = project(point[0], point[1], 0);
    const b = project(next[0], next[1], 0);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  });
  for (let step = -1; step <= 1; step += 0.5) {
    const a = project(step, -1, 0);
    const b = project(step, 1, 0);
    const c = project(-1, step, 0);
    const d = project(1, step, 0);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
  }
  ctx.stroke();

  ctx.fillStyle = COLORS.label;
  const currency = ccy === "usd" ? "USD" : "CAD";
  [0.1, 1, 10, 100, 1000, 3000].forEach((price) => {
    const log = Math.log10(price);
    if (log < minLog || log > maxLog) return;
    const at = project(wx(price), -1.08, 0);
    ctx.textAlign = "center";
    ctx.fillText(price >= 1 ? "$" + price : "$" + price.toFixed(2), at.x, at.y);
  });
  [0, 10, 20, 30, 40].forEach((year) => {
    if (year > maxYear) return;
    const at = project(-1.12, wy(year), 0);
    ctx.textAlign = "right";
    ctx.fillText(year + "y", at.x, at.y);
  });
  ctx.textAlign = "left";
  ctx.fillText("Price (" + currency + ", log)", project(1.05, -1.08, 0).x, project(1.05, -1.08, 0).y);
  ctx.textAlign = "right";
  const yearLabel = project(-1.12, 1.08, 0);
  ctx.fillText("Years of record", yearLabel.x, yearLabel.y);

  const boxes = shown.map((row) => {
    const span = logSpan(row);
    const x = wx(row.p);
    const y = wy(row.y);
    const top = wz(span);
    const plate = rangeFraction(row, row.p) * top;
    let bookZ = null;
    if (row.pb !== null && row.pb > 0) {
      const book = row.p / row.pb;
      if (book >= row.lo && book <= row.hi) bookZ = rangeFraction(row, book) * top;
    }
    return { row, x, y, top, plate, bookZ, depth: project(x, y, plate).z };
  });
  boxes.sort((a, b) => a.depth - b.depth);

  const hx = 0.012;
  const hy = 0.012;
  const dragging = canvas.dataset.dragging === "1";
  ctx.strokeStyle = COLORS.wire;
  ctx.globalAlpha = dragging ? 0.15 : 0.45;
  ctx.beginPath();
  boxes.forEach((box) => {
    const corners = [0, 1].flatMap((iz) => {
      const z = iz === 0 ? 0 : box.top;
      return [
        project(box.x - hx, box.y - hy, z),
        project(box.x + hx, box.y - hy, z),
        project(box.x + hx, box.y + hy, z),
        project(box.x - hx, box.y + hy, z),
      ];
    });
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(corners[i].x, corners[i].y);
      ctx.lineTo(corners[(i + 1) % 4].x, corners[(i + 1) % 4].y);
      ctx.moveTo(corners[i + 4].x, corners[i + 4].y);
      ctx.lineTo(corners[((i + 1) % 4) + 4].x, corners[((i + 1) % 4) + 4].y);
      ctx.moveTo(corners[i].x, corners[i].y);
      ctx.lineTo(corners[i + 4].x, corners[i + 4].y);
    }
  });
  ctx.stroke();
  ctx.globalAlpha = 1;

  const hits = [];
  boxes.forEach((box) => {
    const tone = bucketOf(box.row);
    const color = tone === "value" ? COLORS.value : tone === "hype" ? COLORS.hype : tone === "mixed" ? COLORS.modest : COLORS.neutral;
    const fade = 0.12 + 0.88 * rangeFraction(box.row, box.row.p);
    const plate = [
      project(box.x - hx, box.y - hy, box.plate),
      project(box.x + hx, box.y - hy, box.plate),
      project(box.x + hx, box.y + hy, box.plate),
      project(box.x - hx, box.y + hy, box.plate),
    ];
    ctx.beginPath();
    ctx.moveTo(plate[0].x, plate[0].y);
    plate.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.globalAlpha = fade;
    ctx.fillStyle = color;
    ctx.fill();
    hits.push({ id: listingId(box.row), x: (plate[0].x + plate[2].x) / 2, y: (plate[0].y + plate[2].y) / 2 });
    if (box.bookZ !== null) {
      const a = project(box.x - hx, box.y, box.bookZ);
      const b = project(box.x + hx, box.y, box.bookZ);
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = COLORS.book;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
  latestHits = hits;

  const activeId = pinnedId || hoverId;
  const active = boxes.find((box) => listingId(box.row) === activeId);
  if (active) {
    const ring = [0, 1].flatMap((iz) => {
      const z = iz === 0 ? 0 : active.top;
      return [
        project(active.x - hx, active.y - hy, z),
        project(active.x + hx, active.y - hy, z),
        project(active.x + hx, active.y + hy, z),
        project(active.x - hx, active.y + hy, z),
      ];
    });
    ctx.strokeStyle = COLORS.ring;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(ring[i].x, ring[i].y);
      ctx.lineTo(ring[(i + 1) % 4].x, ring[(i + 1) % 4].y);
      ctx.moveTo(ring[i + 4].x, ring[i + 4].y);
      ctx.lineTo(ring[((i + 1) % 4) + 4].x, ring[((i + 1) % 4) + 4].y);
      ctx.moveTo(ring[i].x, ring[i].y);
      ctx.lineTo(ring[i + 4].x, ring[i + 4].y);
    }
    ctx.stroke();
  }
}

function pickId(event) {
  const rect = canvas.getBoundingClientRect();
  const mx = event.clientX - rect.left;
  const my = event.clientY - rect.top;
  let bestId = null;
  let bestD = 22 * 22;
  for (const hit of latestHits) {
    const d = (hit.x - mx) ** 2 + (hit.y - my) ** 2;
    if (d < bestD) {
      bestId = hit.id;
      bestD = d;
    }
  }
  return bestId;
}

function bindCanvas() {
  let dragging = false;
  let pinched = false;
  let usingGesture = false;
  let gestureZoom = 1;
  let pinchDist = 0;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let lastY = 0;
  const pointers = new Map();

  function span() {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function setZoom(next) {
    cam.zoom = Math.min(2.8, Math.max(0.55, next));
  }

  canvas.addEventListener("pointerdown", (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size >= 2) {
      dragging = false;
      pinched = true;
      pinchDist = span();
      canvas.dataset.dragging = "0";
      return;
    }
    dragging = true;
    pinched = false;
    canvas.dataset.dragging = "1";
    downX = lastX = event.clientX;
    downY = lastY = event.clientY;
  });
  canvas.addEventListener("pointermove", (event) => {
    if (pointers.has(event.pointerId)) {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (usingGesture || pointers.size >= 2) {
      const dist = span();
      if (!usingGesture && pinchDist > 0 && dist > 0) {
        setZoom(cam.zoom * (dist / pinchDist));
        pinchDist = dist;
        draw();
      }
      return;
    }
    if (!dragging) {
      if (pinnedId) return;
      const next = pickId(event);
      if (next !== hoverId) {
        hoverId = next;
        draw();
        renderPanel();
      }
      return;
    }
    cam.yaw += (event.clientX - lastX) * 0.007;
    cam.pitch = Math.min(1.42, Math.max(0.08, cam.pitch + (event.clientY - lastY) * 0.007));
    lastX = event.clientX;
    lastY = event.clientY;
    draw();
  });
  canvas.addEventListener("pointerup", (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size > 0) {
      dragging = false;
      pinchDist = span();
      const left = [...pointers.values()][0];
      lastX = downX = left.x;
      lastY = downY = left.y;
      return;
    }
    const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
    const wasDrag = dragging;
    dragging = false;
    canvas.dataset.dragging = "0";
    if (wasDrag && !pinched && moved < 6) {
      const next = pickId(event);
      pinnedId = next;
      if (next) hoverId = next;
      renderPanel();
    }
    pinched = false;
    pinchDist = 0;
    draw();
  });
  canvas.addEventListener("pointercancel", (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      dragging = false;
      pinched = false;
      pinchDist = 0;
      canvas.dataset.dragging = "0";
    }
  });
  canvas.addEventListener("pointerleave", () => {
    if (pointers.size > 0) return;
    dragging = false;
    canvas.dataset.dragging = "0";
  });
  canvas.addEventListener("gesturestart", (event) => {
    event.preventDefault();
    usingGesture = true;
    pinched = true;
    dragging = false;
    gestureZoom = cam.zoom;
  }, { passive: false });
  canvas.addEventListener("gesturechange", (event) => {
    event.preventDefault();
    setZoom(gestureZoom * event.scale);
    draw();
  }, { passive: false });
  canvas.addEventListener("gestureend", (event) => {
    event.preventDefault();
    usingGesture = false;
  }, { passive: false });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    cam.zoom = Math.min(2.8, Math.max(0.55, cam.zoom * (event.deltaY > 0 ? 0.92 : 1.08)));
    draw();
  }, { passive: false });
  window.addEventListener("resize", draw);
}

document.querySelectorAll("[data-look]").forEach((button) => {
  button.addEventListener("click", () => {
    const [yaw, pitch] = button.dataset.look.split(",").map(Number);
    cam.yaw = yaw;
    cam.pitch = pitch;
    cam.zoom = 1;
    draw();
  });
});
["market", "kind", "ccy"].forEach((id) => {
  document.getElementById(id).addEventListener("change", applyFilters);
});
document.getElementById("q").addEventListener("input", applyFilters);

bindCanvas();
Promise.all([
  fetch("/market/listings.json").then((response) => response.json()),
  fetch("/market/asof.json").then((response) => (response.ok ? response.json() : null)).catch(() => null),
])
  .then(([rows, meta]) => {
    listings = rows;
    asof = meta && meta.asof ? meta.asof : "";
    const stamp = document.getElementById("quote-date");
    if (stamp) stamp.textContent = quoteDate(asof);
    applyFilters();
  })
  .catch(() => {
    panel.innerHTML = "<h2>The listing file did not load.</h2>";
  });
