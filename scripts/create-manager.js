// scripts/create-manager.js
// Run with: node scripts/create-manager.js
// Creates the first (or additional) manager account securely.
// Supports both local SQLite and Turso Cloud SQLite.
//
// Usage (Windows PowerShell):
//   $env:MANAGER_NAME="Salon Manager"
//   $env:MANAGER_EMAIL="manager@ansalon.in"
//   $env:MANAGER_PASSWORD="YourSecurePassword123"
//   node scripts/create-manager.js

const path = require("path");
const fs   = require("fs");
const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

// Load .env.local if present
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const name     = process.env.MANAGER_NAME;
const email    = process.env.MANAGER_EMAIL;
const password = process.env.MANAGER_PASSWORD;

if (!name || !email || !password) {
  console.error("\n❌  Missing required environment variables.");
  console.error("    MANAGER_NAME, MANAGER_EMAIL, and MANAGER_PASSWORD must all be set.\n");
  console.error("Example (Windows PowerShell):");
  console.error('  $env:MANAGER_NAME="Salon Manager"');
  console.error('  $env:MANAGER_EMAIL="manager@ansalon.in"');
  console.error('  $env:MANAGER_PASSWORD="SecurePass123"');
  console.error("  node scripts/create-manager.js\n");
  process.exit(1);
}

if (password.length < 8) {
  console.error("\n❌  MANAGER_PASSWORD must be at least 8 characters.\n");
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("\n❌  MANAGER_EMAIL does not look like a valid email address.\n");
  process.exit(1);
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL || "file:data/ansalon.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  if (url.startsWith("file:")) {
    const rawPath = url.slice(5);
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, "..", rawPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const db = createClient({ url, authToken });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS managers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const existing = await db.execute({
    sql: "SELECT id FROM managers WHERE email = ?",
    args: [email.toLowerCase()],
  });

  if (existing.rows.length > 0) {
    console.error(`\n⚠️   A manager account with email "${email}" already exists.\n`);
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 12);
  const result = await db.execute({
    sql: "INSERT INTO managers (name, email, password_hash) VALUES (?, ?, ?)",
    args: [name.trim(), email.toLowerCase().trim(), hash],
  });

  console.log(`\n✅  Manager account created successfully!`);
  console.log(`    Target DB: ${url.startsWith("libsql:") ? "Turso Cloud" : "Local SQLite"}`);
  console.log(`    ID:        ${result.lastInsertRowid}`);
  console.log(`    Name:      ${name}`);
  console.log(`    Email:     ${email}`);
  console.log(`\n    Sign in at: /manager/login\n`);
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
