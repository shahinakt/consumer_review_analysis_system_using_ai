from datetime import datetime
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.ml_service import predict_new_review

router = APIRouter(tags=["upload"])

REQUIRED_COLUMN_CANDIDATES = ["review_text", "review", "text", "Review", "ReviewText"]


def _find_text_column(df: pd.DataFrame) -> str:
    for candidate in REQUIRED_COLUMN_CANDIDATES:
        if candidate in df.columns:
            return candidate
    raise HTTPException(
        status_code=400,
        detail=(
            "Could not find a review text column. Expected one of: "
            + ", ".join(REQUIRED_COLUMN_CANDIDATES)
        ),
    )


@router.post("/upload", response_model=schemas.UploadResponse)
async def upload_reviews(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = (file.filename or "").lower()
    contents = await file.read()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400, detail="Unsupported file type. Upload .csv or .xlsx"
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file has no rows")

    text_col = _find_text_column(df)
    rating_col = next((c for c in ["rating", "Rating", "stars", "Stars"] if c in df.columns), None)
    product_col = next(
        (c for c in ["product_name", "Product", "ProductName"] if c in df.columns), None
    )
    customer_col = next(
        (c for c in ["customer_name", "Customer", "CustomerName"] if c in df.columns), None
    )

    df = df.dropna(subset=[text_col]).drop_duplicates(subset=[text_col])

    inserted = 0
    skipped = 0
    breakdown = {"Positive": 0, "Negative": 0, "Neutral": 0}

    # Simple in-memory caches to avoid duplicate customer/product rows within one upload
    product_cache = {}
    customer_cache = {}

    for _, row in df.iterrows():
        text = str(row[text_col]).strip()
        if not text or text.lower() == "nan":
            skipped += 1
            continue

        product_id = None
        if product_col and pd.notna(row.get(product_col)):
            pname = str(row[product_col]).strip()
            if pname not in product_cache:
                product = (
                    db.query(models.Product)
                    .filter(models.Product.product_name == pname)
                    .first()
                )
                if not product:
                    product = models.Product(product_name=pname)
                    db.add(product)
                    db.flush()
                product_cache[pname] = product.product_id
            product_id = product_cache[pname]

        customer_id = None
        if customer_col and pd.notna(row.get(customer_col)):
            cname = str(row[customer_col]).strip()
            if cname not in customer_cache:
                customer = (
                    db.query(models.Customer)
                    .filter(models.Customer.customer_name == cname)
                    .first()
                )
                if not customer:
                    customer = models.Customer(customer_name=cname)
                    db.add(customer)
                    db.flush()
                customer_cache[cname] = customer.customer_id
            customer_id = customer_cache[cname]

        rating_val = None
        if rating_col and pd.notna(row.get(rating_col)):
            try:
                rating_val = int(row[rating_col])
            except (ValueError, TypeError):
                rating_val = None

        review = models.Review(
            customer_id=customer_id,
            product_id=product_id,
            review_text=text,
            rating=rating_val,
            review_date=datetime.utcnow(),
        )
        db.add(review)
        db.flush()

        label, polarity, cleaned = predict_new_review(text)
        breakdown[label] = breakdown.get(label, 0) + 1

        result = models.SentimentResult(
            review_id=review.review_id,
            cleaned_text=cleaned,
            sentiment_label=label,
            polarity_score=polarity,
        )
        db.add(result)
        inserted += 1

    db.commit()

    return schemas.UploadResponse(
        total_rows=int(len(df)),
        inserted=inserted,
        skipped=skipped,
        sentiment_breakdown=breakdown,
    )
