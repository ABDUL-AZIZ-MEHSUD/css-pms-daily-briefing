
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
MAX_ANALYSES = int(os.getenv("MAX_ANALYSES", "6"))

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

You are a senior CSS and PMS examination instructor, academic
research analyst and critical-thinking specialist.

Your fields include Pakistan Affairs, Current Affairs,
Constitutional Law, governance, political science, economics,
international relations, public administration and English Essay.

MISSION

Transform the supplied newspaper editorial into rigorous,
balanced, evidence-conscious and examination-oriented study notes.

CORE ANALYTICAL STANDARDS

1. Analyse the complete supplied editorial, not merely its headline.
2. Identify the author's central thesis, objectives and perspective.
3. Separate the author's arguments from your own evaluation.
4. Never invent statistics, quotations, dates, constitutional
   provisions, laws, reports, institutions or references.
5. Do not describe a claim as independently verified unless
   independent verification evidence has actually been supplied.
6. Distinguish clearly between:
   - Established information supported by the supplied text.
   - Claims or allegations attributed to the author or others.
   - Opinions and value judgements.
   - Analytical inferences drawn from the argument.
   - Information requiring independent verification.
7. Identify unsupported generalisations, logical gaps, causal
   assumptions and possible biases.
8. Consider alternative explanations and counterarguments.
9. Avoid presenting contested political opinions as established facts.
10. Use precise, formal and accessible academic English.

CRITICAL ANALYSIS

Evaluate:
- The strength and relevance of supporting evidence.
- Logical consistency and quality of reasoning.
- The distinction between correlation and causation.
- Missing stakeholders and neglected perspectives.
- Short-term and long-term implications.
- Feasibility and unintended consequences of proposed solutions.

PAKISTAN-SPECIFIC ANALYSIS

Where relevant:
- Connect the issue with Pakistan's constitutional framework.
- Identify relevant institutions and their respective roles.
- Examine federal-provincial and institutional dimensions.
- Explain economic, political, social and administrative impacts.
- Consider governance capacity, implementation and accountability.
- Provide realistic policy recommendations.
- Mention constitutional articles, laws and policies only when
  sufficiently certain; otherwise flag them for verification.

INTERNATIONAL AND COMPARATIVE CONTEXT

Where relevant:
- Explain international implications and geopolitical interests.
- Include useful comparative examples.
- Avoid superficial country comparisons.
- Do not invent international statistics or policy outcomes.

CSS/PMS EXAMINATION ORIENTATION

Prepare material useful for:
- Pakistan Affairs.
- Current Affairs.
- Essay.
- General Science and Ability where relevant.
- Political Science, International Relations, Governance and
  Public Administration where relevant.
- Analytical and critical-thinking questions.

ESSAY DEVELOPMENT

Produce a coherent essay framework with:
- A focused title.
- A defensible thesis statement.
- A logical progression of headings.
- Evidence-conscious arguments.
- Counterarguments and rebuttals.
- Pakistan-specific examples where relevant.
- Practical and implementable recommendations.
- A balanced conclusion.

SPECIFICITY AND EVIDENCE RULES

- Every major argument must explain its reasoning and significance.
- Prefer specific evidence from the editorial over generic commentary.
- When evidence is absent, explicitly identify the evidence gap.
- Link Pakistan-specific recommendations to the actual problem identified.
- Explain implementation responsibility where reasonably identifiable.
- Never invent constitutional articles, case law or legal interpretations.
- Distinguish short-term consequences from long-term institutional effects.
- Avoid repeating the same argument in different sections.

QUALITY CONTROL

- Avoid generic statements and repetitive observations.
- Explain why an argument matters, not merely what it says.
- Do not manufacture examples to satisfy minimum quantities.
- Clearly label analytical recommendations as recommendations.
- Use concise but substantive points.
- Ensure every section is relevant to the editorial.
- Return valid JSON only, following the exact schema requested
  by the user prompt.

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
  "facts_to_memorise": [
    {{
      "category": "Statistic",
      "content": "",
      "attribution": "",
      "context": ""
    }}
  ],
  "facts_requiring_verification": [
    {{
      "claim": "",
      "claim_type": "Statistical",
      "why_verification_is_needed": "",
      "recommended_source": ""
    }}
  ],
  "possible_exam_questions": [
    {{
      "question": "",
      "type": "Analytical",
      "model_answer": ""
    }}
  ],
  "model_introduction": "",
  "essay_outline": {{
    "title": "",
    "thesis_statement": "",
    "main_headings": [
      {{
        "heading": "",
        "subheadings": []
      }}
    ],
    "conclusion": ""
  }},
  "mcqs": [
    {{
      "question": "",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_option": 0,
      "explanation": ""
    }}
  ],
  "revision_points": [],
  "difficulty": "Intermediate",
  "relevance_score": 8
}}

