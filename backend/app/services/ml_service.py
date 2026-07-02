import re
import string
from pathlib import Path

try:
    import joblib
except ImportError:  # pragma: no cover - runtime fallback for minimal envs
    joblib = None

ML_DIR = Path(__file__).resolve().parent.parent / "ml"
MODEL_PATH = ML_DIR / "sentiment_naive_bayes.pkl"

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "at",
    "for", "with", "this", "that", "it", "i", "my", "me", "we", "you",
    "your", "as", "by", "from", "not", "no", "do", "did", "does", "have",
    "has", "had", "will", "would", "can", "could", "should", "just", "very",
}

_model = None
_model_load_attempted = False


def clean_text(text: str) -> str:
    """Lowercase, strip punctuation/digits, remove stopwords (for storage + word clouds)."""
    text = str(text).lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = [t for t in text.split() if t and t not in STOPWORDS]
    return " ".join(tokens)


def _load_model():
    """Lazily load the trained pipeline. Cached after first call."""
    global _model, _model_load_attempted
    if _model is not None or _model_load_attempted:
        return _model

    _model_load_attempted = True
    if joblib is not None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
    return _model


def _heuristic_predict(review_text: str):
    """Keyword fallback used only if sentiment_naive_bayes.pkl is missing,
    so the API never fails to boot for lack of a model file."""
    cleaned = clean_text(review_text)

    positive_hits = any(
        w in cleaned for w in ["good", "great", "love", "excellent", "amazing", "perfect", "happy", "recommend", "quality"]
    )
    negative_hits = any(
        w in cleaned for w in ["bad", "terrible", "poor", "disappointed", "broken", "damaged", "refund", "issue", "waste", "hate"]
    )

    if negative_hits and not positive_hits:
        label, confidence = "Negative", 0.9
    elif positive_hits and not negative_hits:
        label, confidence = "Positive", 0.9
    else:
        label, confidence = "Neutral", 0.6

    return label, _polarity_from_label(label, confidence), cleaned


def _polarity_from_label(label: str, confidence: float) -> float:
    """Map classifier confidence to a signed polarity score in [-1, 1]."""
    if label == "Positive":
        return round(confidence, 3)
    if label == "Negative":
        return round(-confidence, 3)
    return round((confidence - 0.5) * 0.4, 3)  # small wobble around 0 for Neutral


def _build_model_input(review_text: str, product_name: str = None, category: str = None) -> str:
    """Match the format the ML teammate trained on: 'Product: X. Category: Y. Review: Z'.
    Falls back to raw review text if product/category aren't available."""
    if not product_name and not category:
        return review_text
    return (
        f"Product: {product_name or 'Unknown'}. "
        f"Category: {category or 'Unknown'}. "
        f"Review: {review_text}"
    )


def predict_new_review(review_text: str, product_name: str = None, category: str = None):
    """Classify a single review. Returns (label, polarity_score, cleaned_text)."""
    cleaned = clean_text(review_text)
    model = _load_model()

    if model is None:
        return _heuristic_predict(review_text)

    model_input = _build_model_input(review_text, product_name, category)
    label = model.predict([model_input])[0]

    try:
        proba = model.predict_proba([model_input])[0]
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
