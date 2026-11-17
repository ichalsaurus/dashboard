// MAIN APP - Peta Ekonomi Indonesia (Three.js)
// Isi: setup scene, peta 3D 38 provinsi, interaksi, dan panel analisis sidebar.

import * as THREE from 'three';
import { SECTOR_DIORAMAS } from './dioramas.js';
import { buildProvince, mapBounds } from './provinceMesh.js';

// ============ KONSTANTA ============
const PDRB_KEY = '2024_konstan';
const MAX_HEIGHT = 100;   // tinggi (satuan dunia) untuk provinsi PDRB terbesar
const MIN_HEIGHT = 1.2;

const ORBIT_AWAL = { az: -0.35, el: THREE.MathUtils.degToRad(50), zoom: 1 };
const EL_MIN = THREE.MathUtils.degToRad(14);
const EL_MAX = THREE.MathUtils.degToRad(86);

// Nama di peta (GeoJSON) vs nama di provinsi_detail (BPS) kadang beda
const ALIAS_NAMA = {
  'Daerah Istimewa Yogyakarta': 'DI Yogyakarta',
  'Kepulauan Riau': 'Kep. Riau',
  'Kepulauan Bangka Belitung': 'Kep. Bangka Belitung',
};

const nf1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ============ STATE ============
const state = {
  economicData: null,
  provinces: [],
  byName: new Map(),
  scene: null,
  camera: null,
  renderer: null,
  container: null,
  mapRoot: null,
  mapBox: new THREE.Box3(),
  mapCenter: new THREE.Vector3(),
  frustum: new THREE.Vector2(1, 1),
  orbit: { ...ORBIT_AWAL },
  dist: 3200,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  pointerPx: new THREE.Vector2(),
  hovered: null,
  selected: null,
  dragging: false,
  dragMoved: 0,
  last: new THREE.Vector2(),
  tooltipEl: null,
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  initScene();
  initUI();
  animate();
});

async function initData() {
  try {
    const res = await fetch('data/economic_data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.economicData = await res.json();
    return true;
  } catch (err) {
    console.error('Gagal memuat data:', err);
    showStatus(
      'Data gagal dimuat. Jalankan folder ini lewat server lokal, misalnya:<br>' +
      '<code>python -m http.server 8000</code><br>lalu buka <code>http://localhost:8000</code>.',
      true
    );
    return false;
  }
}

function showStatus(html, isError = false) {
  const el = document.getElementById('map-status');
  if (!el) return;
  el.innerHTML = html;
  el.hidden = false;
  el.classList.toggle('error', isError);
}

function hideStatus() {
  const el = document.getElementById('map-status');
  if (el) el.hidden = true;
}

// ============ SCENE ============
function initScene() {
  const container = document.getElementById('canvas-container');
  state.container = container;

  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);

  state.scene = new THREE.Scene();
  state.scene.background = null; // gradien dari CSS

  state.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 9000);
  state.camera.up.set(0, 1, 0);

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setSize(width, height);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(state.renderer.domElement);

  // ---- Cahaya ----
  state.scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x0a0e27, 1.6));

  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-620, 900, 520);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -900, right: 900, top: 900, bottom: -900, near: 10, far: 4000,
  });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.8;
  state.scene.add(sun);
  state.scene.add(sun.target);

  // Lantai penangkap bayangan
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ opacity: 0.34 })
  );
  floor.position.y = -0.6;
  floor.receiveShadow = true;
  state.scene.add(floor);

  create3DMap();

  // ---- Event ----
  window.addEventListener('resize', onWindowResize);
  if (window.ResizeObserver) {
    new ResizeObserver(() => onWindowResize()).observe(container);
  }

  const dom = state.renderer.domElement;
  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('pointercancel', () => { state.dragging = false; });
  dom.addEventListener('pointerleave', () => {
    if (state.dragging) return;
    setHovered(null);
    if (state.tooltipEl) state.tooltipEl.hidden = true;
  });
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', (e) => e.preventDefault());

  document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullscreen);
  document.getElementById('reset-view-btn')?.addEventListener('click', resetView);
  document.addEventListener('fullscreenchange', () => setTimeout(onWindowResize, 60));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSelection(); });

  initTooltip();
}

