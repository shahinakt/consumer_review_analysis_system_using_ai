import re
import string
from pathlib import Path

try:
    import joblib
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
except ImportError:  # pragma: no cover - runtime fallback for minimal environments
    joblib = None
    TfidfVectorizer = None
    LogisticRegression = None
    train_test_split = None

from app.ml.train_sample_model import train_and_save_model

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
    return train_and_save_model()


def _heuristic_predict(review_text: str):
    cleaned = clean_text(review_text)
    lower = cleaned.lower()

    positive_hits = any(
        word in lower for word in ["good", "great", "love", "excellent", "amazing", "perfect", "fast", "happy", "recommend", "impressed", "durable", "quality"]
    )
    negative_hits = any(
        word in lower for word in ["bad", "terrible", "poor", "slow", "disappointed", "broken", "damaged", "refund", "late", "support", "issue", "waste", "hate"]
    )

    if negative_hits and not positive_hits:
        label = "Negative"
        confidence = 0.9
    elif positive_hits and not negative_hits:
        label = "Positive"
        confidence = 0.9
    else:
        label = "Neutral"
        confidence = 0.6

    polarity = _polarity_from_label(label, confidence)
    return label, polarity, cleaned


def _load():
    global _model, _vectorizer
    if _model is not None and _vectorizer is not None:
        return _model, _vectorizer

    if joblib is not None and MODEL_PATH.exists() and VECTORIZER_PATH.exists():
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

    if model is None or vectorizer is None:
        return _heuristic_predict(review_text)

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


