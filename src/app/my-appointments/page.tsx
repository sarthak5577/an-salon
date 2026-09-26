"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Appointment = {
  id: number;
  service_name: string;
  category: string;
  appt_date: string;
  appt_time: string;
  status: string;
  notes?: string;
  duration_min?: number;
  price_inr?: number;
  created_at: string;
};

type User = { sub: string; name: string; email: string; role: string };

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: "badge badge-pending",
    confirmed: "badge badge-confirmed",
    cancelled: "badge badge-cancelled",
    completed: "badge badge-completed",
    rescheduled: "badge badge-rescheduled",
  };
  return <span className={cls[status] || "badge"}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();
      if (!me.user || me.user.role !== "customer") {
        router.push("/signin");
        return;
      }
      setUser(me.user);
      const apptRes = await fetch("/api/appointments");
      const apptData = await apptRes.json();
      setAppointments(apptData.appointments || []);
      setLoading(false);
    })();
  }, [router]);

  const cancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(id);
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setAppointments((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: "cancelled" } : a)
    );
    setCancelling(null);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const upcoming = appointments.filter((a) => a.appt_date >= new Date().toISOString().split("T")[0] && a.status !== "cancelled");
  const past = appointments.filter((a) => a.appt_date < new Date().toISOString().split("T")[0] || a.status === "cancelled");

  return (
    <div style={{ minHeight: "100vh", background: "var(--warm-gray)" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "1rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="container flex-between">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--gold)", fontWeight: 700 }}>AN Salon</Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>My Bookings</span>
          </div>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
            <span style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>{user?.name}</span>
            <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)" }}>My Appointments</h1>
          <Link href="/#booking" className="btn btn-gold btn-sm">+ Book New</Link>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state card">
            <div className="card-body">
              <div className="empty-state-icon">📅</div>
              <h3>No appointments yet</h3>
              <p>You haven't made any bookings. Book your first appointment now!</p>
              <Link href="/#booking" className="btn btn-gold btn-sm" style={{ marginTop: "1rem" }}>Book an Appointment</Link>
            </div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontWeight: 700, marginBottom: "1rem" }}>Upcoming</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                  {upcoming.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} onCancel={cancel} cancelling={cancelling === appt.id} />
                  ))}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontWeight: 700, marginBottom: "1rem" }}>Past & Cancelled</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {past.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} onCancel={cancel} cancelling={cancelling === appt.id} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="card" style={{ marginTop: "2rem" }}>
          <div className="card-body">
            <h3 style={{ fontSize: "1rem", marginBottom: ".5rem" }}>Need to make changes?</h3>
            <p style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>
              To reschedule or ask about your booking, please call us at{" "}
              <a href="tel:+918064526928" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>080 6452 6928</a> or{" "}
              <a href="https://wa.me/918928174494" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>WhatsApp us</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppointmentCard({
  appt, onCancel, cancelling
}: {
  appt: Appointment;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap", marginBottom: ".5rem" }}>
              <span style={{ fontSize: ".75rem", color: "var(--gold-dark)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{appt.category}</span>
              <StatusBadge status={appt.status} />
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", marginBottom: ".25rem" }}>{appt.service_name}</h3>
            <p style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>
              {new Date(appt.appt_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {appt.appt_time}
              {appt.duration_min && ` · ~${appt.duration_min} min`}
              {appt.price_inr && ` · ₹${appt.price_inr.toLocaleString("en-IN")}`}
            </p>
            {appt.notes && (
              <p style={{ fontSize: ".85rem", color: "var(--text-muted)", marginTop: ".5rem", fontStyle: "italic" }}>"{appt.notes}"</p>
            )}
          </div>
          {appt.status !== "cancelled" && appt.status !== "completed" && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onCancel(appt.id)}
              disabled={cancelling}
              style={{ color: "var(--error)", flexShrink: 0 }}
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
