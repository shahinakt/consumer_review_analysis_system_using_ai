"""
Run this manually to (re)generate model.pkl and vectorizer.pkl from
sample_data/sample_reviews.csv, or after your ML teammate swaps in a real,
larger labeled dataset.

Usage (from the backend/ folder):
    python -m app.ml.train_sample_model
"""
import sys
from pathlib import Path

# Allow running as a script (adds backend/ to path so `app` package resolves)
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from app.services.ml_service import _train_demo_model  # noqa: E402

if __name__ == "__main__":
    model, vectorizer = _train_demo_model()
    print("Model trained and saved to app/ml/model.pkl")
    print("Vectorizer saved to app/ml/vectorizer.pkl")
    print(f"Classes: {list(model.classes_)}")
