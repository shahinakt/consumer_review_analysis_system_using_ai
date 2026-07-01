from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "model.pkl"
VECTORIZER_PATH = ML_DIR / "vectorizer.pkl"
SAMPLE_DATA_PATH = ML_DIR.parent.parent.parent / "sample_data" / "sample_reviews.csv"
LEGACY_DATA_PATH = ML_DIR / "cleaned_customer_reviews.csv"

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "at",
    "for", "with", "this", "that", "it", "i", "my", "me", "we", "you",
    "your", "as", "by", "from", "not", "no", "do", "did", "does", "have",
    "has", "had", "will", "would", "can", "could", "should", "just", "very",
}


def clean_text(text: str) -> str:
    import re
    import string

    text = str(text).lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = [token for token in text.split() if token and token not in STOPWORDS]
    return " ".join(tokens)


def load_training_data() -> pd.DataFrame:
    candidates = [SAMPLE_DATA_PATH, LEGACY_DATA_PATH]
    for path in candidates:
        if path.exists():
            df = pd.read_csv(path)
            if "review_text" in df.columns:
                return df
            if "Review" in df.columns:
                df = df.rename(columns={"Review": "review_text"})
                return df
    return pd.DataFrame(
        {
            "review_text": [
                "Excellent product, works perfectly and arrived early",
                "Terrible quality, broke after one day, waste of money",
                "It is okay, nothing special but does the job",
                "Amazing customer support and fast delivery, love it",
                "Very disappointed, item was damaged and support ignored me",
                "Average product for the price, could be better",
            ],
            "rating": [5, 1, 3, 5, 1, 3],
        }
    )


def label_from_rating(rating: float) -> str:
    if rating >= 4:
        return "Positive"
    if rating <= 2:
        return "Negative"
    return "Neutral"


def train_and_save_model() -> tuple[object, object]:
    df = load_training_data()
    if "rating" in df.columns:
        df = df.copy()
        df["label"] = df["rating"].apply(label_from_rating)
    elif "true_sentiment" in df.columns:
        df = df.copy()
        df["label"] = df["true_sentiment"]
    else:
        raise ValueError("Training data must include a rating or true_sentiment column")

    df["clean"] = df["review_text"].fillna("").apply(clean_text)
    df = df.dropna(subset=["clean", "label"])

    vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2))
    X = vectorizer.fit_transform(df["clean"])
    y = df["label"]

    if len(df) >= 10 and y.nunique() > 1:
        X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    else:
        X_train, y_train = X, y

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    return model, vectorizer


def main() -> None:
    model, vectorizer = train_and_save_model()
    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved vectorizer to {VECTORIZER_PATH}")
    print(f"Model class: {type(model).__name__}")
    print(f"Vectorizer class: {type(vectorizer).__name__}")


if __name__ == "__main__":
    main()
