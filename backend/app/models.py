from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(120), nullable=False, default="Anonymous")
    email = Column(String(120), nullable=True)
    join_date = Column(DateTime, default=datetime.utcnow)

    reviews = relationship("Review", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(150), nullable=False, default="General Product")
    category = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)

    reviews = relationship("Review", back_populates="product")


class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=True)
    review_text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    review_date = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")
    sentiment_result = relationship(
        "SentimentResult", back_populates="review", uselist=False
    )


class MLModel(Base):
    __tablename__ = "ml_models"

    model_id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    is_best_model = Column(Boolean, default=False)

    sentiment_results = relationship("SentimentResult", back_populates="model")


class SentimentResult(Base):
    __tablename__ = "sentiment_results"

    result_id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.review_id"), nullable=False)
    model_id = Column(Integer, ForeignKey("ml_models.model_id"), nullable=True)
    cleaned_text = Column(Text, nullable=True)
    sentiment_label = Column(String(20), nullable=False)  # Positive/Negative/Neutral
    polarity_score = Column(Float, nullable=True)

    review = relationship("Review", back_populates="sentiment_result")
    model = relationship("MLModel", back_populates="sentiment_results")
