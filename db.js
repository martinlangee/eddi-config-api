const Pool = require("pg").Pool;
const pool = new Pool({
    user: "postgres",
    password: "brasil",
    database: "eddi_db",
    host: "localhost",
    port: 5432
})

module.exports = pool;