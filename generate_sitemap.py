#!/usr/bin/env python3
# Génère sitemap.xml en utilisant la date du dernier commit Git de chaque page.
from pathlib import Path
import subprocess, html, datetime, os

# Ton domaine canonique :
BASE = os.environ.get("SITE_BASE", "https://bertrandcausse.com")

# Répertoires/fichiers à ignorer (adapte si besoin)
EXCLUDE_DIRS = {"node_modules", ".git", ".github", "assets", "static", "images", "img", "css", "js"}
EXCLUDE_FILES = {"404.html"}  # la page 404 n'a pas vocation à être indexée
INCLUDE_EXTS = {".html"}      # ajoute ".htm" si tu en utilises

def is_page(p: Path) -> bool:
    if p.suffix.lower() not in INCLUDE_EXTS:
        return False
    if any(part in EXCLUDE_DIRS for part in p.parts):
        return False
    if p.name in EXCLUDE_FILES:
        return False
    return True

def last_commit_iso(p: Path) -> str:
    """Renvoie la date ISO 8601 du dernier commit qui touche le fichier."""
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--format=%cI", "--", str(p)], text=True
        ).strip()
        return out or datetime.date.today().isoformat()
    except subprocess.CalledProcessError:
        return datetime.date.today().isoformat()

def to_url(p: Path) -> str:
    """Transforme chemin local -> URL canonique.
       /dir/index.html => /dir/ ; /file.html => /file.html
    """
    rel = p.as_posix()
    if rel.endswith("index.html"):
        rel = rel[:-10]  # retire 'index.html'
    if not rel.startswith("/"):
        rel = "/" + rel
    return BASE + rel

pages = sorted([p for p in Path(".").rglob("*") if is_page(p)])

items = []
for p in pages:
    items.append(
        "  <url>\n"
        f"    <loc>{html.escape(to_url(p))}</loc>\n"
        f"    <lastmod>{last_commit_iso(p)}</lastmod>\n"
        "  </url>"
    )

xml = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "\n".join(items)
    + "\n</urlset>\n"
)

Path("sitemap.xml").write_text(xml, encoding="utf-8")
print(f"✅ sitemap.xml écrit ({len(items)} URL).")
