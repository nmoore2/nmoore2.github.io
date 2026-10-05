#!/usr/bin/env python3
"""Build the static Insights section for GitHub Pages from the reviewed article source."""
import json
import re
from datetime import date
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://nmoore.net'
POSTS = json.loads((ROOT / 'insights/posts.json').read_text())
assert len(POSTS) == 10, 'This release contains ten reviewed articles.'
SLUGS = {p['slug'] for p in POSTS}
assert len(SLUGS) == len(POSTS), 'Article slugs must be unique.'
for post in POSTS:
    assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', post['slug'])
    assert post['datePublished'] == '2026-10-05', 'Use the actual release date.'
    assert set(post['relatedSlugs']).issubset(SLUGS)

def e(text):
    return escape(str(text), quote=True)

def short_date(value):
    d = date.fromisoformat(value)
    return d.strftime('%B') + ' ' + str(d.day) + ', ' + str(d.year)

def anchor(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

def shell(title, description, route, body, schema=None):
    canonical = BASE + route
    head = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="{'article' if schema else 'website'}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{BASE}/insights/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#20382b"><link rel="alternate" type="application/rss+xml" title="Nathan Moore — Insights" href="/feed.xml"><link rel="stylesheet" href="/insights/insights.css">'''
    if schema:
        head += '<meta property="article:published_time" content="'+e(schema['datePublished'])+'"><script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    head += '</head><body><a class="skip" href="#main">Skip to content</a><div class="wrap"><header class="site-nav"><a href="/" class="brand">Nathan Moore<span></span></a><nav aria-label="Main"><a href="/#portfolio">Work</a><a href="/insights/" aria-current="page">Insights</a></nav><a class="nav-contact" href="mailto:nate@nmoore.net">Let’s talk ↗</a></header>'
    footer = '''</div><section class="contact-band"><div><h2>A website on your mind?</h2><p>I help lean B2B marketing teams design, build, and improve their websites. Tell me what needs to move forward.</p></div><a href="mailto:nate@nmoore.net">Discuss your website ↗</a></section><footer class="wrap"><span>© 2026 Nathan Moore</span><a href="/feed.xml">RSS feed</a><a href="https://www.linkedin.com/in/nateisgreat/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></footer></body></html>'''
    return head + body + footer

for post in POSTS:
    slug = post['slug']
    route = '/insights/' + slug + '/'
    section_ids = [anchor(s['heading']) for s in post['sections']]
    assert len(set(section_ids)) == len(section_ids)
    toc = ''.join(f'<li><a href="#{sid}">{e(s["heading"])}</a></li>' for sid,s in zip(section_ids,post['sections']))
    sections = ''.join(f'<section id="{sid}"><h2>{e(s["heading"])}</h2>{s["bodyHtml"]}</section>' for sid,s in zip(section_ids,post['sections']))
    source_html = ''.join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener noreferrer">{e(s["title"])}</a></li>' for s in post['sources'])
    source_section = '<section class="sources"><h2>Sources and further reading</h2><ol>'+source_html+'</ol></section>' if source_html else ''
    related = [next(p for p in POSTS if p['slug'] == rs) for rs in post['relatedSlugs']]
    related_html = ''.join(f'<a href="/insights/{p["slug"]}/"><span>{e(p["category"])}</span>{e(p["title"])} ↗</a>' for p in related)
    body = f'''<main id="main"><div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/insights/">Insights</a><span>/</span><span>{e(post['category'])}</span></div><article><header class="article-head"><p class="eyebrow">{e(post['category'])}</p><h1>{e(post['title'])}</h1><div class="article-meta"><a href="/#about">By Nathan Moore</a><time datetime="{post['datePublished']}">{short_date(post['datePublished'])}</time><span>{post['readMinutes']} min read</span></div><p class="article-intro">{e(post['intro'])}</p></header><div class="article-layout"><aside class="toc" aria-label="In this article"><p>IN THIS ARTICLE</p><ol>{toc}</ol></aside><div class="article-body">{sections}<div class="takeaway"><p class="eyebrow">THE PRACTICAL TAKEAWAY</p><p>{e(post['takeaway'])}</p></div>{source_section}<div class="author"><img src="/assets/nate-medellin.jpg" alt="Nathan Moore" width="65" height="65" loading="lazy"><div><h2>Nathan Moore</h2><p>Colorado-based web designer and developer. Building websites since 2014, with a focus on thoughtful interactions and practical support for marketing teams.</p></div></div><p class="editorial-note">Prepared with AI-assisted research and drafting. Examples are illustrative unless identified otherwise. External factual claims link to their sources.</p></div></div></article><section class="related"><h2>Keep exploring.</h2><div class="related-grid">{related_html}</div></section></main>'''
    schema = {'@context':'https://schema.org','@type':'BlogPosting','headline':post['title'],'description':post['description'],'datePublished':post['datePublished'],'dateModified':post['datePublished'],'author':{'@type':'Person','name':'Nathan Moore','url':BASE+'/#about'},'publisher':{'@type':'Person','name':'Nathan Moore','url':BASE+'/'},'mainEntityOfPage':{'@type':'WebPage','@id':BASE+route},'image':BASE+'/insights/social-card.png','inLanguage':'en-US'}
    folder = ROOT / 'insights' / slug
    folder.mkdir(exist_ok=True)
    (folder/'index.html').write_text(shell(post['title']+' | Nathan Moore',post['description'],route,body,schema))

cards = ''.join(f'''<article class="post-card" id="{p['slug']}"><div class="card-meta"><span>{e(p['category']).upper()}</span><span>{short_date(p['datePublished'])} · {p['readMinutes']} MIN</span></div><h2><a href="/insights/{p['slug']}/">{e(p['title'])}</a></h2><p>{e(p['description'])}</p><a class="read-link" href="/insights/{p['slug']}/">Read the article ↗</a></article>''' for p in POSTS)
index = '''<main id="main"><section class="index-hero"><div><p class="eyebrow">NOTES FOR LEAN MARKETING TEAMS</p><h1>Better websites.<br><em>Clearer decisions.</em></h1></div><p>Practical notes on the creative, technical, and very human work of getting a website right.</p></section><nav class="topics" aria-label="Start with a topic"><a href="#b2b-website-agency-contractor-in-house">Choosing a partner</a><a href="#b2b-website-project-brief">Planning a launch</a><a href="#interactive-product-demos">Design & interaction</a><a href="#b2b-seo-ai-search-priorities">Search & measurement</a></nav><div class="post-grid">'''+cards+'''</div><p class="index-note">For marketing leaders who want to understand the work, ask better questions, and make the next website decision with confidence.</p></main>'''
(ROOT/'insights/index.html').write_text(shell('Website design, development & marketing insights | Nathan Moore','Practical guides for B2B marketing leaders: website projects, interactive product stories, SEO, lead capture, measurement, and ongoing website support.','/insights/',index))

ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
urlset = ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')
for route in ['/','/insights/'] + ['/insights/'+p['slug']+'/' for p in POSTS]:
    url = ET.SubElement(urlset,'url'); ET.SubElement(url,'loc').text=BASE+route
    ET.SubElement(url,'lastmod').text='2026-10-05'
ET.ElementTree(urlset).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://nmoore.net/sitemap.xml\n')
rss=ET.Element('rss',version='2.0');channel=ET.SubElement(rss,'channel')
for key,value in [('title','Nathan Moore — Insights'),('link',BASE+'/insights/'),('description','Practical website notes for lean B2B marketing teams.'),('language','en-us')]:ET.SubElement(channel,key).text=value
for p in POSTS:
    item=ET.SubElement(channel,'item')
    for key,value in [('title',p['title']),('link',BASE+'/insights/'+p['slug']+'/'),('guid',BASE+'/insights/'+p['slug']+'/'),('description',p['description'])]:ET.SubElement(item,key).text=value
ET.ElementTree(rss).write(ROOT/'feed.xml',encoding='utf-8',xml_declaration=True)
print(f'Built {len(POSTS)} articles, index, sitemap, robots.txt, and RSS feed.')
