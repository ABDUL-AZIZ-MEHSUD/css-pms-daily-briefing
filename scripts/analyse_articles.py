
import json
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from openai import OpenAI


# ================================================
# CONFIGURATION
# ================================================

ROOT = Path(__file__).resolve().parent.parent

INBOX_FILE = ROOT / "data" / "articles-inbox.json"
OUTPUT_FILE = ROOT / "data" / "articles.json"

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
MAX_ANALYSES = int(os.getenv("MAX_ANALYSES", "1"))

MINIMUM_TEXT_LENGTH = 800

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)

client = OpenAI()


# ================================================
# JSON FUNCTIONS
# ================================================

def load_json(path, default):

    if not path.exists():
        return default

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)

    except (json.JSONDecodeError, OSError):
        return default


def save_json(path, data):

    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )


# ================================================
# ARTICLE EXTRACTION
# ================================================

def extract_article_text(url):

    logging.info("Retrieving article text")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/130.0 Safari/537.36"
        )
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    soup = BeautifulSoup(
        response.content,
        "html.parser"
    )

    # Remove irrelevant page elements.

    for element in soup.select(
        "script, style, nav, footer, header, "
        "aside, iframe, form, noscript"
    ):
        element.decompose()

    # Prefer the article element.

    container = soup.find("article")

    if not container:
        container = soup.find("main")

    if not container:
        container = soup.body or soup

    paragraphs = container.find_all("p")

    text_parts = []

    for paragraph in paragraphs:

        text = paragraph.get_text(
            " ",
            strip=True
        )

        text = re.sub(r"\s+", " ", text).strip()

        if len(text) > 40:
            text_parts.append(text)

    article_text = "\n\n".join(text_parts)

    return article_text[:25000]


# ================================================
# AI ANALYSIS PROMPT
# ================================================

def analyse_editorial(article, article_text):

    logging.info(
        "Sending editorial to OpenAI: %s",
        article["title"]
    )

    system_prompt = """
You are a senior CSS and PMS examination preparation
instructor specialising in Pakistan Affairs, Current
Affairs, English Essay, governance, international
relations, economics and political analysis.

Your task is to transform newspaper editorials into
rigorous, balanced and examination-oriented study notes.

IMPORTANT RULES:

1. Analyse the supplied editorial, not merely its headline.
2. Never invent statistics, quotations, dates or facts.
3. Distinguish the author's claims from verified facts.
4. Identify assumptions and weaknesses in arguments.
5. Explain complex concepts in clear academic English.
6. Connect the subject to Pakistan wherever relevant.
7. Do not invent sources or references.
8. Mark claims needing independent verification.
9. Avoid unnecessary repetition and generic statements.
10. Produce useful material suitable for CSS/PMS answers.

Return valid JSON only.
"""

    user_prompt = f"""
Analyse this newspaper editorial.

ARTICLE INFORMATION

Newspaper: {article.get('source')}
Title: {article.get('title')}
Publication date: {article.get('published')}
Original URL: {article.get('url')}

ARTICLE TEXT

{article_text}

Produce the following JSON structure:

{{
  "executive_summary": "",
  "central_thesis": "",
  "precis": "",
  "argument_structure": {{
    "main_arguments": [],
    "supporting_arguments": [],
    "counterarguments": [],
    "underlying_assumptions": []
  }},
  "critical_analysis": {{
    "strengths": [],
    "weaknesses": [],
    "critical_observations": [],
    "balanced_assessment": ""
  }},
  "important_terminology": [
    {{
      "term": "",
      "definition": "",
      "usage_example": ""
    }}
  ],
  "pakistan_relevance": {{
    "connections": [],
    "challenges": [],
    "policy_recommendations": []
  }},
  "international_context": [],
  "css_pms_subjects": [],
  "possible_exam_questions": [
    {{
      "question": "",
      "type": "Analytical"
    }}
  ],
  "essay_outline": {{
    "title": "",
    "thesis_statement": "",
    "introduction": "",
    "main_headings": [],
    "arguments": [],
    "counterarguments": [],
    "way_forward": [],
    "conclusion": ""
  }},
  "revision_points": [],
  "facts_requiring_verification": [],
  "difficulty": "Intermediate",
  "relevance_score": 8
}}

QUALITY REQUIREMENTS:

- Write a meaningful executive summary.
- Make the precis concise and coherent.
- Explain the logic behind the author's arguments.
- Provide substantive critical evaluation.
- Include at least five useful terminology entries.
- Generate at least five relevant examination questions.
- Make the essay outline sufficiently detailed for
  developing a competitive examination essay.
- Give practical and realistic policy recommendations.
- Keep the relevance score between 1 and 10.
- Use only information supported by the editorial
  or clearly labelled analytical inference.
"""

    response = client.responses.create(
        model=MODEL,
        input=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        text={
            "format": {
                "type": "json_object"
            }
        },
        max_output_tokens=4500
    )

    result = json.loads(response.output_text)

    return result


