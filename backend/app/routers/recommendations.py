from datetime import datetime
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.ml_service import get_top_words
from app.services.recommendation_service import (
    suggest_recommendations,
    generate_executive_summary,
)

router = APIRouter(tags=["recommendations"])


@router.get("/recommendations", response_model=schemas.RecommendationsResponse)
def get_recommendations(db: Session = Depends(get_db)):
    reviews = (
        db.query(models.Review, models.SentimentResult)
        .outerjoin(models.SentimentResult, models.Review.review_id == models.SentimentResult.review_id)
        .all()
    )

    total = len(reviews)
    ratings = [r.rating for r, s in reviews if r.rating]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    label_counts = defaultdict(int)
    for _, s in reviews:
        if s:
            label_counts[s.sentiment_label] += 1

    positive_pct = round(100 * label_counts.get("Positive", 0) / total, 1) if total else 0.0
    negative_pct = round(100 * label_counts.get("Negative", 0) / total, 1) if total else 0.0
    neutral_pct = round(100 * label_counts.get("Neutral", 0) / total, 1) if total else 0.0

    negative_texts = [r.review_text for r, s in reviews if s and s.sentiment_label == "Negative"]
    top_negative_words = [w for w, _ in get_top_words(negative_texts, top_n=10)]

    summary = generate_executive_summary(
        total_reviews=total,
        average_rating=avg_rating,
        positive_pct=positive_pct,
        negative_pct=negative_pct,
        neutral_pct=neutral_pct,
    )

    recs = suggest_recommendations(
        positive_pct=positive_pct,
        negative_pct=negative_pct,
        neutral_pct=neutral_pct,
        average_rating=avg_rating,
        top_negative_words=top_negative_words,
    )

    return schemas.RecommendationsResponse(
        executive_summary=summary,
        recommendations=recs,
        generated_at=datetime.utcnow(),
    )
