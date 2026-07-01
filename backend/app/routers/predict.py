from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.ml_service import predict_new_review
from app.security import get_current_user

router = APIRouter(tags=["predict"])


# Available to any signed-in user (ADMIN or USER), not just admins.
@router.post("/predict", response_model=schemas.PredictResponse)
def predict_review(
    payload: schemas.PredictRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    label, polarity, cleaned = predict_new_review(payload.review_text)

    customer = None
    if payload.customer_name:
        customer = (
            db.query(models.Customer)
            .filter(models.Customer.customer_name == payload.customer_name)
            .first()
        )
        if not customer:
            customer = models.Customer(customer_name=payload.customer_name)
            db.add(customer)
            db.flush()

    product = None
    if payload.product_name:
        product = (
            db.query(models.Product)
            .filter(models.Product.product_name == payload.product_name)
            .first()
        )
        if not product:
            product = models.Product(product_name=payload.product_name)
            db.add(product)
            db.flush()

    review = models.Review(
        customer_id=customer.customer_id if customer else None,
        product_id=product.product_id if product else None,
        review_text=payload.review_text,
        rating=payload.rating,
        review_date=datetime.utcnow(),
    )
    db.add(review)
    db.flush()

    result = models.SentimentResult(
        review_id=review.review_id,
        cleaned_text=cleaned,
        sentiment_label=label,
        polarity_score=polarity,
    )
    db.add(result)
    db.commit()

    return schemas.PredictResponse(
        review_id=review.review_id,
        sentiment_label=label,
        polarity_score=polarity,
        cleaned_text=cleaned,
    )