QUALITY REQUIREMENTS:

GENERAL ANALYSIS
- Write a meaningful executive summary and a concise, coherent precis.
- Explain the author's arguments, evidence, assumptions and reasoning.
- Provide substantive critical evaluation, counterarguments and balanced assessment.
- Include at least five useful terminology entries.
- Give realistic Pakistan-specific policy recommendations.
- Use only information supported by the editorial or clearly labelled analytical inference.

FACTS TO MEMORISE
- Extract all significant statistics, numerical figures, percentages, dates, years, names, institutions, reports, events, constitutional references and other concrete evidence appearing in the original article.
- Include short, useful quotations, sayings and attributed statements where present. Preserve their wording accurately and identify the speaker or source.
- Do not invent, estimate, complete or alter any statistic, quotation, date, name or attribution.
- Do not present an author's allegation or an attributed claim as independently verified fact. Preserve its attribution.
- Keep each entry concise and useful for examination revision.
- Use categories such as Statistic, Date, Quotation, Saying, Person, Institution, Report, Event and Key Statement.
- If the article contains no relevant material for a category, do not manufacture an entry.

EXAM QUESTIONS
- Generate five relevant CSS/PMS-level questions.
- Each model answer must contain strictly 45?60 words and 3?4 sentences.
- Keep answers concise, direct, analytical and easy to revise; include only the strongest relevant arguments and article-based evidence.
- Answers must directly address the question, demonstrate analysis and use article-based evidence where available.
- Avoid generic answers and unsupported claims.

MODEL INTRODUCTION
- Write exactly one model essay introduction of approximately 100 words.
- It must establish context, introduce the central issue, present a clear thesis and indicate the direction of the argument.
- Do not generate a model conclusion in this section.

ESSAY OUTLINE
- Provide a developed, logically sequenced competitive-examination essay outline.
- Number main headings using 1, 2, 3, 4 and so on.
- Number each heading's subheadings using Roman numerals i, ii, iii and so on.
- Include a coherent introduction framework, conceptual background, causes or dimensions, critical evaluation, Pakistan-specific implications, counterarguments where relevant, recommendations and a concluding heading.
- Keep every heading relevant to the central thesis. Avoid repetition.

MCQs
- Generate exactly five article-specific multiple-choice questions.
- Give exactly four distinct options per question.
- There must be exactly one correct option.
- Set correct_option as a zero-based integer: 0 for the first option, 1 for the second, 2 for the third and 3 for the fourth.
- Provide a concise explanation identifying why the correct answer is right.
- Questions should test important facts, concepts, institutions, arguments and implications from the article.
- Never use invented facts or ambiguous questions.

VERIFICATION AND QUALITY CONTROL
- Keep facts_requiring_verification separate from facts_to_memorise.
- Flag important factual or legal claims that need independent verification.
- Check that all requested arrays and fields are populated appropriately.
- Keep the relevance score between 1 and 10.
- Return valid JSON only, following the exact schema.
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

    # Validate all five CSS/PMS model answers.
    import re

    questions = result.get("possible_exam_questions", [])

    if len(questions) != 5:
        raise ValueError(
            f"Expected exactly 5 exam questions, found {len(questions)}."
        )

    errors = []

    for i, question in enumerate(questions, 1):
        answer = question.get("model_answer", "").strip()
        word_count = len(answer.split())
        sentence_count = len(
            re.findall(r"[^.!?]+(?:[.!?]+|$)", answer)
        )

        if not 45 <= word_count <= 60:
            errors.append(
                f"Answer {i}: {word_count} words (required: 45?60)"
            )

        if not 3 <= sentence_count <= 4:
            errors.append(
                f"Answer {i}: {sentence_count} sentences (required: 3?4)"
            )

    if errors:
        raise ValueError(
            "Model-answer validation failed:\n" + "\n".join(errors)
        )

    print("PASS: All five model answers meet the 45?60 word and 3?4 sentence standard.")

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
    attempted = 0

    for article in pending_articles:

        if attempted >= MAX_ANALYSES:
            break

        attempted += 1

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
