#!/usr/bin/env python3
"""
autopush.py – Met à jour le dépôt Git courant
Usage :
  python autopush.py "Mon message de commit"
  (sinon : "MàJ auto – YYYY-MM-DD HH:MM:SS")
"""
import subprocess, sys
from datetime import datetime

def run(cmd: str, cwd: str) -> None:
    """Exécute `cmd` dans `cwd`; n’arrête que sur vraie erreur."""
    print(f"\n➡️  {cmd}")
    res = subprocess.run(
        cmd, shell=True, cwd=cwd, text=True, encoding="utf-8",
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    )
    if res.stdout:
        print(res.stdout.strip())

    if res.returncode and "nothing to commit" not in (res.stdout or ""):
        sys.exit(f"❌  Échec : {cmd}")

def main() -> None:
    # 1) Trouve la racine du dépôt
    try:
        git_root = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], text=True
        ).strip()
    except subprocess.CalledProcessError:
        sys.exit("❌  Ce dossier n’est pas un dépôt Git.")
    print(f"📁  Dépôt détecté : {git_root}")

    # 2) Message de commit
    message = " ".join(sys.argv[1:]) if len(sys.argv) > 1 \
              else datetime.now().strftime("MàJ auto – %Y-%m-%d %H:%M:%S")

    # 3) Pipeline Git
    for cmd in (
        "git add --all",
        f'git commit -m "{message}"',
        "git push",
    ):
        run(cmd, git_root)

    print("\n✅  Dépôt à jour sur GitHub !")

if __name__ == "__main__":
    main()
