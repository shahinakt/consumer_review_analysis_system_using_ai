import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HiOutlineSignal } from "react-icons/hi2";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      const from = location.state?.from?.pathname;
      const destination = from || (user.role === "ADMIN" ? "/" : "/home");
      navigate(destination, { replace: true });
    } catch (err) {
      setServerError(
        err?.response?.data?.detail || "Login failed. Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent mb-3">
            <HiOutlineSignal size={24} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-ink-muted mt-1">Sign in to PulseBoard to continue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="glass p-7 md:p-8 space-y-5">
          {serverError && (
            <div className="rounded-xl border border-sentiment-negative/30 bg-sentiment-negative/10 text-sentiment-negative text-sm px-4 py-3">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-primary mb-1.5">
              Email
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-base-bg/50 border text-sm text-ink-primary placeholder:text-ink-faint outline-none transition-colors ${
                  errors.email ? "border-sentiment-negative" : "border-base-border focus:border-accent"
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-sentiment-negative mt-1.5">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-primary mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-11 pr-11 py-2.5 rounded-xl bg-base-bg/50 border text-sm text-ink-primary placeholder:text-ink-faint outline-none transition-colors ${
                  errors.password ? "border-sentiment-negative" : "border-base-border focus:border-accent"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-sentiment-negative mt-1.5">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent hover:bg-accent-soft transition-colors text-white text-sm font-medium rounded-xl px-5 py-2.5 disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-accent hover:text-accent-soft font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
