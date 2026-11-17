#!/usr/bin/env python3
import csv
import json

# Load PDRB provinsi 17 kategori (handle BOM)
pdrb_data = []
with open('pdrb_provinsi_17_kategori.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        pdrb_data.append(row)

# Load PDB nasional
pdb_data = []
with open('pdb_nasional_lapangan_usaha.csv', encoding='utf-8-sig') as f:

    reader = csv.DictReader(f)
    for row in reader:
        pdb_data.append(row)

# Extract provinsi list dengan PDRB total (2024, konstan 2010)
provinsi_list = []
for row in pdrb_data:
    if (row['lapangan_usaha'] == 'Produk Domestik Regional Bruto' and
        row['jenis_harga'] == 'Harga Konstan 2010' and
        row['tahun'] == '2024'):
        provinsi_list.append({
            'nama': row['provinsi'],
            'pdrb': float(row['nilai']),
            'satuan': row['satuan']
        })

# Sort by PDRB descending
provinsi_list.sort(key=lambda x: x['pdrb'], reverse=True)

# Extract 17 sektor per provinsi
provinsi_detail = {}
for prov in provinsi_list:
    nama_prov = prov['nama']
    sektor_list = []
    
    for row in pdrb_data:
        if (row['provinsi'] == nama_prov and
            row['lapangan_usaha'] != 'Produk Domestik Regional Bruto' and
            row['jenis_harga'] == 'Harga Konstan 2010' and
            row['tahun'] == '2024'):
            sektor_list.append({
                'sektor': row['lapangan_usaha'],
                'nilai': float(row['nilai'])
            })
    
    provinsi_detail[nama_prov] = {
        'pdrb_total': prov['pdrb'],
        'sektor': sektor_list
    }

# Extract PDB nasional 17 sektor (bold tag marks main category)
pdb_nasional = []
for row in pdb_data:
    if (row['jenis_harga'] == 'Harga Konstan 2010' and
        row['tahun'] == '2024' and
        '<b>' in row['kategori']):
        # Main category only
        kategori_clean = row['kategori'].replace('<b>', '').replace('</b>', '').strip()
        pdb_nasional.append({
            'sektor': kategori_clean,
            'nilai': float(row['nilai'])
        })

# Map 17 sektor canonical names
sektor_mapping = {}
for row in pdrb_data:
    if row['lapangan_usaha'] != 'Produk Domestik Regional Bruto':
        sektor_mapping[row['lapangan_usaha']] = row['lapangan_usaha']

sektor_names = sorted(set(sektor_mapping.values()))

# Write JSON output
output = {
    'provinsi_summary': provinsi_list,
    'provinsi_detail': provinsi_detail,
    'pdb_nasional': pdb_nasional,
    'sektor_names': sektor_names,
    'metadata': {
        'tahun': 2024,
        'jenis_harga': 'Harga Konstan 2010',
        'satuan': 'Milyar Rupiah',
        'jumlah_provinsi': len(provinsi_list),
        'jumlah_sektor': len(sektor_names)
    }
}

with open('data/economic_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✓ Data processed: {len(provinsi_list)} provinsi, {len(sektor_names)} sektor")
print(f"✓ Top 5 provinsi by PDRB:")
for i, p in enumerate(provinsi_list[:5], 1):
    print(f"  {i}. {p['nama']}: {p['pdrb']:,.2f} M")
