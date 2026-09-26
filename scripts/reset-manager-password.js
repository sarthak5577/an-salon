// scripts/reset-manager-password.js
// Run with: node scripts/reset-manager-password.js [email] [new-password]
// Or using environment variables:
//   $env:MANAGER_EMAIL="manager@ansalon.in"
//   $env:MANAGER_PASSWORD="YourNewPassword123"
//   node scripts/reset-manager-password.js
//
// Supports both local SQLite and Turso Cloud SQLite.

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

// Support arguments from command line or env vars
const args = process.argv.slice(2);
const email = (args[0] || process.env.MANAGER_EMAIL || "").trim().toLowerCase();
const password = args[1] || process.env.MANAGER_PASSWORD || "";

if (!email || !password) {
  console.error("\n❌  Missing email or new password.");
  console.error("Usage:");
  console.error("  node scripts/reset-manager-password.js <email> <new-password>\n");
  console.error("Or via environment variables (PowerShell):");
  console.error('  $env:MANAGER_EMAIL="manager@ansalon.in"');
  console.error('  $env:MANAGER_PASSWORD="NewPassword123"');
  console.error("  node scripts/reset-manager-password.js\n");
  process.exit(1);
}

if (password.length < 8) {
  console.error("\n❌  New password must be at least 8 characters long.\n");
  process.exit(1);
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL || "file:data/ansalon.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  const db = createClient({ url, authToken });

  const managerRes = await db.execute({
    sql: "SELECT id, name, email FROM managers WHERE email = ?",
    args: [email],
  });

  const manager = managerRes.rows[0];
  if (!manager) {
    console.error(`\n❌  No manager account found with email "${email}".\n`);
    const allManagers = await db.execute("SELECT email FROM managers");
    if (allManagers.rows.length > 0) {
      console.log("Existing manager email(s):");
      allManagers.rows.forEach((m) => console.log(`  - ${m.email}`));
      console.log();
    }
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 12);
  await db.execute({
    sql: "UPDATE managers SET password_hash = ? WHERE id = ?",
    args: [hash, manager.id],
  });

  console.log("\n✅  Manager password updated successfully!");
  console.log(`    Target DB: ${url.startsWith("libsql:") ? "Turso Cloud" : "Local SQLite"}`);
  console.log(`    Manager:   ${manager.name} (${manager.email})`);
  console.log(`    Login:     /manager/login\n`);
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
