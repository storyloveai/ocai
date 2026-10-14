"""Build independent, local templates from read-only browser DOM evidence."""
from pathlib import Path
from lxml import html
import base64, hashlib, json, re, urllib.request, concurrent.futures

BASE = Path(__file__).resolve().parents[2]
OUT = BASE / 'dist' / 'assets'
templates, urls, cards, characters, feature_map, overlays = {}, {}, {}, {}, {}, ''
inputs = [(page, Path(__file__).parent / f'reference-{page}-root.html') for page in ['home','detail','search','character']]
inputs += [('/'+p.name.removesuffix('-root.html').replace('-', '/', 1), p) for p in Path(__file__).parent.glob('story-*-root.html')]
inputs += [('/'+p.name.removesuffix('-root.html').replace('-', '/', 1), p) for p in Path(__file__).parent.glob('character-*-root.html')]
for page, input_file in inputs:
    root = html.fromstring(input_file.read_text())
    # Keep the independently rendered page, excluding original consent portals.
    shell = root[0]
    content = shell[0]
    if page == 'home':
        overlays = ''.join(html.tostring(e,encoding='unicode') for e in list(shell)[1:])
    for sibling in list(shell)[1:]:
        shell.remove(sibling)
    root.set('id', 'reference-root')
    for e in root.iter():
        for attr in ['aria-hidden', 'data-aria-hidden', 'inert']:
            e.attrib.pop(attr, None)
        if e.get('role') == 'tooltip':
            e.attrib.pop('id', None)
        if e.tag in ['script', 'iframe']:
            e.getparent().remove(e)
    for img in root.xpath('.//img'):
        src = img.get('src', '')
        img.attrib.pop('srcset', None)
        img.attrib.pop('sizes', None)
        img.attrib.pop('crossorigin', None)
        if src.startswith('https://'):
            width = 400 if page == 'detail' or page.startswith('/') or 'fetchpriority' in img.attrib else 200
            origin = src.split('/https://')[-1]
            if not origin.startswith('https://'): origin = 'https://' + origin
            if 'image.static.ooc.ai' in origin:
                download = f'https://image-gen.static.ooc.ai/cdn-cgi/image/width={width},quality=75,format=webp/{origin}'
            else: download = src
            key = hashlib.sha256(download.encode()).hexdigest()[:20]
            urls[key] = download
            img.set('data-asset', key)
            # A correct original asset remains the fallback if a public CDN rejects downloads.
            img.set('src', src)
    for a in root.xpath('.//a[starts-with(@href,"/story/")]'):
        name = a.xpath('.//*[@data-name="true"]')
        image = a.xpath('.//img[@alt]')
        if not name or not image: continue
        sid = a.get('href').split('/')[-1]
        meta = a.xpath('.//p[contains(@class,"text-gray-1")]')
        text = meta[-1].text_content() if meta else ''
        plays, _, author = text.partition(' · ')
        cards[sid] = {'id':sid, 'title':name[0].text_content(), 'author':author,
                     'plays':plays, 'genre':'Others', 'original':bool(a.xpath('.//img[@alt="ORIGINAL"]')),
                     'image':image[0].get('src'), 'asset':image[0].get('data-asset')}
    if page in ['home', 'character']:
        h1 = root.xpath('.//h1')
        if h1:
            desktop = h1[0].getparent().getparent().getparent().getparent().getparent()
            desktop.set('data-hero-desktop', '')
            for button in desktop.xpath('.//button'):
                button.set('data-ref-step', '-1' if 'Previous slide' in button.text_content() else '1')
            panels = root.xpath('.//h2[contains(@class,"text-white")]/..')
            slides = []
            for panel in panels:
                title = panel.xpath('./h2')[0].text_content()
                image = panel.getparent().xpath('.//img')
                link = panel.xpath('ancestor::a[1]') or panel.xpath('.//a')
                desc = panel.xpath('./p')
                slides.append({'title':title, 'description':desc[0].text_content() if desc else '',
                               'href':link[0].get('href') if link else '/',
                               'image':image[0].get('src') if image else '',
                               'asset':image[0].get('data-asset') if image else None})
            feature_map[page] = slides
    if page == 'character':
        for a in root.xpath('.//a[starts-with(@href,"/character/")]'):
            name=a.xpath('.//p[contains(@class,"text-primary")]'); image=a.xpath('.//img[@alt]')
            if not name or not image: continue
            sid=a.get('href').split('/')[-1]; ps=a.xpath('.//p')
            author=ps[-1].text_content() if ps else ''
            description=ps[1].text_content() if len(ps)>1 else ''
            characters[sid]={'id':sid,'title':name[0].text_content(),'author':author,'description':description,'plays':'','genre':'Others','type':'character','original':False,'image':image[0].get('src'),'asset':image[0].get('data-asset')}
    for a in root.xpath('.//a[starts-with(@href,"https://") or starts-with(@href,"mailto:")]'):
        a.set('target', '_blank'); a.set('rel', 'noopener noreferrer')
    result = html.tostring(root, encoding='unicode')
    # HTML parsers lowercase SVG names; restore names required by the SVG DOM.
    for old, new in [('viewbox','viewBox'), ('clippath','clipPath'), ('preserveaspectratio','preserveAspectRatio'), ('lineargradient','linearGradient'), ('gradientunits','gradientUnits')]:
        result = re.sub(r'(?<=[< /])'+old+r'(?=[ =>])',new,result)
    templates[page] = result

(OUT/'reference-pages.json').write_text(json.dumps({'pages':templates, 'overlays':overlays, 'features':feature_map['home'], 'characterFeatures':feature_map['character'], 'catalog':list(cards.values()),'characters':list(characters.values())},ensure_ascii=False,separators=(',',':')))

def download(item):
    key, url = item
    try:
        req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=20) as r: blob=r.read()
        if len(blob)<100: raise ValueError('empty image')
        return key, 'data:image/webp;base64,'+base64.b64encode(blob).decode()
    except Exception as exc:
        return key, None

assets=json.loads((OUT/'catalog-assets.json').read_text()) if (OUT/'catalog-assets.json').exists() else {}; failed=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    for key, value in pool.map(download, [(k,v)for k,v in urls.items() if k not in assets]):
        if value: assets[key]=value
        else: failed.append({'key':key,'url':urls[key]})
(OUT/'catalog-assets.json').write_text(json.dumps(assets,separators=(',',':')))
core_keys={d['asset']for d in list(cards.values())[:20]}
core_keys.update(d['asset']for slides in feature_map.values() for d in slides)
(OUT/'core-assets.json').write_text(json.dumps({k:assets[k]for k in core_keys if k in assets},separators=(',',':')))
(Path(__file__).parent/'asset-report.json').write_text(json.dumps({'downloaded':len(assets),'failed':failed,'sources':urls},indent=2))
print(json.dumps({'templates':len(templates),'catalog':len(cards),'characters':len(characters),'features':len(feature_map['home']),'assets':len(assets),'failed':len(failed),'assetBytes':(OUT/'catalog-assets.json').stat().st_size}))