function initTooltip() {
  if (!state.container) return;
  const el = document.createElement('div');
  el.className = 'map-tooltip';
  el.hidden = true;
  state.container.appendChild(el);
  state.tooltipEl = el;
}

// ============ PETA 3D ============
function create3DMap() {
  const data = state.economicData;
  if (!data || !Array.isArray(data.provinsi) || !data.provinsi.length) return;

  const bounds = mapBounds(data.provinsi);
  const center = [bounds.cx, bounds.cy];
  const maxPdrb = Math.max(...data.provinsi.map((p) => Number(p.pdrb?.[PDRB_KEY] ?? 0)));
  const urut = data.provinsi
    .slice()
    .sort((a, b) => Number(b.pdrb?.[PDRB_KEY] ?? 0) - Number(a.pdrb?.[PDRB_KEY] ?? 0))
    .map((p) => p.nama);

  const root = new THREE.Group();
  root.name = 'peta-indonesia';
  state.mapRoot = root;
  state.scene.add(root);

  for (const prov of data.provinsi) {
    const value = Number(prov.pdrb?.[PDRB_KEY] ?? 0);
    const t = maxPdrb > 0 ? value / maxPdrb : 0;

    // Warna: biru-indigo (kecil) -> cyan (besar)
    const color = new THREE.Color(0x2b3f8f).lerp(new THREE.Color(0x22d3ee), Math.pow(t, 0.42));

    const group = buildProvince(prov, {
      center,
      maxPdrb,
      maxHeight: MAX_HEIGHT,
      minHeight: MIN_HEIGHT,
      color,
      pdrbKey: PDRB_KEY,
    });

    root.add(group);

    const rec = {
      nama: prov.nama,
      group,
      material: group.userData.material,
      value,
      height: group.userData.height,
      rank: urut.indexOf(prov.nama) + 1,
      baseColor: color.clone(),
      lift: 0,
      emissive: new THREE.Color(0x000000),
      emissiveTarget: new THREE.Color(0x000000),
    };
    state.provinces.push(rec);
    state.byName.set(prov.nama, rec);
  }

  root.updateMatrixWorld(true);
  state.mapBox.setFromObject(root);
  state.mapBox.getCenter(state.mapCenter);

  updateCamera();
  hideStatus();
  updateSummaryStats();

  // Tampilkan tooltip + hover nama saat pertama kali
  console.info('Peta siap:', state.provinces.length, 'provinsi');
}

// ============ KAMERA ============
function updateCamera() {
  const { az, el } = state.orbit;
  const target = state.mapCenter;
  const cp = Math.cos(el);
  const d = state.dist;

  state.camera.position.set(
    target.x + Math.sin(az) * cp * d,
    target.y + Math.sin(el) * d,
    target.z + Math.cos(az) * cp * d
  );
  state.camera.up.set(0, 1, 0);
  state.camera.lookAt(target);
  state.camera.updateMatrixWorld(true);

  // Hitung luas yang dibutuhkan: proyeksikan 8 sudut bounding box ke ruang kamera
  const inv = new THREE.Matrix4().copy(state.camera.matrixWorld).invert();
  const b = state.mapBox;
  const v = new THREE.Vector3();
  let mx = 0, my = 0;

  for (let i = 0; i < 8; i++) {
    v.set(
      i & 1 ? b.max.x : b.min.x,
      i & 2 ? b.max.y : b.min.y,
      i & 4 ? b.max.z : b.min.z
    ).applyMatrix4(inv);
    mx = Math.max(mx, Math.abs(v.x));
    my = Math.max(my, Math.abs(v.y));
  }

  state.frustum.set(Math.max(mx * 1.1, 1), Math.max(my * 1.1, 1));
  applyFrustum();
}

