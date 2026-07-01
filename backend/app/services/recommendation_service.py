"""
Rule-based business recommendations + a templated "AI Executive Summary".

This is intentionally dependency-free (no external LLM call) so the MVP runs
with zero API keys. The generate_executive_summary() function is written as
a single, isolated function so a team can later swap its body for a real
call to the Anthropic API without touching anything else.
"""
from typing import List, Dict


def suggest_recommendations(
    positive_pct: float,
    negative_pct: float,
    neutral_pct: float,
    average_rating: float,
    top_negative_words: List[str],
) -> List[str]:
    recs: List[str] = []

    if negative_pct >= 30:
        recs.append(
            "Negative sentiment is high (%.0f%% of reviews). Prioritize a root-cause "
            "review of the most recent 1-2 star feedback this week." % negative_pct
        )
    elif negative_pct >= 15:
        recs.append(
            "Negative sentiment is moderate (%.0f%%). Set up weekly monitoring so it "
            "doesn't creep higher." % negative_pct
        )
    else:
        recs.append(
            "Negative sentiment is low (%.0f%%) -- maintain current quality and "
            "support processes." % negative_pct
        )

    if average_rating < 3.0:
        recs.append(
            "Average rating (%.1f/5) is below the healthy threshold of 3.5. "
            "Consider a direct outreach campaign to recent low-rating customers." % average_rating
        )
    elif average_rating < 4.0:
        recs.append(
            "Average rating (%.1f/5) has room to improve. Identify the single most "
            "common complaint and fix it first for the fastest lift." % average_rating
        )
    else:
        recs.append(
            "Average rating (%.1f/5) is strong. Highlight top reviews in marketing "
            "and referral campaigns." % average_rating
        )

    pain_point_hints = {
        "delivery": "Delivery/shipping delays appear frequently -- audit courier SLAs.",
        "shipping": "Shipping issues appear frequently -- audit courier SLAs.",
        "quality": "Product quality complaints appear frequently -- review QA checkpoints.",
        "broken": "Multiple mentions of items arriving broken -- inspect packaging standards.",
        "support": "Customer support is mentioned negatively -- review response-time SLAs.",
        "price": "Price-related complaints appear -- benchmark pricing against competitors.",
        "size": "Sizing/fit complaints appear -- improve size-guide accuracy.",
        "late": "Late delivery complaints appear -- audit courier SLAs.",
        "refund": "Refund-related complaints appear -- streamline the refund process.",
    }
    matched = []
    for word in top_negative_words:
        if word in pain_point_hints and pain_point_hints[word] not in matched:
            matched.append(pain_point_hints[word])
    recs.extend(matched[:3])

    if positive_pct >= 60:
        recs.append(
            "Positive sentiment is healthy (%.0f%%). Turn top positive reviews into "
            "testimonials and social proof." % positive_pct
        )

    if neutral_pct >= 25:
        recs.append(
            "A large neutral segment (%.0f%%) suggests indifference -- consider a "
            "follow-up survey to learn what would turn them into promoters." % neutral_pct
        )

    return recs[:6]


def generate_executive_summary(
    total_reviews: int,
    average_rating: float,
    positive_pct: float,
    negative_pct: float,
    neutral_pct: float,
) -> str:
    """
    Deterministic, template-based executive summary. Swap the body of this
    function for a call to the Anthropic Messages API (see the
    anthropic_api_in_artifacts pattern) if a live LLM summary is wanted --
    the calling router does not need to change.
    """
    if total_reviews == 0:
        return (
            "No reviews have been analyzed yet. Upload a review dataset or submit "
            "individual predictions to generate an executive summary."
        )

    tone = "positive" if positive_pct >= negative_pct + 15 else (
        "mixed" if abs(positive_pct - negative_pct) < 15 else "concerning"
    )

    summary = (
        f"Across {total_reviews} analyzed reviews, overall sentiment is {tone}, with "
        f"an average rating of {average_rating:.1f}/5. "
        f"{positive_pct:.0f}% of reviews are Positive, {negative_pct:.0f}% Negative, "
        f"and {neutral_pct:.0f}% Neutral. "
    )

    if tone == "positive":
        summary += (
            "Customers are broadly satisfied; the main opportunity is amplifying "
            "happy customers and converting neutral ones into promoters."
        )
    elif tone == "mixed":
        summary += (
            "Sentiment is split -- there is a meaningful satisfied base alongside a "
            "vocal dissatisfied minority that is worth investigating this week."
        )
    else:
        summary += (
            "Dissatisfaction is outweighing satisfaction. This warrants immediate "
            "attention to the top recurring complaints before it affects retention."
        )

    return summary
