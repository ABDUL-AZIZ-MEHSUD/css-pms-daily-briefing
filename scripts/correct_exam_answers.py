from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from analyse_articles import client, MODEL, extract_article_text

DATA_FILE = ROOT / "data" / "articles.json"

TARGETS = {
    "Theatre control",
    "The provinces diatribe"
}

def count_sentences(text):
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return len([p for p in parts if p.strip()])

def validate_answer(answer):
    if not isinstance(answer, str):
        return False, "Answer is not text"

    words = re.findall(r"\b[\w'-]+\b", answer)
    sentences = count_sentences(answer)

    if not 45 <= len(words) <= 60:
        return False, f"{len(words)} words; expected 45-60"

    if not 3 <= sentences <= 4:
        return False, f"{sentences} sentences; expected 3-4"

    return True, f"{len(words)} words, {sentences} sentences"

def main():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        database = json.load(f)

    records = {
        article["title"]: article
        for article in database.get("articles", [])
        if article.get("title") in TARGETS
    }

    if set(records) != TARGETS:
        raise RuntimeError("Could not find both target articles. No changes saved.")

    corrections = {}

    for title in sorted(TARGETS):
        record = records[title]
        analysis = record.get("analysis", {})
        questions = analysis.get("possible_exam_questions", [])

        if len(questions) != 5:
            raise RuntimeError(f"{title}: expected exactly five questions.")

        print(f"\nPreparing: {title}")
        article_text = extract_article_text(record["url"])

        if len(article_text) < 800:
            raise RuntimeError(f"{title}: insufficient article text.")

        question_data = [
            {
                "question": item["question"],
                "type": item.get("type", "Analytical")
            }
            for item in questions
        ]

        prompt = f"""
You are preparing high-quality CSS and PMS examination study material.

ARTICLE TITLE: {title}

ORIGINAL ARTICLE TEXT:
{article_text}

EXISTING EXAM QUESTIONS:
{json.dumps(question_data, ensure_ascii=False, indent=2)}

TASK:
Write one improved model answer for each of the five existing questions.

STRICT REQUIREMENTS:
1. Return exactly five answers in the same order as the questions.
2. Each answer must contain exactly 3 or 4 complete sentences.
3. Each answer must contain strictly 45-60 words.
4. Directly answer the question; do not merely describe the topic.
5. Explain the relevant reasoning, implications and critical perspective.
6. Use specific evidence, examples or arguments from the article wherever available.
7. Connect the issue to Pakistan's constitutional, political, administrative,
   economic, social or institutional context where genuinely relevant.
8. Distinguish the author's arguments from independently established facts.
9. Never invent statistics, quotations, legal provisions, events or claims.
10. If the article does not provide enough evidence for a claim, acknowledge
    that limitation rather than inventing supporting details.
11. Use clear, formal, examination-appropriate English.
12. Avoid repetition, filler, generic introductions and unnecessary conclusions.

Before returning, check the sentence count and word count of every answer.

Return valid JSON only in this structure:
{{
  "answers": [
    "First model answer...",
    "Second model answer...",
    "Third model answer...",
    "Fourth model answer...",
    "Fifth model answer..."
  ]
}}
"""

        response = client.responses.create(
            model=MODEL,
            input=prompt,
            text={"format": {"type": "json_object"}},
            max_output_tokens=4500
        )

        result = json.loads(response.output_text)
        answers = result.get("answers", [])

        if len(answers) != 5:
            raise RuntimeError(f"{title}: AI did not return exactly five answers.")

        for index, answer in enumerate(answers, 1):
            valid, message = validate_answer(answer)
            print(f"  Answer {index}: {message}")

            if not valid:
                raise RuntimeError(
                    f"{title}, answer {index} failed validation: {message}. "
                    "No changes have been saved."
                )

        corrections[title] = answers
        print(f"  Validation passed: {title}")

    # Apply corrections only after BOTH articles pass validation.
    for title, answers in corrections.items():
        questions = records[title]["analysis"]["possible_exam_questions"]

        for question, answer in zip(questions, answers):
            question["model_answer"] = answer

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    print("\nSUCCESS: Both articles corrected and validated.")
    print("Only model_answer fields were changed.")
    print("All other study material was preserved.")

if __name__ == "__main__":
    main()
