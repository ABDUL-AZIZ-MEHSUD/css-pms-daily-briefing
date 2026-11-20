
import json
import hashlib
import logging
import re
import calendar
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

import feedparser
import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent.parent
FEEDS_FILE = ROOT / "feeds.json"
OUTPUT_FILE = ROOT / "data" / "articles-inbox.json"

USER_AGENT = "CSS-PMS-Daily-Briefing/1.0"

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)


def clean_text(value):
    if not value:
        return ""

    soup = BeautifulSoup(value, "html.parser")
    text = soup.get_text(" ", strip=True)

    return re.sub(r"\s+", " ", text).strip()


def get_published_date(entry):

    for field in ("published", "updated", "created"):
        value = entry.get(field)

        if value:
            try:
                date = parsedate_to_datetime(value)

                if date.tzinfo is None:
                    date = date.replace(tzinfo=timezone.utc)

                return date.astimezone(
                    timezone.utc
                ).isoformat()

            except (ValueError, TypeError, OverflowError):
                pass

    for field in ("published_parsed", "updated_parsed"):
        value = entry.get(field)

        if value:
            try:
                date = datetime.fromtimestamp(
                    calendar.timegm(value),
                    tz=timezone.utc
                )

                return date.isoformat()

            except (ValueError, TypeError, OverflowError):
                pass

    return None


def make_article_id(url):
    return hashlib.sha256(
        url.strip().rstrip("/").encode("utf-8")
    ).hexdigest()[:16]


def load_json(path, default):

    if not path.exists():
        return default

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)

    except (json.JSONDecodeError, OSError) as error:
        logging.warning("Could not read %s: %s", path.name, error)
        return default


def fetch_feed(feed):

    name = feed.get("name", "Unknown")
    url = feed.get("url", "")
    limit = int(feed.get("max", 10))

    logging.info("Checking: %s", name)

    if not url.startswith(("https://", "http://")):
        logging.error("Invalid URL for %s", name)
        return []

    try:
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=25
        )

        response.raise_for_status()

        parsed = feedparser.parse(response.content)

        if not parsed.entries:
            logging.warning("No entries found: %s", name)
            return []

        articles = []

        for entry in parsed.entries[:limit]:

            title = clean_text(entry.get("title", ""))
            link = entry.get("link", "").strip()

            if not title or not link:
                continue

            if not link.startswith(("https://", "http://")):
                continue

            description = clean_text(
                entry.get("summary", "")
            )

            if not description:
                contents = entry.get("content", [])

                if contents:
                    description = clean_text(
                        contents[0].get("value", "")
                    )

            articles.append({
                "id": make_article_id(link),
                "title": title,
                "source": name,
                "category": feed.get(
                    "category", "Editorial"
                ),
                "url": link,
                "published": get_published_date(entry),
                "author": clean_text(
                    entry.get("author", "")
                ),
                "rss_summary": description[:1200],
                "collection_status": "collected",
                "analysis_status": "pending",
                "collected_at": datetime.now(
                    timezone.utc
                ).isoformat()
            })

        logging.info(
            "%s: %s entries collected",
            name,
            len(articles)
        )

        return articles

    except requests.RequestException as error:
        logging.error("Network error for %s: %s", name, error)
        return []

    except Exception as error:
        logging.error("Error for %s: %s", name, error)
        return []


def main():

    logging.info("Starting CSS/PMS RSS collector")

    config = load_json(FEEDS_FILE, {})
    feeds = config.get("feeds", [])

    if not feeds:
        logging.error("No feeds configured")
        return

    # Collect each newspaper separately.

    feed_batches = []

    for feed in feeds:
        feed_batches.append(fetch_feed(feed))

    # Round-robin selection.

    all_articles = []

    max_rounds = max(
        (len(batch) for batch in feed_batches),
        default=0
    )

    for index in range(max_rounds):
        for batch in feed_batches:
            if index < len(batch):
                all_articles.append(batch[index])

    # Remove duplicates.

    unique_articles = {}

    for article in all_articles:
        unique_articles[article["id"]] = article

    all_articles = list(unique_articles.values())

    # Apply daily limit.

    max_articles = int(
        config.get("max_new_articles", 6)
    )

    all_articles = all_articles[:max_articles]

    # Load previous inbox.

    existing_data = load_json(
        OUTPUT_FILE,
        {"articles": []}
    )

    existing_articles = existing_data.get(
        "articles", []
    )

    existing_ids = {
        article.get("id")
        for article in existing_articles
    }

    # Add only genuinely new articles.

    new_articles = [
        article
        for article in all_articles
        if article["id"] not in existing_ids
    ]

    combined = new_articles + existing_articles
    combined = combined[:1000]

    # Save output.

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    output = {
        "last_updated": datetime.now(
            timezone.utc
        ).isoformat(),
        "total_articles": len(combined),
        "new_articles_today": len(new_articles),
        "articles": combined
    }

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output,
            file,
            ensure_ascii=False,
            indent=2
        )

    logging.info("--------------------------------")
    logging.info("Collection completed")
    logging.info("Feeds checked: %s", len(feeds))
    logging.info("New articles: %s", len(new_articles))
    logging.info("Total inbox articles: %s", len(combined))
    logging.info("Output: %s", OUTPUT_FILE)
    logging.info("--------------------------------")


if __name__ == "__main__":
    main()
