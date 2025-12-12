const mysql = require('mysql2/promise');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (isProduction && process.env.INSTANCE_CONNECTION_NAME) {
    // Production configuration for Cloud SQL using Unix Socket
    config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
} else {
    // TCP/IP connection (local or Cloud SQL public IP)
    config.host = process.env.DB_HOST || 'localhost';
    config.port = process.env.DB_PORT || 3306;
    
    // Enable SSL for Cloud SQL connections (required for public IP)
    if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
        config.ssl = {
            rejectUnauthorized: false
        };
    }
}

console.log('Initializing database connection pool...');
if (config.socketPath) {
    console.log(`Connecting to Cloud SQL via socket: ${config.socketPath}`);
} else {
    console.log(`Connecting to database at ${config.host}:${config.port}${config.ssl ? ' (SSL)' : ''}`);
}

const pool = mysql.createPool(config);

pool.getConnection()
    .then(conn => {
        console.log('✅ Database connection successful!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Could not connect to the database:', err.message);
    });

module.exports = pool;