import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineSignal } from "react-icons/hi2";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = "Name must be at least 2 characters.";
    }
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!form.password) {
      next.password = "Password is required.";
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    } else if (!/\d/.test(form.password) || !/[a-zA-Z]/.test(form.password)) {
      next.password = "Password must include a letter and a number.";
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await signup(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.role);
      navigate(user.role === "ADMIN" ? "/" : "/home", { replace: true });
    } catch (err) {
      setServerError(
        err?.response?.data?.detail || "Signup failed. Please check your details and try again."
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
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-ink-muted mt-1">Join PulseBoard as an Admin or a User</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="glass p-7 md:p-8 space-y-5">
          {serverError && (
            <div className="rounded-xl border border-sentiment-negative/30 bg-sentiment-negative/10 text-sentiment-negative text-sm px-4 py-3">
              {serverError}
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-1.5">I am signing up as</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "USER", label: "User", desc: "Try sentiment predictions" },
                { value: "ADMIN", label: "Admin", desc: "Full analytics dashboard" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => updateField("role", opt.value)}
                  className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                    form.role === opt.value
                      ? "border-accent bg-accent/10"
                      : "border-base-border hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HiOutlineShieldCheck
                      size={16}
                      className={form.role === opt.value ? "text-accent" : "text-ink-faint"}
                    />
                    <span className="text-sm font-medium text-ink-primary">{opt.label}</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink-primary mb-1.5">
              Full name
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Jane Doe"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-base-bg/50 border text-sm text-ink-primary placeholder:text-ink-faint outline-none transition-colors ${
                  errors.name ? "border-sentiment-negative" : "border-base-border focus:border-accent"
                }`}
              />
            </div>
            {errors.name && <p className="text-xs text-sentiment-negative mt-1.5">{errors.name}</p>}
          </div>

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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="At least 8 characters"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-primary mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-base-bg/50 border text-sm text-ink-primary placeholder:text-ink-faint outline-none transition-colors ${
                  errors.confirmPassword ? "border-sentiment-negative" : "border-base-border focus:border-accent"
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-sentiment-negative mt-1.5">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent hover:bg-accent-soft transition-colors text-white text-sm font-medium rounded-xl px-5 py-2.5 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:text-accent-soft font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
