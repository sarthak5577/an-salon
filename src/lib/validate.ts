// src/lib/validate.ts
// Shared input validation helpers (server-side).

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateEmail(email: string): ValidationResult {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !re.test(email.trim())) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  return { ok: true };
}

export function validatePhone(phone: string): ValidationResult {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) {
    return { ok: false, error: "Please enter a valid phone number (10–13 digits)." };
  }
  return { ok: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  return { ok: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length < 2) {
    return { ok: false, error: "Please enter your full name (at least 2 characters)." };
  }
  return { ok: true };
}

export function validateDate(date: string): ValidationResult {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { ok: false, error: "Please select a valid date." };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) {
    return { ok: false, error: "Appointment date cannot be in the past." };
  }
  return { ok: true };
}

export function validateTime(time: string): ValidationResult {
  const re = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!re.test(time)) {
    return { ok: false, error: "Please select a valid time." };
  }
  return { ok: true };
}

// Sanitise a string: trim and prevent SQL-injection via parameterised queries.
export function sanitise(s: string): string {
  return s.trim();
}