function applyFrustum() {
  const container = state.container;
  if (!container || !state.camera) return;

  const w = Math.max(1, container.clientWidth);
  const h = Math.max(1, container.clientHeight);
  const aspect = w / h;

  let hw = state.frustum.x;
  let hh = state.frustum.y;
  if (hw / hh < aspect) hw = hh * aspect;
  else hh = hw / aspect;

  const cam = state.camera;
  cam.left = -hw;
  cam.right = hw;
  cam.top = hh;
  cam.bottom = -hh;
  cam.zoom = state.orbit.zoom;
  cam.near = 1;
  cam.far = 9000;
  cam.updateProjectionMatrix();
}

function onWindowResize() {
  const container = state.container;
  if (!container || !state.renderer) return;
  const w = Math.max(1, container.clientWidth);
  const h = Math.max(1, container.clientHeight);
  state.renderer.setSize(w, h);
  applyFrustum();
}

function resetView() {
  state.orbit = { ...ORBIT_AWAL };
  updateCamera();
}

// ============ INTERAKSI PETA ============
function pointerToNDC(event) {
  const dom = state.renderer.domElement;
  const rect = dom.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.pointerPx.set(event.clientX - rect.left, event.clientY - rect.top);
}

function pickProvince(event) {
  pointerToNDC(event);
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hits = state.raycaster.intersectObjects(state.provinces.map((p) => p.group), true);
  for (const hit of hits) {
    const nama = hit.object.userData?.nama || hit.object.parent?.userData?.nama;
    if (nama && state.byName.has(nama)) return state.byName.get(nama);
  }
  return null;
}

function onPointerDown(event) {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  state.dragging = true;
  state.dragMoved = 0;
  state.last.set(event.clientX, event.clientY);
  try { state.renderer.domElement.setPointerCapture(event.pointerId); } catch (e) { /* noop */ }
  state.renderer.domElement.style.cursor = 'grabbing';
}

function onPointerMove(event) {
  if (state.dragging) {
    const dx = event.clientX - state.last.x;
    const dy = event.clientY - state.last.y;
    state.last.set(event.clientX, event.clientY);
    state.dragMoved += Math.abs(dx) + Math.abs(dy);
    if (state.dragMoved > 4) {
      state.orbit.az -= dx * 0.005;
      state.orbit.el = Math.min(EL_MAX, Math.max(EL_MIN, state.orbit.el + dy * 0.004));
      updateCamera();
      if (state.tooltipEl) state.tooltipEl.hidden = true;
    }
    return;
  }

  const rec = pickProvince(event);
  setHovered(rec);

  const dom = state.renderer.domElement;
  dom.style.cursor = rec ? 'pointer' : 'grab';

  const tip = state.tooltipEl;
  if (tip) {
    if (!rec) {
      tip.hidden = true;
    } else {
      tip.hidden = false;
      tip.innerHTML =
        `<span class="tip-nama">${rec.nama}</span>` +
        `<span class="tip-nilai">Rp ${nf1.format(rec.value / 1000)} T</span>` +
        `<span class="tip-rank">#${rec.rank} dari ${state.provinces.length}</span>`;
      tip.style.left = state.pointerPx.x + 'px';
      tip.style.top = state.pointerPx.y + 'px';
    }
  }
}

function onPointerUp(event) {
  if (!state.dragging) return;
  state.dragging = false;
  state.renderer.domElement.style.cursor = 'grab';
  try { state.renderer.domElement.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }

  if (state.dragMoved > 6) return; // itu drag, bukan klik

  const rec = pickProvince(event);
  if (rec) selectProvince(rec);
  else clearSelection();
}

function onWheel(event) {
  event.preventDefault();
  const factor = Math.exp(-event.deltaY * 0.0012);
  state.orbit.zoom = Math.min(6, Math.max(0.7, state.orbit.zoom * factor));
  applyFrustum();
  if (state.tooltipEl) state.tooltipEl.hidden = true;
}

