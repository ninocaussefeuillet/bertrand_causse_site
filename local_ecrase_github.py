#!/usr/bin/env python3
"""
autopush.py – Met à jour le dépôt Git courant (pull --rebase + push)
Usage :
  python autopush.py "Mon message de commit"
  (sinon : "MàJ auto – YYYY-MM-DD HH:MM:SS")
"""
import subprocess, sys
from datetime import datetime

def sh(cmd: list[str], cwd: str, check: bool = True) -> str:
    """Exécute une commande et renvoie stdout. Lève en cas d'erreur si check=True."""
    res = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    out = (res.stdout or "") + (res.stderr or "")
    print(f"\n➡️  {' '.join(cmd)}\n{out.strip()}")
    if check and res.returncode != 0:
        raise SystemExit(f"❌  Échec : {' '.join(cmd)}")
    return out

def main() -> None:
    # 1) Racine du dépôt
    try:
        git_root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
    except subprocess.CalledProcessError:
        sys.exit("❌  Ce dossier n’est pas un dépôt Git.")
    print(f"📁  Dépôt détecté : {git_root}")

    # 2) Branche courante
    branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True).strip()

    # 3) Message de commit
    message = " ".join(sys.argv[1:]) if len(sys.argv) > 1 \
              else datetime.now().strftime("MàJ auto – %Y-%m-%d %H:%M:%S")

    # 4) Commit local (sans planter si rien à committer)
    sh(["git", "add", "--all"], git_root)
    out = sh(["git", "commit", "-m", message], git_root, check=False)
    if "nothing to commit" in out.lower():
        print("ℹ️  Rien à committer, on continue.")

    # 5) Se mettre à jour avant de pousser
    #    - récupère l’historique complet (utile pour les dates, rebase propre)
    sh(["git", "fetch", "origin"], git_root)
    #    - rebase par-dessus les commits distants (et stash auto si besoin)
    sh(["git", "pull", "--rebase", "--autostash", "origin", branch], git_root)

    # 6) Pousser (et définir l’upstream si nécessaire la 1re fois)
    #    - détecte si une upstream est déjà configurée
    upstream_ok = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
        cwd=git_root, text=True, capture_output=True
    ).returncode == 0

    if upstream_ok:
        sh(["git", "push"], git_root)
    else:
        sh(["git", "push", "-u", "origin", branch], git_root)

    print("\n✅  Dépôt à jour sur GitHub !")

if __name__ == "__main__":
    main()
