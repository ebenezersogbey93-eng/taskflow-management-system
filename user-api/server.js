const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
    session({
        secret: "taskflow-secret-key-change-this",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60
        }
    })
);

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username and password are required"
        });
    }

    db.get(
        "SELECT * FROM Users WHERE username = ?",
        [username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!user) {
                return res.status(401).json({
                    error: "Invalid username or password"
                });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    error: "Invalid username or password"
                });
            }

            req.session.userId = user.id;
            req.session.username = user.username;

            res.json({
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        }
    );
});

// ========================================
// CONNECT TO SQLITE DATABASE
// ========================================

const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// ========================================
// CREATE USERS TABLE
// ========================================

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

// ========================================
// CREATE TODOS TABLE
// ========================================

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

// DELETE a user and their TODOs
app.delete("/users/:id", (req, res) => {
    const userId = req.params.id;

    db.serialize(() => {

        // Delete the user's TODOs first
        db.run(
            "DELETE FROM Todos WHERE user_id = ?",
            [userId],
            function (err) {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                // Now delete the user
                db.run(
                    "DELETE FROM Users WHERE id = ?",
                    [userId],
                    function (err) {

                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({
                                error: "User not found"
                            });
                        }

                        res.json({
                            message: "User and their TODOs deleted successfully"
                        });
                    }
                );
            }
        );

    });
});

// ========================================
// POST NEW USER
// ========================================

app.post("/users", async (req, res) => {
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

// ========================================
// PUT / UPDATE USER
// ========================================

app.put("/users/:id", async (req, res) => {
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

// ========================================
// POST NEW TODO
// ========================================

app.post("/todos", (req, res) => {
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

// ========================================
// GET ALL TODOS
// ========================================

app.get("/todos", (req, res) => {
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

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});