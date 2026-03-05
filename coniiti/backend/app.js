const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,      // localhost
  user: process.env.DB_USER,      // root
  password: process.env.DB_PASSWORD, // vacío
  database: process.env.DB_NAME,  // myapp_db
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
const pool = require("./config/db");

pool.getConnection()
  .then(conn => {
    console.log("✅ Conectado a MySQL correctamente");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error conectando a MySQL:", err);
  });
  console.log("authRoutes:", authRoutes);
console.log("errorHandler:", errorHandler);