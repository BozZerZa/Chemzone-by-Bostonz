const chems = [
  { id: "cl2", name: "คลอรีน (Cl₂)", cas: "7782-50-5", mw: 70.9, aegl2: 2, idlh: 10, heavy: true,
    hazard: "ก๊าซพิษ ระคายเคืองตาและทางเดินหายใจรุนแรง หนักกว่าอากาศ ลอยต่ำตามพื้น",
    ppe: "ชุดป้องกันสารเคมีเต็มตัว + SCBA",
    aid: "ย้ายออกสู่อากาศบริสุทธิ์ ล้างตา/ผิวด้วยน้ำปริมาณมาก ถอดเสื้อผ้าที่เปื้อน พบแพทย์ทันที" },
  { id: "nh3", name: "แอมโมเนีย (NH₃)", cas: "7664-41-7", mw: 17.03, aegl2: 160, idlh: 300, heavy: false,
    hazard: "กัดกร่อน ระคายเคืองรุนแรงต่อตาและปอด ก๊าซเย็นที่เพิ่งรั่วอาจลอยต่ำ",
    ppe: "ชุดป้องกันสารเคมี + SCBA",
    aid: "ย้ายออกสู่อากาศบริสุทธิ์ ล้างตา/ผิวด้วยน้ำอย่างน้อย 15 นาที พบแพทย์" },
  { id: "h2s", name: "ไฮโดรเจนซัลไฟด์ (H₂S)", cas: "7783-06-4", mw: 34.08, aegl2: 27, idlh: 100, heavy: false,
    hazard: "ก๊าซพิษ กลิ่นไข่เน่า แต่ที่ความเข้มข้นสูงจมูกจะดมกลิ่นไม่ได้ ติดไฟได้",
    ppe: "SCBA (ห้ามไว้ใจกลิ่นเป็นสัญญาณเตือน)",
    aid: "ย้ายออกสู่อากาศบริสุทธิ์ทันที ผู้ช่วยต้องสวม SCBA ถ้าหยุดหายใจให้ช่วยหายใจ เรียกรถพยาบาล" },
  { id: "so2", name: "ซัลเฟอร์ไดออกไซด์ (SO₂)", cas: "7446-09-5", mw: 64.07, aegl2: 0.75, idlh: 100, heavy: true,
    hazard: "ระคายเคืองทางเดินหายใจ กระตุ้นหอบหืด หนักกว่าอากาศ",
    ppe: "ชุดป้องกันสารเคมี + SCBA",
    aid: "ย้ายออกสู่อากาศบริสุทธิ์ ล้างตา/ผิวด้วยน้ำ ผู้มีโรคหอบหืดเฝ้าระวังเป็นพิเศษ พบแพทย์" },
  { id: "hcl", name: "ไฮโดรเจนคลอไรด์ (HCl)", cas: "7647-01-0", mw: 36.46, aegl2: 22, idlh: 50, heavy: false,
    hazard: "กัดกร่อน เกิดหมอกกรดเมื่อรวมกับความชื้นในอากาศ",
    ppe: "ชุดป้องกันสารเคมีทนกรด + SCBA",
    aid: "ย้ายออกสู่อากาศบริสุทธิ์ ล้างตา/ผิวด้วยน้ำปริมาณมาก พบแพทย์" },
  { id: "hcho", name: "ฟอร์มัลดีไฮด์ (HCHO)", cas: "50-00-0", mw: 30.03, aegl2: 14, idlh: 20, heavy: false,
    hazard: "ระคายเคืองตา/ทางเดินหายใจ ก่อมะเร็ง ติดไฟได้",
    ppe: "ชุดป้องกันสารเคมี + เครื่องช่วยหายใจที่เหมาะสม",
    aid: "ย้ายออกสู่อากาศบริสุทธิ์ ล้างตา/ผิวด้วยน้ำปริมาณมาก พบแพทย์" }
];

const TABLE = [
  [2, "A","B","B","F","F"], [3, "B","B","C","E","F"], [5, "B","C","C","D","E"],
  [6, "C","D","D","D","D"], [99,"C","D","D","D","D"]
];
const SITE_TYPES = {
  school:    { label: "โรงเรียน",  color: "#7a5af8" },
  hospital:  { label: "โรงพยาบาล", color: "#12b76a" },
  community: { label: "ชุมชน",     color: "#0ba5ec" }
};

