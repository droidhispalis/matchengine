import "dotenv/config";
import { pool } from "./db/pool.js";

async function inspectDatabase() {
    console.log("🔍 Inspeccionando base de datos...\n");

    try {
        // Obtener todas las tablas
        const [tables]: any = await pool.query(`
            SHOW TABLES
        `);

        console.log("📋 TABLAS EXISTENTES:");
        console.log("=".repeat(50));
        
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\n📊 Tabla: ${tableName}`);
            console.log("-".repeat(50));

            // Obtener estructura de cada tabla
            const [columns]: any = await pool.query(`
                DESCRIBE ${tableName}
            `);

            columns.forEach((col: any) => {
                console.log(`  ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
            });

            // Contar registros
            const [count]: any = await pool.query(`
                SELECT COUNT(*) as count FROM ${tableName}
            `);
            console.log(`  📊 Registros: ${count[0].count}`);
        }

        console.log("\n" + "=".repeat(50));
        console.log("✅ Inspección completada\n");

        await pool.end();
        process.exit(0);

    } catch (err: any) {
        console.error("❌ ERROR:", err.message);
        await pool.end();
        process.exit(1);
    }
}

inspectDatabase();
