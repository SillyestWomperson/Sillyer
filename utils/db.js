const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
	user: process.env.USER_NAME,
	host: process.env.HOST_NAME,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.PORT_NUMBER,
});

module.exports = pool;

module.exports = pool;
