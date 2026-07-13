require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json()); // Allows the server to read JSON data sent from the HTML

// Serve the frontend HTML files from a "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Helper function to generate referral codes
function generateReferralCode() {
    return 'ETHIO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// --- API ROUTES ---

// 1. Register a new user
app.post('/api/register', async (req, res) => {
    const { name, phone, password, referred_by } = req.body;

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }

        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const my_code = generateReferralCode();

        // Insert into database
        const newUser = await pool.query(
            `INSERT INTO users (name, phone, password, my_code, referred_by) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, name, phone, bal_deposit, bal_invested, bal_earnings`,
            [name, phone, hashedPassword, my_code, referred_by || null]
        );

        res.status(201).json({ success: true, user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// 2. Login a user
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        // Find user by phone
        const user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid phone number or password' });
        }

        // Check if password matches the hashed password in DB
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid phone number or password' });
        }

        // Remove the password from the response data for security
        delete user.rows[0].password;
        
        res.status(200).json({ success: true, user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
                                         
