"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Service = {
  id: number;
  category: string;
  name: string;
  description: string;
  duration_min: number | null;
  price_inr: number | null;
  is_placeholder: number;
};

type User = {
  sub: string;
  name: string;
  email: string;
  role: "customer" | "manager";
} | null;

// ── Nav ────────────────────────────────────────────────────────────────────

function Nav({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            AN<span> Salon</span>
          </Link>
          <div className="nav-links" role="list">
            <Link href="#services" className="nav-link">Services</Link>
            <Link href="#about" className="nav-link">About</Link>
            <Link href="#contact" className="nav-link">Contact</Link>
            <Link href="#booking" className="nav-link">Book</Link>
          </div>
          <div className="nav-actions">
            {user ? (
              user.role === "manager" ? (
                <Link href="/dashboard" className="btn btn-gold btn-sm">Dashboard</Link>
              ) : (
                <>
                  <Link href="/my-appointments" className="btn btn-ghost btn-sm">My Bookings</Link>
                  <button onClick={onLogout} className="btn btn-outline btn-sm">Sign Out</button>
                </>
              )
            ) : (
              <>
                <Link href="/signin" className="btn btn-ghost btn-sm" style={{ color: "rgba(255,255,255,.8)" }}>Sign In</Link>
                <Link href="#booking" className="btn btn-gold btn-sm">Book Now</Link>
              </>
            )}
            <button
              className="hamburger"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Mobile navigation">
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "#fff", fontSize: "1.5rem" }}
        >✕</button>
        <a href="#services" onClick={() => setOpen(false)}>Services</a>
        <a href="#about" onClick={() => setOpen(false)}>About</a>
        <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
        <a href="#booking" onClick={() => setOpen(false)}>Book</a>
        {user ? (
          user.role === "manager" ? (
            <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
          ) : (
            <>
              <Link href="/my-appointments" onClick={() => setOpen(false)}>My Bookings</Link>
              <button onClick={() => { onLogout(); setOpen(false); }} style={{ color: "rgba(255,255,255,.5)", fontSize: "1rem" }}>Sign Out</button>
            </>
          )
        ) : (
          <>
            <Link href="/signin" onClick={() => setOpen(false)}>Sign In</Link>
            <a href="#booking" onClick={() => setOpen(false)}>Book Now</a>
          </>
        )}
      </div>
    </>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero({ user }: { user: User }) {
  return (
    <section className="hero" id="home">
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <p className="hero-eyebrow">✦ Kharadi, Pune · अन सैलून</p>
        <h1 className="hero-title">
          Your Premier<br /><em>Beauty Destination</em>
        </h1>
        <p className="hero-subtitle">
          Luxury hair, beauty, and wellness services for everyone — in a welcoming, inclusive space in the heart of Kharadi, Pune.
        </p>
        <div className="hero-actions">
          <a href="#booking" className="btn btn-gold btn-lg">
            Book an Appointment
          </a>
          <a href="#services" className="btn btn-outline-gold btn-lg">
            View Services
          </a>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-item">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Kharadi, Pune
          </div>
          <div className="hero-meta-item">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            080 6452 6928
          </div>
          <div className="hero-meta-item">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Appointments & Walk-ins
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Services ────────────────────────────────────────────────────────────────

function ServicesSection({ services }: { services: Service[] }) {
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <section id="services" style={{ background: "#fff" }}>
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">What We Offer</span>
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            AN Salon offers a full range of hair, beauty, skin care, and wellness services — for everyone.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {categories.map((cat) => (
            <div key={cat}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1rem", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold-dark)", fontFamily: "var(--font-sans)", fontWeight: 700 }}>{cat}</h3>
              <div className="services-grid">
                {services.filter((s) => s.category === cat).map((svc) => (
                  <div key={svc.id} className="service-card">
                    {svc.is_placeholder === 1 && (
                      <span className="placeholder-notice" title="Sample entry — the manager can update details">Sample entry</span>
                    )}
                    <div className="service-card-category">{svc.category}</div>
                    <h3 className="service-card-name">{svc.name}</h3>
                    <p className="service-card-desc">{svc.description}</p>
                    <div className="service-card-meta">
                      {svc.price_inr ? (
                        <span className="service-card-price">₹{svc.price_inr.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="service-card-duration" style={{ fontStyle: "italic" }}>Price on request</span>
                      )}
                      {svc.duration_min && (
                        <span className="service-card-duration">~{svc.duration_min} min</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: ".9rem", marginBottom: "1rem" }}>
            Prices and durations marked "Sample entry" are placeholders — the salon manager can update them from the dashboard.
            Call <a href="tel:+918064526928" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>080 6452 6928</a> for current pricing.
          </p>
          <a href="#booking" className="btn btn-gold">Book an Appointment</a>
        </div>
      </div>
    </section>
  );
}

// ── About ────────────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="about" style={{ background: "var(--warm-gray)" }}>
      <div className="container">
        <div className="about-grid">
          <div>
            <span className="section-eyebrow">About Us</span>
            <h2 className="section-title">AN Salon — अन सैलून</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
              Welcome to <strong>AN Salon</strong>, Pune's premier destination for complete hair, beauty, and wellness transformation. As a luxury unisex salon, we believe that everyone deserves to look and feel like the absolute best version of themselves.
            </p>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
              Whether you are looking for a classic haircut, a bold new look, or flawless long-term beauty solutions, we blend artistry, premium products, and top-tier expertise to deliver an unparalleled salon experience.
            </p>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
              At AN Salon, you aren't just another appointment on our calendar — you are our absolute priority. Our philosophy is anchored in a simple, unwavering commitment: <strong>100% Customer Satisfaction</strong>.
            </p>

            <div className="about-features">
              <div className="about-feature">
                <div className="about-feature-icon" aria-hidden="true">🏳️‍🌈</div>
                <div className="about-feature-text">
                  <h4>LGBTQ+ Friendly</h4>
                  <p>AN Salon is a welcoming, inclusive space for all clients.</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="about-feature-icon" aria-hidden="true">👩‍💼</div>
                <div className="about-feature-text">
                  <h4>Women-Owned</h4>
                  <p>This business is proudly identified as women-owned.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontFamily: "var(--font-sans)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>Appointments & Walk-ins</h3>
                <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.7 }}>
                  Appointments are required for scheduled services — use our online booking form below. Walk-ins are also welcome, subject to the salon's current availability. Call us to check before visiting.
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontFamily: "var(--font-sans)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>Payment Methods</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                  {["Credit Card", "Debit Card", "Google Pay", "NFC / Contactless"].map((m) => (
                    <span key={m} className="badge badge-gold">{m}</span>
                  ))}
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: ".85rem", marginTop: ".75rem" }}>
                  Payments are accepted in person at the salon only. Online payment is not available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Amenities ────────────────────────────────────────────────────────────────

