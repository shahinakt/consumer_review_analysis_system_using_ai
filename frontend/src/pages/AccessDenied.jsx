import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineShieldExclamation } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext.jsx";

export default function AccessDenied() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-sentiment-negative/10 text-sentiment-negative flex items-center justify-center mx-auto mb-5">
          <HiOutlineShieldExclamation size={28} />
        </div>
        <h1 className="font-display text-xl font-semibold mb-2">403 &mdash; Access Denied</h1>
        <p className="text-sm text-ink-muted mb-6">
          You don&apos;t have permission to view this page. This area is restricted to Admin
          accounts.
        </p>
        <Link
          to={isAdmin ? "/" : "/home"}
          className="inline-block bg-accent hover:bg-accent-soft transition-colors text-white text-sm font-medium rounded-xl px-6 py-2.5"
        >
          Back to safety
        </Link>
      </div>
    </div>
  );
}
