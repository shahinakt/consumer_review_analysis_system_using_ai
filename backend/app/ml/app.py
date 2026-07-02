from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load trained model
model = joblib.load("sentiment_naive_bayes.pkl")


@app.route("/")
def home():
    return jsonify({"message": "Sentiment Analysis API is Running"})


@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    product_name = data["product_name"]
    category = data["category"]
    review_text = data["review_text"]

    combined_text = (
        f"Product: {product_name}. "
        f"Category: {category}. "
        f"Review: {review_text}"
    )

    prediction = model.predict([combined_text])[0]

    # -----------------------------
    # Convert NumPy values
    # -----------------------------
    if isinstance(prediction, np.integer):
        prediction = int(prediction)

    if isinstance(prediction, np.floating):
        prediction = float(prediction)

    # If labels were encoded
    if prediction == 0:
        prediction = "Negative"
    elif prediction == 1:
        prediction = "Neutral"
    elif prediction == 2:
        prediction = "Positive"

    return jsonify({
        "product_name": product_name,
        "category": category,
        "review_text": review_text,
        "predicted_sentiment": prediction
    })


if __name__ == "__main__":
    app.run(debug=True)