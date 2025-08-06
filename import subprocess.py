#!/usr/bin/env python3
"""
autopush.py – Met à jour le dépôt Git courant
Usage :
    python autopush.py "Mon message de commit"
Si aucun message n’est passé, on génère :
    "MàJ auto – YYYY-MM-DD HH:MM:SS"
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path

"""run() joue le rôle d’un wrapper sécurisé :
Log la commande qu’il exécute.
Capture et affiche toutes les sorties.
Coupe court dès qu’une commande retourne une erreur, pour éviter d’enchaîner des opérations incohérentes."""

def run(cmd: str) -> None:
    """Exécute une commande shell ; quitte si code ≠ 0."""
    print(f"\n➡️  {cmd}")
    result = subprocess.run(
        cmd, shell=True, text=True,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        sys.exit(f"❌  Échec : {cmd}")

def main() -> None:
    # 1) Vérifie qu’on est dans un dépôt Git
    try:
        git_root = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            text=True
        ).strip()
    except subprocess.CalledProcessError:
        sys.exit("❌  Ce dossier n’est pas un dépôt Git.")

    print(f"📁  Dépôt détecté : {git_root}")

    # 2) Construis le message de commit
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    else:
        message = datetime.now().strftime("MàJ auto – %Y-%m-%d %H:%M:%S")

    # 3) Liste des commandes
    commands = [
        "git add --all",               # indexe tout
        f'git commit -m "{message}"',  # commit
        "git push"                     # push sur la branche suivie
    ]

    for cmd in commands:
        run(cmd)

    print("\n✅  Dépôt à jour sur GitHub !")

if __name__ == "__main__":
    main()
