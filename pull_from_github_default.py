#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, subprocess, sys

# ====== PARAMÈTRES PAR DÉFAUT ======
DEFAULT_REPO = "https://github.com/ninocaussefeuillet/bertrand_causse_site.git" #ça copie les fichiers hébergés à l'adresse du site.
DEFAULT_DIR = os.getcwd() # ça va prendre depuis GitHub les fichiers, et écraser les fichiers du dossier dans lequel est contenu ce programme python.
# ===================================

def run(cmd):
    print("$", " ".join(cmd))
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    print(proc.stdout.rstrip())
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)

def ensure_git_available():
    try:
        subprocess.run(["git", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except Exception:
        print("Erreur: 'git' n'est pas installé ou n'est pas dans le PATH.")
        raise SystemExit(1)

def is_git_repo(path):
    return os.path.isdir(os.path.join(path, ".git"))

def clone_repo(repo, dest):
    print(f"Clonage du dépôt {repo} (branche par défaut) dans {dest}...")
    run(["git", "clone", repo, dest])

def pull_ff_only(path):
    run(["git", "-C", path, "fetch", "origin"])
    run(["git", "-C", path, "pull", "--ff-only"])

def main():
    ensure_git_available()

    # Si on passe des arguments, ils remplacent les valeurs par défaut
    repo = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_REPO
    dest = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.abspath(DEFAULT_DIR)

    if not os.path.exists(dest):
        os.makedirs(dest, exist_ok=True)

    if not is_git_repo(dest):
        if len(os.listdir(dest)) == 0:
            clone_repo(repo, dest)
        else:
            print(f"Erreur: {dest} existe mais n'est pas un dépôt Git. Videz ce dossier ou choisissez un autre dossier.")
            raise SystemExit(2)

    pull_ff_only(dest)
    print("\n✅ Synchronisation terminée en mode fast-forward only (branche par défaut).")

if __name__ == "__main__":
    main()