const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const INPUTS = ["chem", "rate", "dur", "wind", "dir", "sky"];

chems.forEach(c => {
  const o = document.createElement("option");
  o.value = c.id; o.textContent = c.name; $("chem").appendChild(o);
});

// ---------- สถานะ ----------
let src = { lat: 13.7563, lng: 100.5018 };
let sites = [];
try { sites = JSON.parse(localStorage.getItem("chemzone_sites") || "[]"); } catch (e) {}
let me = null, targets = [], locked = false;
let heat = null, ctxState = null, timer = null;

// ---------- แผนที่ ----------
const map = L.map("map").setView([src.lat, src.lng], 13);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "© OpenStreetMap contributors"
}).addTo(map);
map.createPane("heat");
map.getPane("heat").style.zIndex = 350;
const zoneLayer = L.layerGroup().addTo(map);
const siteLayer = L.layerGroup().addTo(map);
const meLayer = L.layerGroup().addTo(map);
const targetLayer = L.layerGroup().addTo(map);

const toLL = (E, N) => [
  src.lat + N / 111320,
  src.lng + E / (111320 * Math.cos(src.lat * Math.PI / 180))
];

map.on("click", e => {
  const mode = $("mode").value;
  if (mode === "src") {
    if (locked) return;
    src = { lat: e.latlng.lat, lng: e.latlng.lng };
    calculate(true);
  } else if (mode === "point") {
    if (targets.length >= 8) { alert("เลือกจุดประเมินได้สูงสุด 8 จุด ลบบางจุดก่อน"); return; }
    targets.push({ lat: e.latlng.lat, lng: e.latlng.lng, name: "จุด " + (targets.length + 1) });
    calculate(false);
  } else {
    const name = prompt("ชื่อสถานที่ (" + SITE_TYPES[mode].label + ")");
    if (!name) return;
    sites.push({ type: mode, name, lat: e.latlng.lat, lng: e.latlng.lng });
    localStorage.setItem("chemzone_sites", JSON.stringify(sites));
    calculate(false);
  }
});

// ---------- แบบจำลอง ----------
function stability(u, sky) {
  const col = ["d1","d2","d3","n1","n2"].indexOf(sky) + 1;
  for (const row of TABLE) if (u < row[0]) return row[col];
  return "D";
}

function sigma(x, s) {
  const p = {
    A:[.22,.2,0,0], B:[.16,.12,0,0], C:[.11,.08,.0002,.5],
    D:[.08,.06,.0015,.5], E:[.06,.03,.0003,1], F:[.04,.016,.0003,1]
  }[s];
  const sy = p[0] * x / Math.sqrt(1 + 0.0001 * x);
  const sz = p[3] ? p[1] * x / Math.pow(1 + p[2] * x, p[3]) : p[1] * x;
  return [sy, sz];
}

function plume(thr, Q, u, s) {
  let R = 0; const pts = [];
  for (let x = 10; x < 60000; x *= 1.03) {
    const [sy, sz] = sigma(x, s);
    const cc = Q / (Math.PI * u * sy * sz);
    if (cc >= thr) { R = x; pts.push([x, sy * Math.sqrt(2 * Math.log(cc / thr))]); }
  }
  return { R, pts };
}

const fmt = m => m <= 0 ? "ไม่ถึง 10 ม." : m >= 1000 ? (m / 1000).toFixed(2) + " กม." : Math.round(m) + " ม.";
const fmtMin = m => m < 1 ? "ไม่ถึง 1 นาที" : m < 60 ? Math.round(m) + " นาที" : (m / 60).toFixed(1) + " ชม.";
const fmtPpm = p => p < 0.001 ? "<0.001" : p >= 100 ? String(Math.round(p)) : p.toFixed(p < 1 ? 3 : 1);

// ประเมินจุดหนึ่ง: ระยะ ทิศ ความเข้มข้น โซน และเวลาที่ควันมาถึง
function assessAt(p) {
  const S = ctxState;
  if (!S) return null;
  const E = (p.lng - src.lng) * 111320 * Math.cos(src.lat * Math.PI / 180);
  const N = (p.lat - src.lat) * 111320;
  const x = E * S.sf + N * S.cf, y = E * S.cf - N * S.sf;
  let ppm = 0;
  if (x > 10) {
    const [sy, sz] = sigma(x, S.s);
    ppm = S.Q / (Math.PI * S.u * sy * sz) * Math.exp(-y * y / (2 * sy * sy)) / S.k;
  }
  return {
    x, y, ppm,
    dist: Math.hypot(E, N),
    bearing: (Math.atan2(E, N) * 180 / Math.PI + 360) % 360,
    lv: S.zones.find(z => ppm >= z.ppm) || null,
    arrive: x > 10 ? x / S.u / 60 : null    // นาที
  };
}

