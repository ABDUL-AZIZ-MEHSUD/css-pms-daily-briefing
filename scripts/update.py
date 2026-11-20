
import logging
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent

SCRIPTS = [
    "fetch_articles.py",
    "analyse_articles.py"
]

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)


def run_script(script_name):

    script_path = ROOT / "scripts" / script_name

    logging.info("=" * 50)
    logging.info("Running: %s", script_name)
    logging.info("=" * 50)

    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=ROOT
    )

    if result.returncode != 0:
        logging.error(
            "Script failed: %s",
            script_name
        )
        return False

    logging.info(
        "Completed successfully: %s",
        script_name
    )

    return True


def main():

    logging.info("CSS/PMS DAILY BRIEFING")
    logging.info("Starting complete update pipeline")

    for script in SCRIPTS:

        if not run_script(script):
            logging.error(
                "Pipeline stopped due to an error."
            )
            sys.exit(1)

    logging.info("=" * 50)
    logging.info("DAILY UPDATE COMPLETED")
    logging.info("=" * 50)


if __name__ == "__main__":
    main()
