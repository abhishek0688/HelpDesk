import re
from typing import List, Dict, Any

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "is", "was", "are", "were", "it", "this", "that", "i", "my", "we", "not", "cannot", "can't"
}

def tokenize(text: str) -> set:
    """
    Splits text into lowercase alphanumeric words, filtering out common stopwords.
    """
    if not text:
        return set()
    words = re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text.lower())
    return {w for w in words if w not in STOPWORDS}

def calculate_similarity(tokens1: set, tokens2: set) -> float:
    """
    Calculates Jaccard similarity between two sets of tokens.
    Score ranges from 0.0 (no overlap) to 1.0 (identical tokens).
    """
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def find_similar_tickets(new_title: str, new_desc: str, new_category: str, new_device: str, existing_tickets: list) -> List[Dict[str, Any]]:
    """
    Scans existing tickets to detect potential duplicates or similar incidents.
    Returns matched tickets ordered by similarity score.
    """
    new_tokens = tokenize(f"{new_title} {new_desc} {new_device or ''}")
    matches = []

    for ticket in existing_tickets:
        existing_tokens = tokenize(f"{ticket.title} {ticket.description} {ticket.affected_device or ''}")
        score = calculate_similarity(new_tokens, existing_tokens)
        
        # Boost score slightly if category is identical
        if new_category and ticket.category and new_category.lower() == ticket.category.lower():
            score = min(1.0, score + 0.1)

        # Threshold: 0.20 or higher indicates noticeable overlap
        if score >= 0.20:
            final_sol = None
            if ticket.resolution_record:
                final_sol = ticket.resolution_record.final_solution

            matches.append({
                "id": ticket.id,
                "ticket_code": ticket.ticket_code,
                "title": ticket.title,
                "status": ticket.status,
                "category": ticket.category,
                "similarity_score": round(score, 2),
                "final_solution": final_sol
            })

    # Sort matches by highest similarity first
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches[:5]
