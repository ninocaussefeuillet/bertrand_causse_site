#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, subprocess, sys

DEFAULT_REPO = "https://github.com/ninocaussefeuillet/bertrand_causse_site.git"  # <-- Remplace par ton URL
# Si tu préfères, passe l'URL en 1er argument: python pull_overwrite_tracked.py https://github.com/user/repo.git [dossier]

def run(cmd):
    print("$", " ".join(cmd))
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8")
    print(proc.stdout.rstrip())
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)

def git_available():
    try:
        subprocess.run(["git", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception:
        return False

def ensure_repo_initialized(dest, repo_url):
    # Initialise un dépôt Git dans 'dest' si besoin, et configure 'origin' vers repo_url
    if not os.path.isdir(os.path.join(dest, ".git")):
        run(["git", "-C", dest, "init"])
    # Configure (ou met à jour) le remote 'origin'
    # Vérifie si 'origin' existe déjà
    proc = subprocess.run(["git", "-C", dest, "remote"], stdout=subprocess.PIPE, text=True)
    remotes = proc.stdout.strip().splitlines()
    if "origin" in remotes:
        run(["git", "-C", dest, "remote", "set-url", "origin", repo_url])
    else:
        run(["git", "-C", dest, "remote", "add", "origin", repo_url])

def get_default_remote_branch(dest):
    # Essaie de détecter la branche par défaut de origin (ex: origin/main)
    # Fallback: main
    try:
        proc = subprocess.run(
            ["git", "-C", dest, "symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, check=True
        )
        ref = proc.stdout.strip()  # ex: "origin/main"
        if "/" in ref:
            return ref.split("/", 1)[1]
    except Exception:
        pass
    # Autre tentative: origin/HEAD -> show-ref
    try:
        proc = subprocess.run(
            ["git", "-C", dest, "rev-parse", "--abbrev-ref", "origin/HEAD"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, check=True
        )
        ref = proc.stdout.strip()  # ex: "origin/main"
        if "/" in ref:
            return ref.split("/", 1)[1]
    except Exception:
        pass
    return "main"

def hard_reset_tracked_only(dest, branch):
    # Met à jour les fichiers suivis pour qu'ils correspondent exactement à origin/branch
    run(["git", "-C", dest, "fetch", "origin"])

    # 🔍 Liste des fichiers suivis dans origin/branch
    proc_tracked = subprocess.run(
        ["git", "-C", dest, "ls-tree", "-r", "--name-only", f"origin/{branch}"],
        stdout=subprocess.PIPE, text=True
    )
    tracked_files = set(proc_tracked.stdout.strip().splitlines())

    # 🔍 Liste des fichiers non suivis
    proc_untracked = subprocess.run(
        ["git", "-C", dest, "ls-files", "--others", "--exclude-standard"],
        stdout=subprocess.PIPE, text=True
    )
    untracked_files = set(proc_untracked.stdout.strip().splitlines())

    # ⚠️ Supprime uniquement les fichiers non suivis qui sont en conflit
    conflicted = tracked_files & untracked_files
    for path in conflicted:
        full_path = os.path.join(dest, path)
        if os.path.isfile(full_path):
            print(f"🗑️ Suppression du fichier en conflit : {path}")
            os.remove(full_path)
        elif os.path.isdir(full_path):
            print(f"🗑️ Suppression du dossier en conflit : {path}")
            subprocess.run(["rm", "-rf", full_path], shell=True)

    # Crée/réinitialise la branche locale pour suivre origin/branch
    run(["git", "-C", dest, "checkout", "-B", branch, f"origin/{branch}"])

    # Ecrase les fichiers suivis localement avec ceux d'origin/branch
    run(["git", "-C", dest, "reset", "--hard", f"origin/{branch}"])

def main():
    if not git_available():
        print("Erreur: 'git' n'est pas installé ou introuvable dans le PATH.")
        sys.exit(1)

    repo_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_REPO
    dest = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.getcwd()

    if not os.path.isdir(dest):
        os.makedirs(dest, exist_ok=True)

    # Initialiser/relier le dossier courant au dépôt distant sans supprimer les fichiers locaux
    ensure_repo_initialized(dest, repo_url)

    # Récupère infos et détermine la branche par défaut de origin
    run(["git", "-C", dest, "fetch", "origin"])
    branch = get_default_remote_branch(dest)

    # Aligne les fichiers suivis sur la branche distante (sans 'git clean')
    hard_reset_tracked_only(dest, branch)

    print("\n✅ Terminé : fichiers suivis alignés sur 'origin/{}' (les fichiers non suivis ont été conservés).".format(branch))
    print("Dossier synchronisé :", dest)

if __name__ == "__main__":
    main()
