/**
 * Seed Admin User
 * Run: node server/seedAdmin.mjs
 */
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "290819943";
const ADMIN_NAME = "Super Admin";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  // Check if admin already exists
  const [existing] = await conn.execute(
    "SELECT id FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
    [ADMIN_EMAIL]
  );

  if (existing.length > 0) {
    console.log("[Seed] Admin user already exists:", ADMIN_EMAIL);
    await conn.end();
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const openId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await conn.execute(
    "INSERT INTO users (openId, name, email, passwordHash, loginMethod, role) VALUES (?, ?, ?, ?, ?, ?)",
    [openId, ADMIN_NAME, ADMIN_EMAIL, passwordHash, "email", "admin"]
  );

  console.log("[Seed] Admin user created successfully:", ADMIN_EMAIL);
  await conn.end();
}

seed().catch((err) => {
  console.error("[Seed] Error:", err);
  process.exit(1);
});
