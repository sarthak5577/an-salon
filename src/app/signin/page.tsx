"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({ name: "", email: "", phone: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const url = tab === "signin" ? "/api/auth/customer/login" : "/api/auth/customer/register";
      const body = tab === "signin" ? { email: data.email, password: data.password } : data;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong."); return; }
      router.push("/my-appointments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-logo">AN Salon</Link>
          <p className="auth-subtitle">Your beauty appointment manager</p>
        </div>

        <div className="booking-tabs-nav" role="tablist">
          <button
            id="tab-signin"
            role="tab"
            aria-selected={tab === "signin"}
            className={`booking-tab-pill ${tab === "signin" ? "active-signin" : ""}`}
            onClick={() => { setTab("signin"); setError(""); }}
          >
            🔑 Sign In
          </button>
          <button
            id="tab-register"
            role="tab"
            aria-selected={tab === "register"}
            className={`booking-tab-pill ${tab === "register" ? "active-register" : ""}`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            ✨ Register
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          {tab === "register" && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input id="name" className="form-input" type="text" autoComplete="name" required value={data.name} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address *</label>
            <input id="email" className="form-input" type="email" autoComplete="email" inputMode="email" required value={data.email} onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} />
          </div>
          {tab === "register" && (
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <input id="phone" className="form-input" type="tel" autoComplete="tel" inputMode="tel" required value={data.phone} onChange={(e) => setData((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password *</label>
            <input id="password" className="form-input" type="password" autoComplete={tab === "signin" ? "current-password" : "new-password"} required value={data.password} onChange={(e) => setData((p) => ({ ...p, password: e.target.value }))} />
            {tab === "register" && <span className="form-hint">Minimum 8 characters</span>}
          </div>

          <button className="btn btn-gold btn-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Processing…</> : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ fontSize: ".85rem", color: "var(--text-muted)", textAlign: "center", marginTop: "1rem" }}>
          <Link href="/" style={{ color: "var(--gold-dark)" }}>← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