// ---------- ภาพความเข้มข้น (heatmap) ----------
const STOPS = [[255,245,157],[250,204,21],[247,144,9],[240,68,56],[122,17,17]];
function ramp(t) {
  const p = t * (STOPS.length - 1);
  const i = Math.min(Math.floor(p), STOPS.length - 2), f = p - i;
  return STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f));
}

function drawHeat() {
  if (heat) { map.removeLayer(heat); heat = null; }
  if (!ctxState || !$("showHeat").checked) return;
  const { c, Q, u, s, k, sf, cf, H, dur } = ctxState;
  const T = Number($("tSlider").value);
  const front = u * T * 60;                          // หัวกลุ่มควัน
  const tail = u * Math.max(0, T - dur) * 60;        // ท้ายกลุ่มควัน (หลังหยุดรั่ว)
  const N = 240;
  const cv = document.createElement("canvas");
  cv.width = N; cv.height = N;
  const g = cv.getContext("2d");
  const img = g.createImageData(N, N);
  const lo = Math.log10(c.aegl2 / 30), hi = Math.log10(c.idlh * 10);

  for (let r = 0; r < N; r++) {
    for (let q = 0; q < N; q++) {
      const E = (q / (N - 1) * 2 - 1) * H;
      const Nn = (1 - r / (N - 1) * 2) * H;
      const x = E * sf + Nn * cf;
      const y = E * cf - Nn * sf;
      if (x < 10 || x > front || x < tail) continue;
      const [sy, sz] = sigma(x, s);
      const ppm = Q / (Math.PI * u * sy * sz) * Math.exp(-y * y / (2 * sy * sy)) / k;
      const t = (Math.log10(ppm) - lo) / (hi - lo);
      if (!(t > 0)) continue;
      const tt = Math.min(t, 1);
      const col = ramp(tt);
      let a = Math.min(1, (front - x) / (front * 0.1 + 1));
      if (tail > 0) a *= Math.min(1, (x - tail) / (tail * 0.1 + 1));
      const i = (r * N + q) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2];
      img.data[i + 3] = 255 * (0.35 + 0.55 * tt) * a;
    }
  }
  g.putImageData(img, 0, 0);
  heat = L.imageOverlay(cv.toDataURL(), [toLL(-H, -H), toLL(H, H)], { pane: "heat", interactive: false }).addTo(map);
}

