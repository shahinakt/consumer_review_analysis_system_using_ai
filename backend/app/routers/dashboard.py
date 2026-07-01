import os
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.ml_service import get_top_words

router = APIRouter(tags=["dashboard"])

POWERBI_EMBED_URL = os.getenv(
    "POWERBI_EMBED_URL", "https://app.powerbi.com/view?r=YOUR_REPORT_EMBED_TOKEN"
)


@router.get("/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    reviews = (
        db.query(models.Review, models.SentimentResult, models.Product, models.Customer)
        .outerjoin(models.SentimentResult, models.Review.review_id == models.SentimentResult.review_id)
        .outerjoin(models.Product, models.Review.product_id == models.Product.product_id)
        .outerjoin(models.Customer, models.Review.customer_id == models.Customer.customer_id)
        .order_by(models.Review.review_date.desc())
        .all()
    )

    total = len(reviews)

    if total == 0:
        return schemas.DashboardResponse(
            kpis=schemas.KPICards(
                total_reviews=0, average_rating=0, positive_pct=0, negative_pct=0, neutral_pct=0
            ),
            rating_distribution=[schemas.RatingDistributionItem(rating=r, count=0) for r in range(1, 6)],
            sentiment_trend=[],
            top_positive_words=[],
            top_negative_words=[],
            recent_reviews=[],
            powerbi_embed_url=POWERBI_EMBED_URL,
        )

    ratings = [r.rating for r, s, p, c in reviews if r.rating]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    label_counts = defaultdict(int)
    for _, s, _, _ in reviews:
        if s:
            label_counts[s.sentiment_label] += 1

    positive_pct = round(100 * label_counts.get("Positive", 0) / total, 1)
    negative_pct = round(100 * label_counts.get("Negative", 0) / total, 1)
    neutral_pct = round(100 * label_counts.get("Neutral", 0) / total, 1)

    rating_dist = defaultdict(int)
    for r, _, _, _ in reviews:
        if r.rating:
            rating_dist[r.rating] += 1
    rating_distribution = [
        schemas.RatingDistributionItem(rating=r, count=rating_dist.get(r, 0)) for r in range(1, 6)
    ]

    trend_map = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
    for r, s, _, _ in reviews:
        if not s:
            continue
        day = r.review_date.strftime("%Y-%m-%d")
        key = s.sentiment_label.lower()
        if key in trend_map[day]:
            trend_map[day][key] += 1
    sentiment_trend = [
        schemas.SentimentTrendItem(date=day, **counts)
        for day, counts in sorted(trend_map.items())
    ][-14:]  # last 14 days with data

    positive_texts = [r.review_text for r, s, _, _ in reviews if s and s.sentiment_label == "Positive"]
    negative_texts = [r.review_text for r, s, _, _ in reviews if s and s.sentiment_label == "Negative"]

    top_positive_words = [
        schemas.TopWordItem(word=w, count=c) for w, c in get_top_words(positive_texts, top_n=12)
    ]
    top_negative_words = [
        schemas.TopWordItem(word=w, count=c) for w, c in get_top_words(negative_texts, top_n=12)
    ]

    recent_reviews = [
        schemas.ReviewOut(
            review_id=r.review_id,
            review_text=r.review_text,
            rating=r.rating,
            review_date=r.review_date,
            sentiment_label=s.sentiment_label if s else None,
            polarity_score=s.polarity_score if s else None,
            product_name=p.product_name if p else None,
            customer_name=c.customer_name if c else None,
        )
        for r, s, p, c in reviews[:20]
    ]

    return schemas.DashboardResponse(
        kpis=schemas.KPICards(
            total_reviews=total,
            average_rating=avg_rating,
            positive_pct=positive_pct,
            negative_pct=negative_pct,
            neutral_pct=neutral_pct,
        ),
        rating_distribution=rating_distribution,
        sentiment_trend=sentiment_trend,
        top_positive_words=top_positive_words,
        top_negative_words=top_negative_words,
        recent_reviews=recent_reviews,
        powerbi_embed_url=POWERBI_EMBED_URL,
    )
