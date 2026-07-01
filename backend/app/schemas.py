from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    review_text: str = Field(..., min_length=1, description="Raw review text")
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class PredictResponse(BaseModel):
    review_id: int
    sentiment_label: str
    polarity_score: float
    cleaned_text: str


class UploadResponse(BaseModel):
    total_rows: int
    inserted: int
    skipped: int
    sentiment_breakdown: dict


class ReviewOut(BaseModel):
    review_id: int
    review_text: str
    rating: Optional[int]
    review_date: datetime
    sentiment_label: Optional[str] = None
    polarity_score: Optional[float] = None
    product_name: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


class KPICards(BaseModel):
    total_reviews: int
    average_rating: float
    positive_pct: float
    negative_pct: float
    neutral_pct: float


class RatingDistributionItem(BaseModel):
    rating: int
    count: int


class SentimentTrendItem(BaseModel):
    date: str
    positive: int
    negative: int
    neutral: int


class TopWordItem(BaseModel):
    word: str
    count: int


class DashboardResponse(BaseModel):
    kpis: KPICards
    rating_distribution: List[RatingDistributionItem]
    sentiment_trend: List[SentimentTrendItem]
    top_positive_words: List[TopWordItem]
    top_negative_words: List[TopWordItem]
    recent_reviews: List[ReviewOut]
    powerbi_embed_url: str


class RecommendationsResponse(BaseModel):
    executive_summary: str
    recommendations: List[str]
    generated_at: datetime
