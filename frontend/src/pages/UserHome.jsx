import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { endpoints } from "../api/axios.js";
import { HiOutlineChatAlt2, HiOutlineSparkles } from "react-icons/hi";

const sentimentTone = {
  Positive: "text-sentiment-positive border-sentiment-positive/30 bg-sentiment-positive/10",
  Negative: "text-sentiment-negative border-sentiment-negative/30 bg-sentiment-negative/10",
  Neutral: "text-sentiment-neutral border-sentiment-neutral/30 bg-sentiment-neutral/10",
};

export default function UserHome() {
  const { user } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await endpoints.predict({
        review_text: reviewText.trim(),
        rating: rating ? Number(rating) : undefined,
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar title={`Welcome, ${user?.name || "there"}`} subtitle="Your PulseBoard home" />

      <div className="p-6 md:p-8 space-y-6 max-w-3xl">
        <div className="glass p-6">
          <div className="flex items-center gap-2 text-accent mb-2">
            <HiOutlineSparkles size={20} />
            <h2 className="font-display font-semibold">You're signed in as a User</h2>
          </div>
          <p className="text-sm text-ink-muted">
            The full analytics dashboard is reserved for Admin accounts. As a User, you can try
            out the live sentiment prediction tool below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HiOutlineChatAlt2 size={20} className="text-accent" />
            <h3 className="font-display font-semibold">Try a review</h3>
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            placeholder="Paste or write a customer review here..."
            className="w-full px-4 py-3 rounded-xl bg-base-bg/50 border border-base-border focus:border-accent text-sm text-ink-primary placeholder:text-ink-faint outline-none transition-colors resize-none"
          />

          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-muted">Rating (optional)</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="px-3 py-2 rounded-lg bg-base-bg/50 border border-base-border text-sm text-ink-primary outline-none"
            >
              <option value="">--</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading || !reviewText.trim()}
              className="ml-auto bg-accent hover:bg-accent-soft transition-colors text-white text-sm font-medium rounded-xl px-5 py-2.5 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Sentiment"}
            </button>
          </div>

          {error && <p className="text-sm text-sentiment-negative">{error}</p>}
        </form>

        {result && (
          <div className={`glass p-6 border ${sentimentTone[result.sentiment_label] || ""}`}>
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Predicted sentiment</p>
            <p className="text-2xl font-display font-semibold">{result.sentiment_label}</p>
            <p className="text-sm text-ink-muted mt-2">
              Polarity score: <span className="font-mono">{result.polarity_score}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
