import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import { endpoints } from "../api/axios.js";
import { HiOutlinePaperAirplane } from "react-icons/hi2";

const sentimentStyles = {
  Positive: { text: "text-sentiment-positive", bg: "bg-sentiment-positive/10", border: "border-sentiment-positive/30" },
  Negative: { text: "text-sentiment-negative", bg: "bg-sentiment-negative/10", border: "border-sentiment-negative/30" },
  Neutral: { text: "text-sentiment-neutral", bg: "bg-sentiment-neutral/10", border: "border-sentiment-neutral/30" },
};

export default function PredictReview() {
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [rating, setRating] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await endpoints.predict({
        review_text: reviewText,
        customer_name: customerName || undefined,
        product_name: productName || undefined,
        rating: Number(rating),
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Prediction failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar
        title="Predict Review"
        subtitle="Classify a single review as Positive, Negative, or Neutral"
      />

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-muted mb-1.5 block">
              Review text
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              required
              placeholder="Paste or type a customer review..."
              className="w-full rounded-xl bg-base-bg/50 border border-base-border px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:border-accent outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink-muted mb-1.5 block">
                Customer name (optional)
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya Nair"
                className="w-full rounded-xl bg-base-bg/50 border border-base-border px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-muted mb-1.5 block">
                Product name (optional)
              </label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Wireless Earbuds Pro"
                className="w-full rounded-xl bg-base-bg/50 border border-base-border px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:border-accent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-muted mb-1.5 block">
              Rating: <span className="text-ink-primary font-mono">{rating}★</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full accent-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-soft transition-colors text-white font-medium text-sm rounded-xl py-2.5 disabled:opacity-50"
          >
            <HiOutlinePaperAirplane size={16} />
            {loading ? "Analyzing..." : "Classify Sentiment"}
          </button>

          {error && <p className="text-sentiment-negative text-sm">{error}</p>}
        </form>

        <div className="glass p-6 flex flex-col">
          <h2 className="font-display font-semibold mb-4">Result</h2>
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <p className="text-sm text-ink-muted flex-1 flex items-center justify-center text-center">
                Submit a review to see its predicted sentiment here.
              </p>
            )}
            {result && (
              <motion.div
                key={result.review_id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div
                  className={`rounded-2xl border p-5 ${sentimentStyles[result.sentiment_label].bg} ${sentimentStyles[result.sentiment_label].border}`}
                >
                  <p className="text-xs uppercase tracking-wider text-ink-muted mb-1">
                    Predicted sentiment
                  </p>
                  <p className={`font-display text-2xl font-semibold ${sentimentStyles[result.sentiment_label].text}`}>
                    {result.sentiment_label}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted mb-1">
                    Polarity score
                  </p>
                  <p className="font-mono text-lg">{result.polarity_score}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted mb-1">
                    Cleaned text (fed to the model)
                  </p>
                  <p className="text-sm text-ink-muted font-mono bg-base-bg/50 rounded-lg p-3 border border-base-border">
                    {result.cleaned_text}
                  </p>
                </div>

                <p className="text-xs text-ink-faint">Saved as review #{result.review_id}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
