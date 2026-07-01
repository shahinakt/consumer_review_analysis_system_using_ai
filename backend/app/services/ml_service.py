"""
ML service: loads a pre-trained sentiment model (model.pkl) and TF-IDF
vectorizer (vectorizer.pkl) and exposes a predict_new_review() function.

If model.pkl / vectorizer.pkl are not found (e.g. first run of the hackathon
project, before the ML teammate has dropped in their trained artifacts),
this module trains a small demo Logistic Regression model on the bundled
sample dataset so the API never breaks. Replace the two .pkl files in
backend/app/ml/ with your own trained artifacts at any time -- next server
restart will pick them up automatically.
"""
import re
import string
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

ML_DIR = Path(__file__).resolve().parent.parent / "ml"
MODEL_PATH = ML_DIR / "model.pkl"
VECTORIZER_PATH = ML_DIR / "vectorizer.pkl"
SAMPLE_DATA_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent / "sample_data" / "sample_reviews.csv"
)

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "at",
    "for", "with", "this", "that", "it", "i", "my", "me", "we", "you",
    "your", "as", "by", "from", "not", "no", "do", "did", "does", "have",
    "has", "had", "will", "would", "can", "could", "should", "just", "very",
}

_model = None
_vectorizer = None


def clean_text(text: str) -> str:
    """Lowercase, strip punctuation/digits, remove stopwords."""
    text = str(text).lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = [t for t in text.split() if t and t not in STOPWORDS]
    return " ".join(tokens)


def _train_demo_model():
    """Fallback trainer used only when no .pkl artifacts are present."""
    ML_DIR.mkdir(parents=True, exist_ok=True)

    if SAMPLE_DATA_PATH.exists():
        df = pd.read_csv(SAMPLE_DATA_PATH)
    else:
        # Minimal inline fallback so the app can never fail to boot
        df = pd.DataFrame(
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

    def label_from_rating(r):
        if r >= 4:
            return "Positive"
        if r <= 2:
            return "Negative"
        return "Neutral"

    df["clean"] = df["review_text"].apply(clean_text)
    df["label"] = df["rating"].apply(label_from_rating)

    vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2))
    X = vectorizer.fit_transform(df["clean"])
    y = df["label"]

    if len(df) >= 10 and y.nunique() > 1:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        X_train, y_train = X, y

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    return model, vectorizer


def _load():
    global _model, _vectorizer
    if _model is not None and _vectorizer is not None:
        return _model, _vectorizer

    if MODEL_PATH.exists() and VECTORIZER_PATH.exists():
        _model = joblib.load(MODEL_PATH)
        _vectorizer = joblib.load(VECTORIZER_PATH)
    else:
        _model, _vectorizer = _train_demo_model()

    return _model, _vectorizer


def _polarity_from_label(label: str, confidence: float) -> float:
    """Map classifier confidence to a signed polarity score in [-1, 1]."""
    if label == "Positive":
        return round(confidence, 3)
    if label == "Negative":
        return round(-confidence, 3)
    return round((confidence - 0.5) * 0.4, 3)  # small wobble around 0 for Neutral


def predict_new_review(review_text: str):
    """Classify a single review. Returns (label, polarity_score, cleaned_text)."""
    model, vectorizer = _load()
    cleaned = clean_text(review_text)
    features = vectorizer.transform([cleaned])

    label = model.predict(features)[0]

    try:
        proba = model.predict_proba(features)[0]
        classes = list(model.classes_)
        confidence = float(proba[classes.index(label)])
    except AttributeError:
        confidence = 0.75  # model without predict_proba support

    polarity = _polarity_from_label(label, confidence)
    return label, polarity, cleaned


def get_top_words(texts, top_n: int = 15):
    """Return the most frequent words across a list of raw review texts."""
    from collections import Counter

    counter = Counter()
    for t in texts:
        counter.update(clean_text(t).split())
    return counter.most_common(top_n)