// ---------- การ์ดประเมินจุดที่เลือก ----------
function renderTargets() {
  targetLayer.clearLayers();
  if (!targets.length || !ctxState) { $("targets").innerHTML = ""; return; }
  const S = ctxState, T = Number($("tSlider").value);

  const rows = targets.map((t, i) => {
    const a = assessAt(t);
    const col = a.lv ? a.lv.color : "#12b76a";
    L.marker([t.lat, t.lng], {
      icon: L.divIcon({ className: "", html: `<div class="pin" style="background:${col}">${i + 1}</div>`, iconSize: [26, 26] })
    }).bindTooltip(t.name).addTo(targetLayer);

    let body = `<b>${esc(t.name)}</b> · ห่างแหล่งรั่ว ${fmt(a.dist)} ทิศ ${Math.round(a.bearing)}° <button data-t="${i}">ลบ</button><br>`;

    if (a.x <= 10) {
      body += `<b style="color:#12b76a">อยู่เหนือลมของแหล่งรั่ว</b> ควันไม่พัดมาทางจุดนี้ตามแบบจำลอง`;
    } else if (!a.lv) {
      body += `<b style="color:#12b76a">อยู่นอกโซนอันตราย</b> ความเข้มข้นประมาณ ${fmtPpm(a.ppm)} ppm ต่ำกว่าเกณฑ์เฝ้าระวัง (${fmtPpm(S.zones[2].ppm)} ppm) ` +
              `แต่ควรติดตามหากทิศลมเปลี่ยน`;
    } else {
      const t0 = a.arrive, t1 = a.arrive + S.dur;
      const status = T < t0 ? `ยังไม่ถึง (อีก ${fmtMin(t0 - T)})` : T <= t1 ? "ควันกำลังผ่านจุดนี้" : "ควันผ่านไปแล้ว";
      const durNote = S.dur < 10 ? "รั่วสั้นกว่า 10 นาที ผลจริงอาจเบากว่าเกณฑ์"
                    : S.dur > 60 ? "รับสัมผัสนานกว่า 60 นาที ผลจริงอาจรุนแรงกว่าเกณฑ์ที่ใช้" : "";
      body += `<b style="color:${a.lv.color}">อยู่ใน${esc(a.lv.name)}</b><br>` +
        `⏱ ควันมาถึงใน <b>ประมาณ ${fmtMin(t0)}</b> หลังรั่ว<br>` +
        `⏳ ช่วงรับสัมผัส: นาทีที่ ${Math.round(t0)} ถึง ${Math.round(t1)} (รั่วนาน ${S.dur} นาที)<br>` +
        `🧪 ความเข้มข้นประมาณ <b>${fmtPpm(a.ppm)} ppm</b><br>` +
        `⚠ ผลกระทบ: ${a.lv.effect}<br>` +
        `🕒 ณ นาทีที่ ${T}: ${status}` + (durNote ? `<br><span class="note">${durNote}</span>` : "");
    }
    return `<div class="tgt">${body}</div>`;
  }).join("");

  $("targets").innerHTML = `<div class="card"><h3>ผลประเมินจุดที่เลือก
    <button data-clear="1" style="float:right">ล้างทั้งหมด</button></h3>${rows}
    <p class="note">ผลประเมินอิงเกณฑ์ AEGL/IDLH (ราว 60 นาที) และแบบจำลองอย่างง่าย เวลาที่ควันมาถึงคิดจากความเร็วลมเท่านั้น</p></div>`;
}

