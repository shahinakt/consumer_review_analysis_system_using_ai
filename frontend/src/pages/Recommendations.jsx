import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import Loader from "../components/Loader.jsx";
import { endpoints } from "../api/axios.js";
import { HiOutlineSparkles, HiOutlineLightBulb } from "react-icons/hi2";

export default function Recommendations() {
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
      const res = await endpoints.recommendations();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar
        title="Recommendations"
        subtitle="AI-style executive summary and rule-based action items"
      />

      <div className="p-6 md:p-8 space-y-6">
        {loading && <Loader label="Generating insights..." />}

        {!loading && error && (
          <div className="glass p-6 text-sentiment-negative text-sm">{error}</div>
        )}

        {!loading && data && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 border border-accent/20"
            >
              <div className="flex items-center gap-2 mb-3 text-accent">
                <HiOutlineSparkles size={18} />
                <h2 className="font-display font-semibold">Executive Summary</h2>
              </div>
              <p className="text-sm text-ink-primary leading-relaxed">
                {data.executive_summary}
              </p>
              <p className="text-xs text-ink-faint mt-4">
                Generated {new Date(data.generated_at).toLocaleString()}
              </p>
            </motion.div>

            <div className="glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineLightBulb size={18} className="text-sentiment-neutral" />
                <h2 className="font-display font-semibold">Business Recommendations</h2>
              </div>
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No recommendations yet -- classify or upload some reviews first.
                </p>
              ) : (
                <ol className="space-y-3">
                  {data.recommendations.map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3 text-sm bg-base-bg/40 border border-base-border rounded-xl p-4"
                    >
                      <span className="font-mono text-accent shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-ink-primary">{rec}</span>
                    </motion.li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
