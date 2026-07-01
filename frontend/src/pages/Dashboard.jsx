import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Navbar from "../components/Navbar.jsx";
import KPICard from "../components/KPICard.jsx";
import Loader from "../components/Loader.jsx";
import { endpoints } from "../api/axios.js";
import { HiOutlineStar, HiOutlineFaceSmile, HiOutlineFaceFrown } from "react-icons/hi2";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.dashboard();
      setData(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not reach the API. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar
        title="Dashboard"
        subtitle="Live overview of customer sentiment across all reviews"
      />

      <div className="p-6 md:p-8 space-y-8">
        {loading && <Loader label="Crunching the numbers..." />}

        {!loading && error && (
          <div className="glass p-6 text-sentiment-negative text-sm">{error}</div>
        )}

        {!loading && data && (
          <>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <KPICard
                label="Total Reviews"
                value={data.kpis.total_reviews}
                tone="accent"
                icon={HiOutlineStar}
              />
              <KPICard
                label="Average Rating"
                value={data.kpis.average_rating}
                suffix="/ 5"
                tone="accent"
                icon={HiOutlineStar}
              />
              <KPICard
                label="Positive"
                value={data.kpis.positive_pct}
                suffix="%"
                tone="positive"
                icon={HiOutlineFaceSmile}
              />
              <KPICard
                label="Negative"
                value={data.kpis.negative_pct}
                suffix="%"
                tone="negative"
                icon={HiOutlineFaceFrown}
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass p-6">
                <h2 className="font-display font-semibold mb-4">Rating Distribution</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.rating_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2540" />
                    <XAxis dataKey="rating" stroke="#8B92B2" fontSize={12} />
                    <YAxis stroke="#8B92B2" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#111627",
                        border: "1px solid #1E2540",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="#7C5CFF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass p-6">
                <h2 className="font-display font-semibold mb-4">Sentiment Trend</h2>
                {data.sentiment_trend.length === 0 ? (
                  <p className="text-sm text-ink-muted py-16 text-center">
                    Not enough dated data yet to plot a trend.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data.sentiment_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2540" />
                      <XAxis dataKey="date" stroke="#8B92B2" fontSize={11} />
                      <YAxis stroke="#8B92B2" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#111627",
                          border: "1px solid #1E2540",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="positive" stroke="#34D399" strokeWidth={2} />
                      <Line type="monotone" dataKey="negative" stroke="#FB7185" strokeWidth={2} />
                      <Line type="monotone" dataKey="neutral" stroke="#FBBF24" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WordCloudPanel
                title="Top Words in Positive Reviews"
                words={data.top_positive_words}
                tone="positive"
              />
              <WordCloudPanel
                title="Top Words in Negative Reviews"
                words={data.top_negative_words}
                tone="negative"
              />
            </div>

            <div className="glass p-6">
              <h2 className="font-display font-semibold mb-4">Recent Reviews</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-muted border-b border-base-border">
                      <th className="py-2 pr-4 font-medium">Review</th>
                      <th className="py-2 pr-4 font-medium">Product</th>
                      <th className="py-2 pr-4 font-medium">Rating</th>
                      <th className="py-2 pr-4 font-medium">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_reviews.map((r) => (
                      <tr key={r.review_id} className="border-b border-base-border/50">
                        <td className="py-2.5 pr-4 max-w-md truncate text-ink-primary">
                          {r.review_text}
                        </td>
                        <td className="py-2.5 pr-4 text-ink-muted">
                          {r.product_name || "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-ink-muted">
                          {r.rating ? `${r.rating}★` : "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <SentimentPill label={r.sentiment_label} />
                        </td>
                      </tr>
                    ))}
                    {data.recent_reviews.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-ink-muted">
                          No reviews yet. Try Predict Review or Upload Reviews.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass p-6">
              <h2 className="font-display font-semibold mb-4">Power BI Report</h2>
              <div className="rounded-xl overflow-hidden border border-base-border aspect-video">
                <iframe
                  title="Power BI Dashboard"
                  src={data.powerbi_embed_url}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
              <p className="text-xs text-ink-faint mt-3">
                Set POWERBI_EMBED_URL in the backend .env to point this at your
                published report.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WordCloudPanel({ title, words, tone }) {
  const color = tone === "positive" ? "text-sentiment-positive" : "text-sentiment-negative";
  const bg = tone === "positive" ? "bg-sentiment-positive/10" : "bg-sentiment-negative/10";

  return (
    <div className="glass p-6">
      <h2 className="font-display font-semibold mb-4">{title}</h2>
      {words.length === 0 ? (
        <p className="text-sm text-ink-muted py-8 text-center">No data yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {words.map((w) => (
            <span
              key={w.word}
              className={`px-3 py-1.5 rounded-full text-xs font-mono ${bg} ${color}`}
              style={{ fontSize: `${Math.min(11 + w.count, 16)}px` }}
            >
              {w.word} · {w.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentPill({ label }) {
  if (!label) return <span className="text-ink-faint text-xs">—</span>;
  const styles = {
    Positive: "bg-sentiment-positive/15 text-sentiment-positive",
    Negative: "bg-sentiment-negative/15 text-sentiment-negative",
    Neutral: "bg-sentiment-neutral/15 text-sentiment-neutral",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[label]}`}>
      {label}
    </span>
  );
}
