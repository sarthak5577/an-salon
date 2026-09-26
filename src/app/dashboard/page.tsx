"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type Appointment = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: number;
  service_name: string;
  category: string;
  appt_date: string;
  appt_time: string;
  status: string;
  notes?: string;
  duration_min?: number;
  price_inr?: number;
  created_at: string;
  updated_at: string;
};

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

type Service = {
  id: number;
  category: string;
  name: string;
  description: string;
  duration_min: number | null;
  price_inr: number | null;
  is_placeholder: number;
  is_active: number;
};

type Settings = Record<string, string>;

type Tab = "appointments" | "customers" | "services" | "settings";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: "badge badge-pending",
    confirmed: "badge badge-confirmed",
    cancelled: "badge badge-cancelled",
    completed: "badge badge-completed",
    rescheduled: "badge badge-rescheduled",
  };
  return (
    <span className={cls[status] || "badge"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  tab,
  setTab,
  onLogout,
  open,
  onClose,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const items: { id: Tab; label: string; icon: string }[] = [
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "customers",   label: "Customers",    icon: "👥" },
    { id: "services",    label: "Services",     icon: "✂️" },
    { id: "settings",    label: "Settings",     icon: "⚙️" },
  ];

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 49,
          }}
        />
      )}
      <aside className={`dash-sidebar${open ? " open" : ""}`}>
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--gold)", marginBottom: ".25rem" }}>
            AN Salon
          </div>
          <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,.5)", marginBottom: "1.5rem" }}>
            Manager Dashboard
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: ".25rem" }}>
          {items.map((item) => (
            <button
              key={item.id}
              className={`dash-nav-item${tab === item.id ? " active" : ""}`}
              onClick={() => { setTab(item.id); onClose(); }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <Link href="/" className="dash-nav-item" style={{ color: "rgba(255,255,255,.6)" }}>
            ← View Website
          </Link>
          <button className="dash-nav-item" onClick={onLogout} style={{ color: "rgba(255,255,255,.4)" }}>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Appointments tab ──────────────────────────────────────────────────────────

function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(dateFilter && { date: dateFilter }),
    });
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, statusFilter, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(true);
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setSelected((prev) => prev ? { ...prev, status } : null);
    setUpdating(false);
  };

  const STATUSES = ["pending", "confirmed", "rescheduled", "completed", "cancelled"];

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Appointments</h1>
        <span style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>{total} total</span>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            type="search"
            placeholder="Search by customer name, email, phone, or service…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search appointments"
          />
        </div>
        <select className="form-select" style={{ width: "auto", minWidth: 140 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input className="form-input" type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} aria-label="Filter by date" style={{ width: "auto" }} />
        {(search || statusFilter || dateFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setStatusFilter(""); setDateFilter(""); setPage(1); }}>Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ width: 36, height: 36, margin: "0 auto" }} /></div>
      ) : appointments.length === 0 ? (
        <div className="empty-state card"><div className="card-body"><div className="empty-state-icon">📅</div><h3>No appointments found</h3><p>Adjust your filters or wait for new bookings.</p></div></div>
      ) : (
        <>
          {/* Mobile card view */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }} className="mobile-cards">
            {appointments.map((appt) => (
              <div key={appt.id} className="card" style={{ cursor: "pointer" }} onClick={() => setSelected(appt)}>
                <div className="card-body" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: ".5rem", marginBottom: ".5rem" }}>
                    <strong style={{ fontSize: ".95rem" }}>{appt.customer_name}</strong>
                    <StatusBadge status={appt.status} />
                  </div>
                  <div style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>
                    {appt.service_name} · {fmtDate(appt.appt_date)} {appt.appt_time}
                  </div>
                  <div style={{ fontSize: ".8rem", color: "var(--text-light)", marginTop: ".25rem" }}>
                    {appt.customer_phone}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) < 3)
                .map((p) => (
                  <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)}>›</button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Appointment details">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Appointment #{selected.id}</h2>
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--warm-gray)", borderRadius: "var(--radius-md)", padding: "1rem", fontSize: ".9rem", display: "grid", gap: ".5rem" }}>
                <div><strong>Customer:</strong> {selected.customer_name}</div>
                <div><strong>Email:</strong> <a href={`mailto:${selected.customer_email}`} style={{ color: "var(--gold-dark)" }}>{selected.customer_email}</a></div>
                <div><strong>Phone:</strong> <a href={`tel:${selected.customer_phone}`} style={{ color: "var(--gold-dark)" }}>{selected.customer_phone}</a></div>
                <div><strong>Service:</strong> {selected.service_name}</div>
                <div><strong>Date:</strong> {fmtDate(selected.appt_date)}</div>
                <div><strong>Time:</strong> {selected.appt_time}</div>
                {selected.duration_min && <div><strong>Duration:</strong> ~{selected.duration_min} min</div>}
                {selected.price_inr && <div><strong>Price:</strong> ₹{selected.price_inr.toLocaleString("en-IN")}</div>}
                {selected.notes && <div><strong>Notes:</strong> {selected.notes}</div>}
                <div><strong>Status:</strong> <StatusBadge status={selected.status} /></div>
                <div><strong>Booked:</strong> {new Date(selected.created_at).toLocaleString("en-IN")}</div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: ".5rem", display: "block" }}>Update Status</label>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`btn btn-sm ${selected.status === s ? "btn-gold" : "btn-outline"}`}
                      disabled={updating || selected.status === s}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <a href={`tel:${selected.customer_phone}`} className="btn btn-dark btn-sm">📞 Call Customer</a>
                <a href={`https://wa.me/91${selected.customer_phone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">💬 WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Customers tab ─────────────────────────────────────────────────────────────

function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Customers</h1>
        <span style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>{total} registered</span>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            type="search"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search customers"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ width: 36, height: 36, margin: "0 auto" }} /></div>
      ) : customers.length === 0 ? (
        <div className="empty-state card"><div className="card-body"><div className="empty-state-icon">👥</div><h3>No customers found</h3><p>Customers appear here after they register on the website.</p></div></div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {customers.map((c) => (
              <div key={c.id} className="card">
                <div className="card-body" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
                    <div>
                      <strong style={{ fontSize: ".95rem" }}>{c.name}</strong>
                      <div style={{ fontSize: ".875rem", color: "var(--text-muted)", marginTop: ".2rem" }}>
                        <a href={`mailto:${c.email}`} style={{ color: "var(--gold-dark)" }}>{c.email}</a>
                        {" · "}
                        <a href={`tel:${c.phone}`} style={{ color: "var(--gold-dark)" }}>{c.phone}</a>
                      </div>
                    </div>
                    <div style={{ fontSize: ".8rem", color: "var(--text-light)", textAlign: "right" }}>
                      Since {new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > 20 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) < 3)
                .map((p) => (
                  <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Services tab ──────────────────────────────────────────────────────────────

function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = { category: "", name: "", description: "", duration_min: "", price_inr: "", is_placeholder: false };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.services || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditing(null);
    setAdding(true);
    setError("");
  };

  const openEdit = (svc: Service) => {
    setForm({
      category: svc.category,
      name: svc.name,
      description: svc.description || "",
      duration_min: svc.duration_min ? String(svc.duration_min) : "",
      price_inr: svc.price_inr ? String(svc.price_inr) : "",
      is_placeholder: svc.is_placeholder === 1,
    });
    setEditing(svc);
    setAdding(false);
    setError("");
  };

  const closeModal = () => { setEditing(null); setAdding(false); setError(""); };

  const save = async () => {
    setError(""); setSaving(true);
    try {
      const body = { ...form, is_placeholder: form.is_placeholder ? 1 : 0 };
      const res = await fetch(editing ? `/api/services/${editing.id}` : "/api/services", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed."); return; }
      await load();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (svc: Service) => {
    await fetch(`/api/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: svc.is_active === 1 ? 0 : 1 }),
    });
    load();
  };

  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Services</h1>
        <button className="btn btn-gold btn-sm" onClick={openAdd}>+ Add Service</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ width: 36, height: 36, margin: "0 auto" }} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {categories.map((cat) => (
            <div key={cat}>
              <h2 style={{ fontSize: ".85rem", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold-dark)", fontWeight: 700, marginBottom: ".75rem" }}>{cat}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                {services.filter((s) => s.category === cat).map((svc) => (
                  <div key={svc.id} className="card" style={{ opacity: svc.is_active ? 1 : .5 }}>
                    <div className="card-body" style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: ".5rem", alignItems: "center", marginBottom: ".25rem", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: ".95rem" }}>{svc.name}</strong>
                            {svc.is_placeholder === 1 && <span className="placeholder-notice">Sample</span>}
                            {!svc.is_active && <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>Hidden</span>}
                          </div>
                          <p style={{ fontSize: ".875rem", color: "var(--text-muted)", marginBottom: ".25rem" }}>{svc.description}</p>
                          <div style={{ display: "flex", gap: "1rem", fontSize: ".85rem", color: "var(--text-light)", flexWrap: "wrap" }}>
                            {svc.duration_min && <span>~{svc.duration_min} min</span>}
                            {svc.price_inr ? <span>₹{svc.price_inr.toLocaleString("en-IN")}</span> : <span style={{ fontStyle: "italic" }}>Price on request</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: ".5rem", flexShrink: 0 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(svc)}>Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(svc)}>{svc.is_active ? "Hide" : "Show"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {(adding || editing) && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={editing ? "Edit service" : "Add service"}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? "Edit Service" : "Add Service"}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div className="alert alert-error" role="alert">{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="svc-category">Category *</label>
                <input id="svc-category" className="form-input" type="text" list="category-list" placeholder="e.g. Hair Care, Skin Care…" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                <datalist id="category-list">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="svc-name">Service Name *</label>
                <input id="svc-name" className="form-input" type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="svc-desc">Description</label>
                <textarea id="svc-desc" className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="svc-dur">Duration (minutes)</label>
                  <input id="svc-dur" className="form-input" type="number" min="5" max="480" placeholder="60" value={form.duration_min} onChange={(e) => setForm((p) => ({ ...p, duration_min: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="svc-price">Price (₹)</label>
                  <input id="svc-price" className="form-input" type="number" min="0" placeholder="Leave blank = on request" value={form.price_inr} onChange={(e) => setForm((p) => ({ ...p, price_inr: e.target.value }))} />
                </div>
              </div>

              <label style={{ display: "flex", gap: ".625rem", alignItems: "center", fontSize: ".9rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_placeholder} onChange={(e) => setForm((p) => ({ ...p, is_placeholder: e.target.checked }))} />
                Mark as sample/placeholder entry
              </label>

              <div style={{ display: "flex", gap: ".75rem" }}>
                <button className="btn btn-gold btn-full" onClick={save} disabled={saving || !form.category || !form.name}>
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Service"}
                </button>
                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Change Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!currentPw || !newPw) {
      setPwError("Please enter both current and new password.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters long.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/manager/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to update password.");
        return;
      }
      setPwSuccess("Password changed successfully!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSuccess(""), 4000);
    } catch {
      setPwError("An error occurred. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d.settings || {}); setLoading(false); });
  }, []);

  const update = (key: string, value: string) => {
    setSettings((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed."); return; }
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ width: 36, height: 36, margin: "0 auto" }} /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>Business Settings</h1>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          {saved && <span className="alert alert-success" style={{ padding: ".4rem .875rem", margin: 0 }}>✓ Saved!</span>}
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save All"}</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Walk-in Availability</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="walkin">Walk-in Status Message</label>
              <textarea
                id="walkin"
                className="form-textarea"
                rows={3}
                value={settings.walkin_status || ""}
                onChange={(e) => update("walkin_status", e.target.value)}
                placeholder="e.g. Walk-ins are welcome. Availability depends on our current schedule. Call to check."
              />
              <span className="form-hint">This message shows on the website for customers asking about walk-ins.</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Business Hours</h2>
            <p style={{ fontSize: ".875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Set opening hours for each day. Leave blank for a closed/rest day. This is displayed on the website.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}>
              {DAYS.map((day) => (
                <div key={day} style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ width: 100, fontWeight: 600, fontSize: ".9rem", textTransform: "capitalize", flexShrink: 0 }} htmlFor={`hours-${day}`}>{day}</label>
                  <input
                    id={`hours-${day}`}
                    className="form-input"
                    type="text"
                    placeholder="e.g. 10:00 AM – 9:00 PM or Closed"
                    value={settings[`hours_${day}`] || ""}
                    onChange={(e) => update(`hours_${day}`, e.target.value)}
                    style={{ maxWidth: 280 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Booking Notice</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="booking-notice">Booking Information Message</label>
              <textarea
                id="booking-notice"
                className="form-textarea"
                rows={3}
                value={settings.booking_notice || ""}
                onChange={(e) => update("booking_notice", e.target.value)}
                placeholder="e.g. Appointments are required. Online booking is available below. Walk-ins are also welcome."
              />
              <span className="form-hint">Displayed above the booking form on the website.</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Hours Display Note</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="hours-note">Hours Section Note</label>
              <textarea
                id="hours-note"
                className="form-textarea"
                rows={2}
                value={settings.hours_note || ""}
                onChange={(e) => update("hours_note", e.target.value)}
                placeholder="e.g. Business hours are set by the salon manager. Please call to confirm."
              />
              <span className="form-hint">Shown in the amenities section on the website.</span>
            </div>
          </div>
        </div>

        <button className="btn btn-gold btn-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save All Settings"}
        </button>

        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card-body">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".5rem" }}>
              Manager Account Security
            </h2>
            <p style={{ fontSize: ".875rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Update your manager login password. New password must be at least 8 characters.
            </p>

            {pwError && <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success" style={{ marginBottom: "1rem" }} role="alert">{pwSuccess}</div>}

            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 420 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="current-pw">Current Password</label>
                <input
                  id="current-pw"
                  className="form-input"
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-pw">New Password</label>
                <input
                  id="new-pw"
                  className="form-input"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pw">Confirm New Password</label>
                <input
                  id="confirm-pw"
                  className="form-input"
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: "flex-start" }}
                disabled={pwSaving}
              >
                {pwSaving ? "Updating Password…" : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard stats ────────────────────────────────────────────────────────────

function StatsBar({ appointments }: { appointments: Appointment[] }) {
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.appt_date === today).length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="dash-stats">
      <div className="stat-card">
        <div className="stat-value">{appointments.length}</div>
        <div className="stat-label">Total Appointments</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{todayAppts}</div>
        <div className="stat-label">Today</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: "var(--gold-dark)" }}>{pending}</div>
        <div className="stat-label">Pending</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: "var(--success)" }}>{confirmed}</div>
        <div className="stat-label">Confirmed</div>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [tab, setTab] = useState<Tab>("appointments");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.user || data.user.role !== "manager") {
        router.push("/manager/login");
        return;
      }
      setUser(data.user);
      // Fetch today's appointments for stats
      const today = new Date().toISOString().split("T")[0];
      const apptRes = await fetch(`/api/appointments?date=${today}&page=1`);
      const apptData = await apptRes.json();
      setTodayAppts(apptData.appointments || []);
    })();
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/manager/login");
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <Sidebar
        tab={tab}
        setTab={setTab}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top header */}
        <div className="dash-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px" }}
              className="lg-hidden"
            >
              <span style={{ width: 20, height: 2, background: "var(--text)", display: "block", borderRadius: 1 }} />
              <span style={{ width: 20, height: 2, background: "var(--text)", display: "block", borderRadius: 1 }} />
              <span style={{ width: 20, height: 2, background: "var(--text)", display: "block", borderRadius: 1 }} />
            </button>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--gold-dark)" }}>AN Salon</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{ fontSize: ".85rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{tab}</span>
          </div>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
            <span style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>{user.name}</span>
            <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
          </div>
        </div>

        {/* Main */}
        <main className="dash-main">
          {tab === "appointments" && <AppointmentsTab />}
          {tab === "customers" && <CustomersTab />}
          {tab === "services" && <ServicesTab />}
          {tab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}
