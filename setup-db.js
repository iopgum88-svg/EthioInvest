require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createTables = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            my_code VARCHAR(20) UNIQUE NOT NULL,
            referred_by VARCHAR(20),
            bal_deposit DECIMAL(10,2) DEFAULT 0.00,
            bal_invested DECIMAL(10,2) DEFAULT 0.00,
            bal_earnings DECIMAL(10,2) DEFAULT 0.00,
            ref_count INT DEFAULT 0,
            ref_earnings DECIMAL(10,2) DEFAULT 0.00
        );
    `;
    try {
        await pool.query(query);
        console.log("Database tables created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error creating tables:", err);
        process.exit(1);
    }
};

createTables();
