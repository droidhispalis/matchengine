import "dotenv/config";
import { pool } from "./db/pool.js";

async function testDB() {

  try {

    const [rows] = await pool.query("SELECT 1 as test");

    console.log("✅ DB OK:", rows);

  } catch (err) {

    console.error("❌ DB ERROR:", err);

  } finally {

    await pool.end(); // 👈 ESTO CIERRA EL POOL
  }
}

testDB();