function AmenitiesSection({ settings }: { settings: Record<string, string> }) {
  const amenities = [
    { icon: "♿", label: "Wheelchair-Accessible Entrance" },
    { icon: "☕", label: "Beverages Available" },
    { icon: "🚻", label: "Restroom On-site" },
    { icon: "📶", label: "Free Wi-Fi" },
    { icon: "👶", label: "Good for Kids" },
    { icon: "🅿️", label: "Free Street & On-site Parking" },
    { icon: "✂️", label: "On-site Services" },
    { icon: "🏳️‍🌈", label: "LGBTQ+ Friendly" },
  ];

  return (
    <section className="amenities-section" id="amenities">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Amenities & Access</span>
          <h2 className="section-title">Your Comfort, Our Priority</h2>
        </div>

        <div className="amenities-grid" role="list">
          {amenities.map((a) => (
            <div key={a.label} className="amenity-card" role="listitem">
              <div className="amenity-icon" aria-hidden="true">{a.icon}</div>
              <div className="amenity-label">{a.label}</div>
            </div>
          ))}
        </div>

        {settings.walkin_status && (
          <div className="alert alert-info" style={{ marginTop: "2rem" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span><strong>Walk-ins: </strong>{settings.walkin_status}</span>
          </div>
        )}

        {settings.hours_note && (
          <div className="alert alert-warning" style={{ marginTop: "1rem" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span><strong>Hours: </strong>{settings.hours_note}</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Booking section ──────────────────────────────────────────────────────────

type Appointment = {
  id: number;
  service_id: number;
  appt_date: string;
  appt_time: string;
  notes?: string;
  service_name: string;
  status: string;
};

function BookingSection({
  user,
  services,
  settings,
}: {
  user: User;
  services: Service[];
  settings: Record<string, string>;
}) {
  const [tab, setTab] = useState<"signin" | "register" | "book">(
    user ? "book" : "signin"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Appointment | null>(null);

  // booking form
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState<string[]>([]);

  // times 10:00 – 20:30 in 30-min slots
  const ALL_TIMES = Array.from({ length: 22 }, (_, i) => {
    const h = Math.floor(i / 2) + 10;
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) setTab("book");
  }, [user]);

  useEffect(() => {
    if (!date) return;
    fetch(`/api/availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => setBooked(d.booked || []));
  }, [date]);

  // Auth
  const [authData, setAuthData] = useState({ name: "", email: "", phone: "", password: "" });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const url = tab === "signin" ? "/api/auth/customer/login" : "/api/auth/customer/register";
      const body = tab === "signin"
        ? { email: authData.email, password: authData.password }
        : authData;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, appt_date: date, appt_time: time, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Booking failed."); return; }
      setSuccess(data.appointment);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="booking-section" id="booking">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Online Booking</span>
          <h2 className="section-title">Book an Appointment</h2>
          <p className="section-subtitle">
            Appointments are required for scheduled services. Walk-ins are also welcome — call us to check availability.
          </p>
        </div>

        {settings.booking_notice && (
          <div className="alert alert-info" style={{ marginBottom: "1.5rem", maxWidth: 600, margin: "0 auto 1.5rem" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {settings.booking_notice}
          </div>
        )}

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {success ? (
            <div className="confirmation-box">
              <div className="confirmation-icon" aria-hidden="true">✓</div>
              <h3 className="serif" style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>Booking Confirmed!</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Your appointment request has been submitted.
              </p>
              <div style={{ background: "#fff", borderRadius: "var(--radius-md)", padding: "1rem", textAlign: "left", marginBottom: "1.5rem", fontSize: ".9rem" }}>
                <div style={{ display: "grid", gap: ".5rem" }}>
                  <div><strong>Service:</strong> {success.service_name}</div>
                  <div><strong>Date:</strong> {new Date(success.appt_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                  <div><strong>Time:</strong> {success.appt_time}</div>
                  <div><strong>Status:</strong> <span className="badge badge-pending">Pending confirmation</span></div>
                </div>
              </div>
              <p style={{ fontSize: ".875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                We will confirm your appointment shortly. If you have questions, call us at{" "}
                <a href="tel:+918064526928" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>080 6452 6928</a>.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link href="/my-appointments" className="btn btn-gold btn-sm">View My Bookings</Link>
                <button onClick={() => { setSuccess(null); setServiceId(""); setDate(""); setTime(""); setNotes(""); }} className="btn btn-outline btn-sm">Book Another</button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                {!user ? (
                  <>
                    <div className="tabs" role="tablist">
                      <button id="tab-signin" role="tab" aria-selected={tab === "signin"} className={`tab-btn${tab === "signin" ? " active" : ""}`} onClick={() => { setTab("signin"); setError(""); }}>Sign In</button>
                      <button id="tab-register" role="tab" aria-selected={tab === "register"} className={`tab-btn${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Register</button>
                    </div>

                    <form onSubmit={handleAuth} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {error && <div className="alert alert-error" role="alert">{error}</div>}

                      {tab === "register" && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="reg-name">Full Name *</label>
                          <input id="reg-name" className="form-input" type="text" autoComplete="name" required value={authData.name} onChange={(e) => setAuthData((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                      )}
                      <div className="form-group">
                        <label className="form-label" htmlFor="auth-email">Email Address *</label>
                        <input id="auth-email" className="form-input" type="email" autoComplete="email" inputMode="email" required value={authData.email} onChange={(e) => setAuthData((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                      {tab === "register" && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="reg-phone">Phone Number *</label>
                          <input id="reg-phone" className="form-input" type="tel" autoComplete="tel" inputMode="tel" required value={authData.phone} onChange={(e) => setAuthData((p) => ({ ...p, phone: e.target.value }))} />
                        </div>
                      )}
                      <div className="form-group">
                        <label className="form-label" htmlFor="auth-pass">Password *</label>
                        <input id="auth-pass" className="form-input" type="password" autoComplete={tab === "signin" ? "current-password" : "new-password"} required value={authData.password} onChange={(e) => setAuthData((p) => ({ ...p, password: e.target.value }))} />
                        {tab === "register" && <span className="form-hint">Minimum 8 characters</span>}
                      </div>
                      <button className="btn btn-gold btn-full" type="submit" disabled={loading}>
                        {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Processing…</> : tab === "signin" ? "Sign In & Book" : "Create Account & Book"}
                      </button>
                      <p style={{ fontSize: ".85rem", color: "var(--text-muted)", textAlign: "center" }}>
                        {tab === "signin" ? "No account? " : "Already registered? "}
                        <button type="button" style={{ color: "var(--gold-dark)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }} onClick={() => setTab(tab === "signin" ? "register" : "signin")}>
                          {tab === "signin" ? "Create one free" : "Sign in"}
                        </button>
                      </p>
                    </form>
                  </>
                ) : (
                  <form onSubmit={handleBook} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <p style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>
                      Booking as <strong>{user.name}</strong>. <Link href="/my-appointments" style={{ color: "var(--gold-dark)" }}>View your bookings</Link>
                    </p>

                    {error && <div className="alert alert-error" role="alert">{error}</div>}

                    <div className="form-group">
                      <label className="form-label" htmlFor="book-service">Service *</label>
                      <select id="book-service" className="form-select" required value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                        <option value="">Select a service…</option>
                        {[...new Set(services.map((s) => s.category))].map((cat) => (
                          <optgroup key={cat} label={cat}>
                            {services.filter((s) => s.category === cat).map((svc) => (
                              <option key={svc.id} value={svc.id}>
                                {svc.name}{svc.duration_min ? ` (~${svc.duration_min} min)` : ""}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="book-date">Date *</label>
                      <input id="book-date" className="form-input" type="date" required min={todayStr} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
                    </div>

                    {date && (
                      <div className="form-group">
                        <label className="form-label">Time Slot * <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: ".8rem" }}>(crossed out = already booked)</span></label>
                        <div className="time-grid" role="group" aria-label="Available time slots">
                          {ALL_TIMES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`time-btn${time === t ? " selected" : ""}`}
                              disabled={booked.includes(t)}
                              onClick={() => setTime(t)}
                              aria-pressed={time === t}
                              aria-label={`${t}${booked.includes(t) ? " — unavailable" : ""}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label" htmlFor="book-notes">Notes (optional)</label>
                      <textarea id="book-notes" className="form-textarea" rows={3} placeholder="Any preferences or special requests…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    <button className="btn btn-gold btn-full" type="submit" disabled={loading || !serviceId || !date || !time}>
                      {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Booking…</> : "Confirm Appointment"}
                    </button>
                    <p style={{ fontSize: ".825rem", color: "var(--text-muted)", textAlign: "center" }}>
                      Payment is collected at the salon. We accept cards, Google Pay, and NFC payments.
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────

function ContactSection() {
  const mapsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=Shop+No.+13+Global+High+Street+Building+Global+Precioso+Road+Kharadi+Pune+Maharashtra+411014";

  return (
    <section id="contact" style={{ background: "#fff" }}>
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Find Us</span>
          <h2 className="section-title">Contact & Location</h2>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-item-icon" aria-hidden="true">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="contact-item-text">
                <h4>Address</h4>
                <p style={{ color: "var(--text)", fontSize: ".95rem", lineHeight: 1.6 }}>
                  Shop No. 13, Global High Street Building,<br />
                  Global Precioso Road, below Malaka Spice,<br />
                  Kharadi, Pune, Maharashtra 411014
                </p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: ".75rem", display: "inline-flex" }}>
                  Get Directions ↗
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item-icon" aria-hidden="true">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div className="contact-item-text">
                <h4>Phone</h4>
                <a href="tel:+918064526928">080 6452 6928</a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item-icon" aria-hidden="true">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="contact-item-text">
                <h4>Hours</h4>
                <p style={{ color: "var(--text-muted)", fontSize: ".9rem" }}>
                  Open · Closes 9 pm<br />
                  <em>Full weekly schedule set by the manager — call to confirm.</em>
                </p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item-icon" aria-hidden="true">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </div>
              <div className="contact-item-text">
                <h4>WhatsApp</h4>
                <a href="https://wa.me/918928174494" target="_blank" rel="noopener noreferrer">+91 89281 74494</a>
              </div>
            </div>
          </div>

          {/* Embedded map via iframe */}
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", minHeight: "320px", border: "1px solid var(--border)" }}>
            <iframe
              title="AN Salon location map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3781.5!2d73.9521989!3d18.5573701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c3bf5a2a53e7%3A0x0!2sShop+No.+13%2C+Global+High+Street+Building%2C+Kharadi%2C+Pune!5e0!3m2!1sen!2sin!4v1!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 320 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Privacy ──────────────────────────────────────────────────────────────────

function PrivacySection() {
  return (
    <section id="privacy" style={{ background: "var(--warm-gray)" }}>
      <div className="container">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="section-header" style={{ textAlign: "left" }}>
            <span className="section-eyebrow">Privacy</span>
            <h2 className="section-title">Privacy Notice</h2>
          </div>
          <div className="prose card">
            <div className="card-body">
              <h3>What information we collect</h3>
              <p>When you create an account or book an appointment, we collect your name, email address, and phone number. We also store your appointment details (service selected, date, time, and any notes you provide).</p>

              <h3>How we use your information</h3>
              <ul>
                <li>To manage and confirm your appointment bookings.</li>
                <li>To contact you about your appointment (e.g., confirmation or changes).</li>
                <li>To allow the salon team to view appointment and contact details needed to manage your booking.</li>
              </ul>

              <h3>Who has access</h3>
              <p>Only authorised salon staff (managers) can view customer contact details and appointment records. Your information is not shared with third parties or used for marketing without your consent.</p>

              <h3>Data security</h3>
              <p>Passwords are stored using one-way hashing (bcrypt) and are never readable by anyone. Sessions are protected using signed tokens. Your data is stored on a private server and is not publicly accessible.</p>

              <h3>Contact</h3>
              <p>For any privacy questions, please call us at <a href="tel:+918064526928" style={{ color: "var(--gold-dark)" }}>080 6452 6928</a> or visit us at the salon.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">AN Salon</div>
            <p className="footer-desc">
              Luxury unisex beauty parlour in Kharadi, Pune. Welcoming everyone — every style, every identity.
            </p>
          </div>
          <div>
            <div className="footer-heading">Navigate</div>
            <div className="footer-links">
              <a href="#services" className="footer-link">Services</a>
              <a href="#about" className="footer-link">About</a>
              <a href="#amenities" className="footer-link">Amenities</a>
              <a href="#booking" className="footer-link">Book</a>
              <a href="#contact" className="footer-link">Contact</a>
              <a href="#privacy" className="footer-link">Privacy</a>
            </div>
          </div>
          <div>
            <div className="footer-heading">Contact</div>
            <div className="footer-links">
              <a href="tel:+918064526928" className="footer-link">080 6452 6928</a>
              <a href="https://wa.me/918928174494" target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp</a>
              <a href="https://www.ansalon.in" target="_blank" rel="noopener noreferrer" className="footer-link">ansalon.in</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AN Salon · अन सैलून, Kharadi, Pune</span>
          <div style={{ display: "flex", gap: "1rem" }}>
            <a href="#privacy" style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem" }}>Privacy</a>
            <Link href="/manager/login" style={{ color: "rgba(255,255,255,.3)", fontSize: ".8rem" }}>Staff</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<User>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [meRes, svcsRes, settingsRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/services"),
      fetch("/api/settings"),
    ]);
    const [me, svcs, stgs] = await Promise.all([meRes.json(), svcsRes.json(), settingsRes.json()]);
    setUser(me.user);
    setServices(svcs.services || []);
    setSettings(stgs.settings || {});
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <>
      <Nav user={user} onLogout={handleLogout} />
      <main className="page-main">
        <Hero user={user} />
        <ServicesSection services={services} />
        <AboutSection />
        <AmenitiesSection settings={settings} />
        <BookingSection user={user} services={services} settings={settings} />
        <ContactSection />
        <PrivacySection />
      </main>
      <Footer />
    </>
  );
}
