// Membuat mesh 3D provinsi dari polygon hasil preprocess_geojson.py
// Koordinat peta dipusatkan ke titik (0,0,0) supaya mudah dikamera & di-orbit.
import * as THREE from 'three';

// String "x,y x,y ..." -> array Vector2.
// Sumbu Y data mengarah ke bawah (koordinat layar), jadi dibalik agar
// setelah extrude + rotateX(-90°) arah utara tetap benar.
export function parseRing(str) {
  if (typeof str !== 'string' || !str.trim()) return [];
  const out = [];
  for (const tok of str.trim().split(/\s+/)) {
    const [x, y] = tok.split(',').map(Number);
    if (Number.isFinite(x) && Number.isFinite(y)) out.push(new THREE.Vector2(x, -y));
  }
  return out;
}

// Normalisasi struktur data: selalu array of polygon, tiap polygon = [outer, ...holes]
export function getPolygons(prov) {
  if (prov.__polys) return prov.__polys;

  const out = [];
  if (Array.isArray(prov.polygons) && prov.polygons.length) {
    for (const poly of prov.polygons) {
      if (!Array.isArray(poly)) continue;
      const rings = poly.map(parseRing).filter((r) => r.length >= 3);
      if (rings.length) out.push(rings);
    }
  } else if (Array.isArray(prov.rings)) {
    for (const r of prov.rings) {
      const pts = parseRing(r);
      if (pts.length >= 3) out.push([pts]);
    }
  }

  prov.__polys = out;
  return out;
}

// Batas & titik tengah seluruh peta (dipakai untuk memusatkan geometri + kamera)
export function mapBounds(provinsiList) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const prov of provinsiList) {
    for (const poly of getPolygons(prov)) {
      for (const ring of poly) {
        for (const p of ring) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (-p.y < minY) minY = -p.y; // p.y sudah dibalik
          if (-p.y > maxY) maxY = -p.y;
        }
      }
    }
  }

  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 0, maxY: 0, cx: 0, cy: 0 };

  return {
    minX, maxX, minY, maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

// Bangun satu provinsi: extrude tiap polygon, alas di y=0, tinggi sesuai PDRB.
export function buildProvince(prov, opts = {}) {
  const {
    center = [500, 190],
    maxPdrb = 1,
    maxHeight = 100,
    minHeight = 1.2,
    color = 0x4f8cff,
    pdrbKey = '2024_konstan',
  } = opts;

  const group = new THREE.Group();
  group.name = prov.nama;

  const value = Number(prov.pdrb?.[pdrbKey] ?? 0);
  const ratio = maxPdrb > 0 ? value / maxPdrb : 0;
  const height = Math.max(ratio * maxHeight, minHeight);

  // Satu material per provinsi supaya hover/select tidak menular ke provinsi lain
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.05,
    emissive: 0x000000,
    emissiveIntensity: 1,
  });

  const polys = getPolygons(prov);
  let meshCount = 0;

  for (const rings of polys) {
    const toShapePoint = (p) => new THREE.Vector2(p.x - center[0], p.y + center[1]);

    const shape = new THREE.Shape(rings[0].map(toShapePoint));
    for (let i = 1; i < rings.length; i++) {
      shape.holes.push(new THREE.Path(rings[i].map(toShapePoint)));
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });
    // Extrude awalnya ke sumbu +Z; putar agar tumbuh ke +Y (alas di y = 0)
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.nama = prov.nama;      // dibaca oleh raycaster
    mesh.userData.provinsi = prov.nama;  // kompatibilitas
    group.add(mesh);
    meshCount++;
  }

  group.userData.nama = prov.nama;
  group.userData.provinsi = prov.nama;
  group.userData.value = value;
  group.userData.height = height;
  group.userData.material = material;
  group.userData.meshCount = meshCount;

  return group;
}