function setHovered(rec) {
  if (state.hovered === rec) return;

  if (state.hovered && state.hovered !== state.selected) {
    state.hovered.emissiveTarget.setHex(0x000000);
  }
  state.hovered = rec;

  if (rec && rec !== state.selected) {
    rec.emissiveTarget.setHex(0x123f6b);
  }
}

function selectProvince(rec) {
  if (state.selected === rec) return;

  if (state.selected) {
    state.selected.emissiveTarget.setHex(0x000000);
  }
  state.selected = rec;
  rec.emissiveTarget.setHex(0x0b5a78);

  showProvinceDetail(rec.nama);
}

function clearSelection() {
  if (state.selected) {
    state.selected.emissiveTarget.setHex(0x000000);
    state.selected = null;
  }
  showMapOverview();
}

// ============ UI SIDEBAR ============
function initUI() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tabName = e.currentTarget.dataset.tab;
      document.getElementById(`tab-${tabName}`)?.classList.add('active');
    });
  });

  document.getElementById('back-btn')?.addEventListener('click', () => {
    state.selected = null;
    state.provinces.forEach((p) => p.emissiveTarget.setHex(0x000000));
    showMapOverview();
  });

  document.getElementById('back-from-sector-btn')?.addEventListener('click', () => {
    showMapOverview();
  });

  document.querySelectorAll('.perspective-btn[data-perspective]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      showPerspectiveAnalysis(e.currentTarget.dataset.perspective);
    });
  });

  updateSummaryStats();
}

function findDetail(nama) {
  const detail = state.economicData?.provinsi_detail;
  if (!detail) return null;
  return detail[nama] || detail[ALIAS_NAMA[nama]] || null;
}

function updateSummaryStats() {
  const data = state.economicData;
  if (!data) return;

  const summary = data.provinsi_summary || [];
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('richest-province', summary[0]?.nama || '-');

  const total = summary.reduce((s, p) => s + Number(p.pdrb || 0), 0);
  set('total-pdrb', total ? `Rp ${nf1.format(total / 1000)} T` : '-');

  const avg = summary.length ? total / summary.length : 0;
  set('avg-pdrb', avg ? `Rp ${nf1.format(avg / 1000)} T` : '-');

  const utama = nationalSectors().slice().sort((a, b) => b.nilai - a.nilai)[0];
  set('main-sector', utama ? utama.nama : '-');
}

function showMapOverview() {
  document.getElementById('map-overview')?.classList.remove('hidden');
  document.getElementById('province-detail')?.classList.add('hidden');
  document.getElementById('sector-diorama')?.classList.add('hidden');
}

