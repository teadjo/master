// const { Pool } = require('pg');

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === 'production' 
//     ? { rejectUnauthorized: false } 
//     : false   // Lokalno isključi SSL
// });

// module.exports = pool;

const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres",
    host: "127.0.0.1",
    database: "UmjetnickoTakmicenje",
    password: "password",
    port: "5432",
});

module.exports = pool;