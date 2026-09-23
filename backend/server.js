const express = require("express");
const path = require("path");

const db = require("./config/database");

const userRoutes = require("./routes/userRoutes");
const todoRoutes = require("./routes/todoRoutes");

const app = express();

const PORT = 3000;


// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ===============================
// FRONTEND
// ===============================

// Serve files from the existing public folder
app.use(express.static(path.join(__dirname, "..", "frontend")));


// ===============================
// API ROUTES
// ===============================

// Users API
app.use("/api/users", userRoutes);

// Todos API
app.use("/api/todos", todoRoutes);


// ===============================
// DASHBOARD STATS
// ===============================

app.get("/api/stats", (req, res) => {

    db.get(
        `SELECT
            (SELECT COUNT(*) FROM Users) AS totalUsers,
            (SELECT COUNT(*) FROM Todos) AS totalTodos,
            (SELECT COUNT(*) FROM Todos WHERE completed = 1) AS completedTodos,
            (SELECT COUNT(*) FROM Todos WHERE completed = 0) AS pendingTodos`,
        [],
        (err, row) => {

            if (err) {
                console.error(err.message);

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(row);
        }
    );
});


// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});


// ===============================
// SERVER
// ===============================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log(" TaskFlow Backend Server");
    console.log("======================================");
    console.log(` http://localhost:${PORT}`);
    console.log("");
    console.log(` Users API: http://localhost:${PORT}/api/users`);
    console.log(` Todos API: http://localhost:${PORT}/api/todos`);
    console.log(` Stats API: http://localhost:${PORT}/api/stats`);
    console.log("======================================");
});