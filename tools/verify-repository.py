"""Check distributable artifacts and local documentation links without touching inputs."""
from pathlib import Path
import csv
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
errors = []
markdown = [ROOT / name for name in ['README.md', 'README.en.md', 'CONTRIBUTING.md', 'CHANGELOG.md']]
for directory in ['docs', 'hardware', 'firmware', 'diagrams', 'bom']:
    markdown.extend(path for path in (ROOT / directory).rglob('*.md') if '.pio' not in path.parts)
for document in markdown:
    text = re.sub(r'```.*?```', '', document.read_text(encoding='utf-8'), flags=re.S)
    for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)', text):
        if target.startswith(('http:', 'https:', 'mailto:', '#')):
            continue
        candidate = document.parent / unquote(target.split('#', 1)[0])
        if not candidate.exists():
            errors.append(f'Missing link: {document.relative_to(ROOT)} -> {target}')

svg_files = list((ROOT / 'diagrams').glob('*.svg'))
if len(svg_files) != 11:
    errors.append('Expected eleven concept SVGs')
for svg in svg_files:
    try:
        if ET.parse(svg).getroot().tag != '{http://www.w3.org/2000/svg}svg':
            errors.append(f'Not SVG: {svg.name}')
    except ET.ParseError:
        errors.append(f'Malformed SVG: {svg.name}')

with (ROOT / 'bom/bom.csv').open(encoding='utf-8-sig', newline='') as stream:
    items = list(csv.DictReader(stream))
if len(items) != 35:
    errors.append('Unexpected baseline BOM row count; update the declared source and review coverage')
for item in items:
    if item['Preço mín BRL'] or item['Preço máx BRL'] or item['Data cotação'] or item['URL cotação']:
        errors.append(f'Baseline unverified quotation unexpectedly populated: {item["ID"]}')
    if not item['Busca ML (não anúncio)'].startswith('https://lista.mercadolivre.com.br/'):
        errors.append(f'Search URL is not identified as a Mercado Livre search: {item["ID"]}')
with zipfile.ZipFile(ROOT / 'bom/gaia-rewinder-bom.xlsx') as workbook:
    if workbook.testzip() is not None:
        errors.append('XLSX ZIP integrity failure')
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    sheets = ET.fromstring(workbook.read('xl/workbook.xml')).findall('s:sheets/s:sheet', ns)
    if [sheet.attrib['name'] for sheet in sheets] != ['Resumo', 'Itens']:
        errors.append('Unexpected workbook sheet structure')
    for entry in workbook.namelist():
        if entry.startswith('xl/worksheets/sheet') and entry.endswith('.xml'):
            if ET.fromstring(workbook.read(entry)).findall('.//s:c[@t="e"]', ns):
                errors.append(f'Cached spreadsheet errors: {entry}')
for artifact in ['hardware/cad/rewinder.scad', 'hardware/cad/base-concept.stl', 'hardware/cad/lite-concept.csg',
                 'hardware/cad/smart-concept.csg', 'images/demo-dashboard.png', 'images/demo-mobile.png']:
    path = ROOT / artifact
    if not path.is_file() or path.stat().st_size == 0:
        errors.append(f'Missing/empty deliverable: {artifact}')
print(json.dumps({'markdown_files': len(markdown), 'svg_files': len(svg_files), 'bom_rows': len(items), 'errors': errors}, indent=2))
raise SystemExit(bool(errors))
