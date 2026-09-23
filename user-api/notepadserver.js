const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// =============================
// CREATE USERS TABLE
// =============================

db.run(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`, (err) => {
    if (err) {
        console.error("Error creating Users table:", err.message);
    } else {
        console.log("Users table is ready.");
    }
});

// =============================
// CREATE TODOS TABLE
// =============================

db.run(`
    CREATE TABLE IF NOT EXISTS Todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    )
`, (err) => {
    if (err) {
        console.error("Error creating Todos table:", err.message);
    } else {
        console.log("Todos table is ready.");
    }
});

// =============================
// GET ALL USERS
// =============================

app.get("/api/users", (req, res) => {
    db.all(
        "SELECT id, username, email FROM Users",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// =============================
// POST NEW USER
// =============================

app.post("/api/users", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: "Username, email and password are required."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO Users (username, email, password)
             VALUES (?, ?, ?)`,
            [username, email, hashedPassword],
            function (err) {
                if (err) {
                    return res.status(400).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "User created successfully",
                    user: {
                        id: this.lastID,
                        username: username,
                        email: email
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            error: "Failed to create user"
        });
    }
});

// =============================
// PUT / UPDATE USER
// =============================

app.put("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    const { username, email, password } = req.body;

    if (!username || !email) {
        return res.status(400).json({
            error: "Username and email are required"
        });
    }

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);

            db.run(
                `UPDATE Users
                 SET username = ?, email = ?, password = ?
                 WHERE id = ?`,
                [username, email, hashedPassword, userId],
                function (err) {
                    if (err) {
                        return res.status(400).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            error: "User not found"
                        });
                    }

                    res.json({
                        message: "User updated successfully"
                    });
                }
            );
        } else {
            db.run(
                `UPDATE Users
                 SET username = ?, email = ?
                 WHERE id = ?`,
                [username, email, userId],
                function (err) {
                    if (err) {
                        return res.status(400).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            error: "User not found"
                        });
                    }

                    res.json({
                        message: "User updated successfully"
                    });
                }
            );
        }
    } catch (error) {
        res.status(500).json({
            error: "Failed to update user"
        });
    }
});

// =============================
// POST NEW TODO
// =============================

app.post("/api/todos", (req, res) => {
    const { user_id, description } = req.body;

    if (!user_id || !description) {
        return res.status(400).json({
            message: "user_id and description are required"
        });
    }

    db.run(
        `INSERT INTO Todos (user_id, description)
         VALUES (?, ?)`,
        [user_id, description],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Error creating todo",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Todo created successfully",
                todo: {
                    id: this.lastID,
                    user_id: user_id,
                    description: description
                }
            });
        }
    );
});

// =============================
// GET ALL TODOS
// =============================

app.get("/api/todos", (req, res) => {
    db.all(
        "SELECT * FROM Todos",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    message: "Error retrieving todos",
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// =============================
// START SERVER
// =============================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});