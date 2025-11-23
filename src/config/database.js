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
    // Local development configuration
    config.host = process.env.DB_HOST || 'localhost';
    config.port = process.env.DB_PORT || 3306;
}

console.log('Initializing database connection pool...');
if (isProduction) {
    console.log(`Connecting to Cloud SQL instance via socket: ${config.socketPath}`);
} else {
    console.log(`Connecting to local database at ${config.host}:${config.port}`);
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