# ================================================
# MAIN PROCESSING ENGINE
# ================================================

def main():

    logging.info("Starting AI editorial analysis")

    if not INBOX_FILE.exists():
        logging.error("Article inbox does not exist.")
        return

    inbox = load_json(
        INBOX_FILE,
        {"articles": []}
    )

    database = load_json(
        OUTPUT_FILE,
        {"articles": []}
    )

    inbox_articles = inbox.get("articles", [])
    saved_articles = database.get("articles", [])

    saved_ids = {
        item.get("id")
        for item in saved_articles
    }

    pending_articles = [
        article
        for article in inbox_articles
        if article.get("id") not in saved_ids
        and article.get("analysis_status") == "pending"
    ]

    logging.info(
        "Pending articles: %s",
        len(pending_articles)
    )

    processed = 0

    for article in pending_articles:

        if processed >= MAX_ANALYSES:
            break

        try:

            article_text = extract_article_text(
                article["url"]
            )

            if len(article_text) < MINIMUM_TEXT_LENGTH:

                logging.warning(
                    "Insufficient accessible article text: %s",
                    article["title"]
                )

                article["analysis_status"] = (
                    "skipped_insufficient_text"
                )

                article["analysis_message"] = (
                    "Full article text was unavailable. "
                    "No full-editorial analysis generated."
                )

                continue

            analysis = analyse_editorial(
                article,
                article_text
            )

            record = {
                "id": article["id"],
                "title": article["title"],
                "source": article["source"],
                "url": article["url"],
                "published": article.get("published"),
                "category": article.get("category"),
                "analysis_status": "completed",
                "analysed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
                "model": MODEL,
                "analysis": analysis,
                "study_status": "unread",
                "saved": False,
                "personal_notes": ""
            }

            saved_articles.append(record)

            article["analysis_status"] = "completed"

            article["analysed_at"] = record[
                "analysed_at"
            ]

            processed += 1

            # Save after each successful analysis.

            database["articles"] = saved_articles

            database["last_updated"] = record[
                "analysed_at"
            ]

            save_json(OUTPUT_FILE, database)
            save_json(INBOX_FILE, inbox)

            logging.info(
                "Analysis completed: %s",
                article["title"]
            )

        except requests.RequestException as error:

            article["analysis_status"] = "fetch_error"

            article["analysis_message"] = str(error)[:500]

            logging.error(
                "Article retrieval failed: %s",
                error
            )

            save_json(INBOX_FILE, inbox)

        except Exception as error:

            logging.error(
                "Analysis failed for %s: %s",
                article.get("title"),
                error
            )

            # Leave article pending for a later retry.

    save_json(INBOX_FILE, inbox)

    logging.info("--------------------------------")
    logging.info("AI analysis process completed")
    logging.info("Successfully analysed: %s", processed)
    logging.info("Total analysed records: %s", len(saved_articles))
    logging.info("Output: %s", OUTPUT_FILE)
    logging.info("--------------------------------")


if __name__ == "__main__":
    main()
