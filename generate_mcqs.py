
import json
from pathlib import Path

DATA_FILE = Path("data/articles.json")

def generate_mcqs(article):
    analysis = article.get("analysis", {})

    title = article.get("title", "Untitled")
    thesis = analysis.get("central_thesis", "")
    summary = analysis.get("executive_summary", "")
    arguments = analysis.get("argument_structure", {})
    terminology = analysis.get("important_terminology", [])
    relevance = analysis.get("pakistan_relevance", {})
    questions = analysis.get("possible_exam_questions", [])

    mcqs = []

    # MCQ 1: Central thesis
    if thesis:
        mcqs.append({
            "question": f"What is the central argument of '{title}'?",
            "options": [
                thesis,
                "The issue has no significant implications for governance.",
                "The problem can only be resolved through foreign intervention.",
                "Existing policies have completely resolved the issue."
            ],
            "answer": 0,
            "explanation": thesis
        })

    # MCQ 2: Main arguments
    main_arguments = arguments.get("main_arguments", [])

    if main_arguments:
        correct = main_arguments[0]
        mcqs.append({
            "question": "Which statement best represents a major argument in this editorial?",
            "options": [
                correct,
                "The issue has no relevance to public policy.",
                "No institutional reforms are necessary.",
                "The situation requires no further attention."
            ],
            "answer": 0,
            "explanation": correct
        })

    # MCQ 3: Important terminology
    if terminology:
        term = terminology[0]
        mcqs.append({
            "question": f"What does '{term['term']}' mean?",
            "options": [
                term["definition"],
                "A temporary political arrangement.",
                "An unrelated economic development.",
                "A form of international trade."
            ],
            "answer": 0,
            "explanation": term["definition"]
        })

    # MCQ 4: Pakistan relevance
    connections = relevance.get("connections", [])

    if connections:
        correct = connections[0]
        mcqs.append({
            "question": "How is the issue relevant to Pakistan?",
            "options": [
                correct,
                "It has no connection with Pakistan.",
                "It concerns exclusively European domestic politics.",
                "It has no implications for governance."
            ],
            "answer": 0,
            "explanation": correct
        })

    # MCQ 5: Exam-oriented understanding
    if questions:
        question = questions[0].get("question", "")

        mcqs.append({
            "question": "Which of the following is an important analytical question arising from this editorial?",
            "options": [
                question,
                "Why should public policy be abandoned?",
                "Why are institutional reforms always unnecessary?",
                "Why should contemporary issues be ignored?"
            ],
            "answer": 0,
            "explanation": question
        })

    return mcqs


def main():
    if not DATA_FILE.exists():
        print("Articles file not found.")
        return

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))

    articles = data if isinstance(data, list) else data.get("articles", [])

    generated = 0
    failed = 0

    for article in articles:
        mcqs = generate_mcqs(article)

        if len(mcqs) == 5:
            article["mcqs"] = mcqs
            generated += 1
            print("Generated 5 MCQs:", article.get("title"))
        else:
            failed += 1
            print("Could not generate 5 MCQs:", article.get("title"))

    DATA_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("\n========== MCQ GENERATION SUMMARY ==========")
    print("Articles processed:", len(articles))
    print("Successfully generated:", generated)
    print("Failed:", failed)


if __name__ == "__main__":
    main()
