#!/usr/bin/env python3
import json
import re

# Proyeksi planar ekuirektangular
def project(lon, lat):
    x = (lon - 95) * 21.645
    y = (6.2 - lat) * 21.645
    return x, y

def norm(s):
    s = (s or '').upper()
    s = re.sub(r'[^A-Z0-9 ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    s = s.replace('DAERAH ISTIMEWA', 'DI').replace('DAERAH KHUSUS IBUKOTA', 'DKI')
    s = s.replace('KEPULAUAN', 'KEP').replace('KEP ', 'KEP ')
    return s.replace(' ', '')

NAME_KEYS = ['PROVINSI', 'Provinsi', 'provinsi', 'PROPINSI', 'Propinsi',
             'NAME_1', 'name', 'NAME', 'state', 'WADMPR']
CODE_KEYS = ['KODE_PROV', 'kode_prov', 'KODE', 'kode', 'ID', 'id', 'kode_provinsi']

def pick(props, keys, default):
    for k in keys:
        if k in props and props[k] not in (None, ''):
            return props[k]
    return default

def fmt_ring(ring):
    pts = []
    for c in ring:
        x, y = project(c[0], c[1])
        pts.append(f'{x:.1f},{y:.1f}')
    return ' '.join(pts)

with open('data/economic_data.json', 'r', encoding='utf-8') as f:
    econ = json.load(f)

pdrb_map = {norm(p['nama']): p['pdrb'] for p in econ['provinsi_summary']}

with open('data/indonesia-38-provinces.geojson', 'r', encoding='utf-8') as f:
    geojson = json.load(f)

print('Contoh properti GeoJSON:', geojson['features'][0].get('properties'))

provinsi, unmatched = [], []
for feature in geojson['features']:
    props = feature.get('properties', {}) or {}
    nama = str(pick(props, NAME_KEYS, 'Unknown'))
    kode = str(pick(props, CODE_KEYS, '00'))

    geom = feature.get('geometry') or {}
    gtype = geom.get('type', '')
    coords = geom.get('coordinates', [])

    # polygons: list of [outer, hole1, hole2, ...]
    if gtype == 'Polygon':
        polys = [coords]
    elif gtype == 'MultiPolygon':
        polys = coords
    else:
        polys = []

    polygons = [[fmt_ring(r) for r in poly if len(r) >= 3] for poly in polys if poly]
    polygons = [p for p in polygons if p]
    if not polygons:
        continue

    key = norm(nama)
    if key not in pdrb_map:
        unmatched.append(nama)

    provinsi.append({
        'nama': nama,
        'kode': kode,
        'polygons': polygons,                    # dipakai provinceMesh.js (dengan hole)
        'rings': [p[0] for p in polygons],       # kompatibel dengan versi lama (outer saja)
        'pdrb': {'2024_konstan': pdrb_map.get(key, 0)}
    })

econ['provinsi'] = provinsi
with open('data/economic_data.json', 'w', encoding='utf-8') as f:
    json.dump(econ, f, ensure_ascii=False, indent=2)

print(f'✓ Processed {len(provinsi)} provinces')
if unmatched:
    print(f'⚠ {len(unmatched)} nama tidak cocok dengan CSV (pdrb=0):')
    for n in unmatched:
        print('  -', n)
    print('  Nama di CSV:', sorted(p['nama'] for p in econ['provinsi_summary']))