// ---------- คำนวณ + แสดงผล ----------
function calculate(fit) {
  try {
    const c = chems.find(x => x.id === $("chem").value);
    const Q = Number($("rate").value) * 1000 / 60;
    const u = Math.max(Number($("wind").value), 0.5);
    const wd = Number($("dir").value) || 0;
    const dur = Math.max(Number($("dur").value) || 1, 1);
    const s = stability(u, $("sky").value);
    const k = c.mw / 24.45 / 1000;

    const zones = [
      { name: "โซนแดง (IDLH)", ppm: c.idlh, color: "#f04438",
        effect: "อันตรายถึงชีวิตหรือบาดเจ็บรุนแรงอย่างรวดเร็ว ต้องอพยพ/หนีทันที ห้ามอยู่ในพื้นที่" },
      { name: "โซนส้ม (AEGL-2)", ppm: c.aegl2, color: "#f79009",
        effect: "ผลกระทบรุนแรงหรือเป็นผลต่อสุขภาพระยะยาว อาจหนีออกจากพื้นที่ไม่ได้ ควรอพยพโดยเร็ว" },
      { name: "โซนเหลือง (เฝ้าระวัง)", ppm: c.aegl2 / 10, color: "#eab308",
        effect: "ระคายเคืองตา/จมูก/คอ รู้สึกไม่สบาย ผลมักหายเมื่อออกจากพื้นที่ กลุ่มเสี่ยง (เด็ก ผู้สูงอายุ ผู้มีโรคทางเดินหายใจ) ควรเฝ้าระวังเป็นพิเศษ" }
    ];
    zones.forEach(z => Object.assign(z, plume(z.ppm * k, Q, u, s)));

    const phi = (wd + 180) * Math.PI / 180, sf = Math.sin(phi), cf = Math.cos(phi);
    const mod = n => ((Math.round(n) % 360) + 360) % 360;
    const showHeat = $("showHeat").checked;
    ctxState = { c, Q, u, s, k, sf, cf, dur, zones, H: Math.max(zones[2].R, zones[1].R, 100) * 1.1 };

    // เส้นขอบโซน
    zoneLayer.clearLayers();
    let bounds = null;
    for (let j = 2; j >= 0; j--) {
      const z = zones[j];
      if (!z.pts.length) continue;
      const left = [], right = [];
      z.pts.forEach(([x, y]) => {
        left.push(toLL(x * sf + y * cf, x * cf - y * sf));
        right.push(toLL(x * sf - y * cf, x * cf + y * sf));
      });
      const poly = L.polygon(left.concat(right.reverse()), {
        color: z.color, weight: 2, dashArray: showHeat ? "4 4" : null, fillOpacity: showHeat ? 0 : 0.4
      }).bindTooltip(z.name + ": " + fmt(z.R)).addTo(zoneLayer);
      if (j === 2) bounds = poly.getBounds();
    }

    let heatErr = "";
    try { drawHeat(); } catch (e) { heatErr = `<div class="card warn">วาดภาพความเข้มข้นไม่ได้: ${esc(e.message)}</div>`; }

    L.circleMarker([src.lat, src.lng], { radius: 7, color: "#000", fillColor: "#fff", fillOpacity: 1 })
      .bindTooltip("แหล่งรั่ว" + (locked ? " (ล็อกแล้ว)" : "")).addTo(zoneLayer);
    const len = Math.max(zones[2].R, 100) * 0.9;
    L.polyline([[src.lat, src.lng], toLL(len * sf, len * cf)], { color: "#0b6bcb", weight: 3, dashArray: "6 6" })
      .bindTooltip("ทิศที่ควันพัดไป").addTo(zoneLayer);
    if (fit) {
      if (bounds) map.fitBounds(bounds.extend([src.lat, src.lng]), { padding: [20, 20] });
      else map.setView([src.lat, src.lng], 16);
    }

    // โรงเรียน/โรงพยาบาล/ชุมชน
    siteLayer.clearLayers();
    const siteRows = sites.map((st, i) => {
      L.circleMarker([st.lat, st.lng], { radius: 8, color: "#fff", weight: 2, fillColor: SITE_TYPES[st.type].color, fillOpacity: 1 })
        .bindTooltip(st.name).addTo(siteLayer);
      const a = assessAt(st);
      const status = a.lv
        ? `<b style="color:${a.lv.color}">อยู่ใน${a.lv.name.split(" ")[0]} · ถึงใน ~${fmtMin(a.arrive)}</b>` : "นอกโซน";
      return `<div class="site"><span>${SITE_TYPES[st.type].label}: ${esc(st.name)}</span><span>${status} <button data-i="${i}">ลบ</button></span></div>`;
    }).join("");
    $("sites").innerHTML = sites.length ? `<div class="card"><h3>จุดสำคัญที่ปักไว้</h3>${siteRows}</div>` : "";

    // ตำแหน่งปัจจุบัน
    meLayer.clearLayers();
    let meHtml = "";
    if (me) {
      L.circle([me.lat, me.lng], { radius: me.acc, color: "#2e90fa", weight: 1, fillOpacity: 0.1 }).addTo(meLayer);
      L.circleMarker([me.lat, me.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2e90fa", fillOpacity: 1 })
        .bindTooltip("ตำแหน่งของคุณ").addTo(meLayer);
      const a = assessAt(me);
      meHtml = `<div class="card"><h3>ตำแหน่งปัจจุบันของคุณ</h3>` +
        (a.lv ? `<b style="color:${a.lv.color}">อยู่ใน${a.lv.name.split(" ")[0]}</b> ควันมาถึงใน ~${fmtMin(a.arrive)}` : "อยู่นอกโซนที่คำนวณ") +
        ` (ความแม่นยำ ±${Math.round(me.acc)} ม.)</div>`;
    }

    renderTargets();

    $("result").innerHTML = heatErr + meHtml +
      `<p>คลาสบรรยากาศ: ${s} · ควันพัดไปทางทิศ ${mod(wd + 180)}°</p>` +
      zones.map(z => `<div class="zone" style="background:${z.color}">${z.name}: <b>${fmt(z.R)}</b></div>`).join("");

    $("info").innerHTML =
      (c.heavy ? `<div class="card warn"><b>ระวัง:</b> สารนี้หนักกว่าอากาศ ลอยต่ำและสะสมในที่ต่ำ แบบจำลองนี้อาจประเมินระยะต่ำกว่าความเป็นจริง</div>` : "") +
      `<div class="card"><h3>${c.name} · CAS ${c.cas}</h3>
        เกณฑ์: AEGL-2 ${c.aegl2} ppm · IDLH ${c.idlh} ppm<br>
        <b>อันตราย:</b> ${c.hazard}<br>
        <b>อุปกรณ์ป้องกัน:</b> ${c.ppe}<br>
        <b>ปฐมพยาบาล:</b> ${c.aid}</div>` +
      `<div class="card"><h3>คำแนะนำการอพยพเบื้องต้น</h3>
        เคลื่อนที่ตั้งฉากกับทิศลม (ไปทิศ ${mod(wd + 90)}° หรือ ${mod(wd + 270)}°) แล้วมุ่งไปทางเหนือลม (ทิศ ${mod(wd)}°)
        หลีกเลี่ยงทางใต้ลม ที่ลุ่มต่ำ และอุโมงค์/ชั้นใต้ดิน ถ้าอพยพไม่ทัน ให้เข้าอาคาร ปิดประตูหน้าต่างและระบบปรับอากาศ</div>`;
  } catch (e) {
    $("result").textContent = "เกิดข้อผิดพลาด: " + e.message;
  }
}

// ---------- ล็อก/ปลดล็อก ----------
function setLock(v) {
  locked = v;
  INPUTS.forEach(id => { $(id).disabled = v; });
  $("lock").textContent = v ? "🔓 ปลดล็อกพื้นที่กระจายสาร" : "🔒 ล็อกพื้นที่กระจายสาร";
  $("lockMsg").textContent = v ? "🔒 ล็อกแล้ว: จุดรั่วและสถานการณ์ถูกตรึงไว้ คลิกแผนที่เพื่อเลือกจุดประเมิน" : "";
  $("mode").querySelector('option[value="src"]').disabled = v;
  if (v) $("mode").value = "point";
  calculate(false);
}
$("lock").addEventListener("click", () => setLock(!locked));

// ---------- ปุ่มและตัวควบคุม ----------
$("sites").addEventListener("click", e => {
  const i = e.target.dataset.i;
  if (i === undefined) return;
  sites.splice(Number(i), 1);
  localStorage.setItem("chemzone_sites", JSON.stringify(sites));
  calculate(false);
});

$("targets").addEventListener("click", e => {
  if (e.target.dataset.clear) targets = [];
  else if (e.target.dataset.t !== undefined) targets.splice(Number(e.target.dataset.t), 1);
  else return;
  targets.forEach((t, i) => { if (/^จุด \d+$/.test(t.name)) t.name = "จุด " + (i + 1); });
  calculate(false);
});

INPUTS.concat("showHeat").forEach(id => $(id).addEventListener("input", () => calculate(true)));

$("tSlider").addEventListener("input", () => {
  $("tLabel").textContent = $("tSlider").value;
  try { drawHeat(); renderTargets(); } catch (e) { $("result").textContent = "เกิดข้อผิดพลาด: " + e.message; }
});

$("play").addEventListener("click", () => {
  const btn = $("play");
  if (timer) { clearInterval(timer); timer = null; btn.textContent = "▶ เล่นภาพการแพร่กระจาย"; return; }
  btn.textContent = "⏸ หยุด";
  $("tSlider").value = 1; $("tLabel").textContent = 1; drawHeat(); renderTargets();
  timer = setInterval(() => {
    const v = Number($("tSlider").value) + 1;
    if (v > Number($("tSlider").max)) { clearInterval(timer); timer = null; btn.textContent = "▶ เล่นภาพการแพร่กระจาย"; return; }
    $("tSlider").value = v; $("tLabel").textContent = v; drawHeat(); renderTargets();
  }, 150);
});

$("locate").addEventListener("click", () => {
  if (!navigator.geolocation) { alert("เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง"); return; }
  const btn = $("locate");
  btn.textContent = "กำลังหาตำแหน่ง...";
  navigator.geolocation.getCurrentPosition(p => {
    me = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
    btn.textContent = "📍 ใช้ตำแหน่งปัจจุบัน";
    if ($("useAsSrc").checked && !locked) { src = { lat: me.lat, lng: me.lng }; calculate(true); }
    else { calculate(false); map.setView([me.lat, me.lng], 15); }
  }, err => {
    btn.textContent = "📍 ใช้ตำแหน่งปัจจุบัน";
    alert("หาตำแหน่งไม่ได้: " + err.message);
  }, { enableHighAccuracy: true, timeout: 15000 });
});

calculate(true);