function showProvinceDetail(provinsiNama) {
  const data = state.economicData;
  if (!data) return;

  const detail = findDetail(provinsiNama);
  const rec = state.byName.get(provinsiNama);
  if (!detail) {
    console.warn('Detail provinsi tidak ditemukan untuk', provinsiNama);
    return;
  }

  const totalNasional = (data.provinsi_summary || []).reduce((s, p) => s + Number(p.pdrb || 0), 0);
  const porsi = totalNasional ? (Number(detail.pdrb_total) / totalNasional) * 100 : 0;
  const sektor = Array.isArray(detail.sektor) ? detail.sektor : [];
  const terbesar = sektor.slice().sort((a, b) => b.nilai - a.nilai)[0];

  const html = `
    <div class="province-header">
      <div class="province-name">${provinsiNama}</div>
      <div class="province-stats">
        <div class="province-stat">
          <div class="province-stat-label">PDRB Total</div>
          <div class="province-stat-value">Rp ${nf1.format(Number(detail.pdrb_total) / 1000)} T</div>
        </div>
        <div class="province-stat">
          <div class="province-stat-label">Porsi Nasional</div>
          <div class="province-stat-value">${nf2.format(porsi)}%</div>
        </div>
      </div>
      ${rec ? `<div class="province-note">Peringkat #${rec.rank} Â· tinggi batang ${nf1.format(rec.height)} satuan</div>` : ''}
    </div>

    <div>
      <h3>17 Lapangan Usaha</h3>
      <div class="sector-list">
        ${sektor.map((s) => `
          <div class="sector-item">
            <span class="sector-name">${s.sektor}</span>
            <span class="sector-value">Rp ${nf1.format(Number(s.nilai) / 1000)} T</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${terbesar ? `<div class="province-insight">Sektor terbesar: <b>${terbesar.sektor}</b></div>` : ''}

    <button class="perspective-btn" id="explore-sectors-btn" style="margin-top: 4px;">
      <span class="perspective-icon">ðŸŽª</span>
      <span class="perspective-name">Lihat Diorama Sektor</span>
      <span class="perspective-desc">Visualisasi 17 lapangan usaha</span>
    </button>
  `;

  const info = document.getElementById('province-info');
  if (!info) return;
  info.innerHTML = html;
  document.getElementById('explore-sectors-btn')?.addEventListener('click', () => {
    showSectorDioramas(provinsiNama);
  });

  document.getElementById('map-overview')?.classList.add('hidden');
  document.getElementById('province-detail')?.classList.remove('hidden');
  document.getElementById('sector-diorama')?.classList.add('hidden');
}

// Nama sektor di data BPS beda dengan kunci di dioramas.js -> cocokkan lewat huruf kategori
let dioramaByLetter = null;
function dioramaInfo(label) {
  if (SECTOR_DIORAMAS[label]) return SECTOR_DIORAMAS[label];

  if (!dioramaByLetter) {
    dioramaByLetter = {};
    for (const key of Object.keys(SECTOR_DIORAMAS)) {
      const letter = key.trim().charAt(0).toUpperCase();
      if (!dioramaByLetter[letter]) dioramaByLetter[letter] = SECTOR_DIORAMAS[key];
    }
  }

  const letter = sectorPrefix(label).split(',')[0];
  return dioramaByLetter[letter] || null;
}

function showSectorDioramas(provinsiNama) {
  const detail = findDetail(provinsiNama);
  if (!detail) return;

  const sektor = (detail.sektor || []).slice().sort((a, b) => b.nilai - a.nilai);
  const html = sektor.map((s) => {
    const info = dioramaInfo(s.sektor);
    return `
      <div class="diorama-item">
        <div class="diorama-name">${info?.name || s.sektor}</div>
        <div class="diorama-desc">Rp ${nf1.format(Number(s.nilai) / 1000)} T</div>
      </div>
    `;
  }).join('');

  const box = document.getElementById('diorama-container');
  if (box) box.innerHTML = html;

  document.getElementById('province-detail')?.classList.add('hidden');
  document.getElementById('sector-diorama')?.classList.remove('hidden');
  document.getElementById('map-overview')?.classList.add('hidden');
}

// ---- Panel 5 perspektif ----
function nationalSectors() {
  if (state._nationalSectors) return state._nationalSectors;

  const rows = state.economicData?.pdb_nasional || [];
  const seen = new Set();
  const out = [];

  for (const row of rows) {
    const teks = String(row.sektor || '').trim();
    const m = /^([A-Z](?:,[A-Z])*)\./.exec(teks);
    if (!m) continue;
    const prefix = m[1];
    const nama = teks.slice(m[0].length).trim();
    if (!nama || nama === nama.toUpperCase()) continue; // baris agregat (PDB, pajak, dst)
    if (seen.has(prefix)) continue;
    seen.add(prefix);
    out.push({ prefix, nama, nilai: Number(row.nilai) || 0 });
  }

  state._nationalSectors = out;
  return out;
}

function sectorPrefix(label) {
  const m = /^([A-Z](?:,[A-Z])*)/.exec(String(label || '').trim());
  return m ? m[1] : '';
}

function barRow(label, pct, teks) {
  const w = Math.max(0, Math.min(100, pct));
  return `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <span class="bar-track"><i style="width:${w.toFixed(1)}%"></i></span>
      <span class="bar-value">${teks}</span>
    </div>
  `;
}

function showPerspectiveAnalysis(perspective) {
  const box = document.getElementById('perspective-result');
  if (!box) return;

  if (!state.economicData) {
    box.innerHTML = '<p class="muted">Data belum termuat.</p>';
    return;
  }

  if (perspective === 'composition') {
    const nat = nationalSectors().slice().sort((a, b) => b.nilai - a.nilai);
    const total = nat.reduce((s, x) => s + x.nilai, 0) || 1;
    box.innerHTML = `
      <h3 class="perspective-title">Porsi sektor terhadap PDB nasional</h3>
      ${nat.map((s) => barRow(s.nama, (s.nilai / total) * 100, nf1.format((s.nilai / total) * 100) + '%')).join('')}
      <p class="muted">Total 17 lapangan usaha: Rp ${nf1.format(total / 1000)} T</p>
    `;
    return;
  }

  if (perspective === 'specialization') {
    const nama = state.selected?.nama || 'DKI Jakarta';
    const detail = findDetail(nama);
    const nat = nationalSectors();
    if (!detail || !nat.length) {
      box.innerHTML = `<p class="muted">Detail ${nama} belum tersedia.</p>`;
      return;
    }
    const natTotal = nat.reduce((s, x) => s + x.nilai, 0) || 1;
    const provTotal = Number(detail.pdrb_total) || 1;
    const rows = (detail.sektor || []).map((s) => {
      const n = nat.find((x) => x.prefix === sectorPrefix(s.sektor));
      const lq = n ? (Number(s.nilai) / provTotal) / (n.nilai / natTotal) : 0;
      return { label: n?.nama || s.sektor, lq };
    }).sort((a, b) => b.lq - a.lq);

    const maks = Math.max(1.5, ...rows.map((r) => r.lq));
    box.innerHTML = `
      <h3 class="perspective-title">Spesialisasi ${nama}</h3>
      <p class="muted">Location Quotient: porsi sektor di provinsi dibanding porsinya di PDB nasional. LQ &gt; 1 = lebih menonjol.</p>
      ${rows.map((r) => barRow(r.label, (r.lq / maks) * 100, 'LQ ' + nf2.format(r.lq))).join('')}
    `;
    return;
  }

  const judul = {
    growth: 'Pertumbuhan riil',
    contribution: 'Sumber pertumbuhan',
    deflator: 'Kenaikan harga (deflator)',
  }[perspective] || perspective;

  box.innerHTML = `
    <h3 class="perspective-title">${judul}</h3>
    <p class="muted">Dataset ini hanya berisi satu tahun (2024, harga konstan 2010), jadi ${judul.toLowerCase()} belum bisa dihitung.
    Butuh data 2023/2024 (dan harga berlaku) untuk menghitung pertumbuhan, sumber pertumbuhan, dan deflator.</p>
  `;
}

// ============ FULLSCREEN ============
function toggleFullscreen() {
  const container = document.getElementById('canvas-container');
  if (!document.fullscreenElement) {
    container?.requestFullscreen?.().catch((err) => console.error(err));
  } else {
    document.exitFullscreen?.();
  }
}

// ============ ANIMATION LOOP ============
function animate() {
  requestAnimationFrame(animate);
  if (!state.renderer || !state.scene || !state.camera) return;

  // Animasi angkat provinsi terpilih + fade warna sorotan
  for (const rec of state.provinces) {
    const targetLift = rec === state.selected ? 14 : 0;
    rec.lift += (targetLift - rec.lift) * 0.16;
    if (Math.abs(rec.lift - targetLift) < 0.05) rec.lift = targetLift;
    rec.group.position.y = rec.lift;

    rec.emissive.lerp(rec.emissiveTarget, 0.18);
    rec.material.emissive.copy(rec.emissive);
  }

  state.renderer.render(state.scene, state.camera);
}

// Handle untuk pengujian manual di console
window.__peta = state;
