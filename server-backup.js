const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

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

// ==========================================
// CREATE USERS TABLE
// ==========================================

db.run(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`, (err) => {
    if (err) {
        console.error("Users table error:", err.message);
    } else {
        console.log("Users table ready.");
    }
});

// ==========================================
// CREATE TODOS TABLE
// ==========================================

db.run(`
    CREATE TABLE IF NOT EXISTS Todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    )
`, (err) => {
    if (err) {
        console.error("Todos table error:", err.message);
    } else {
        console.log("Todos table ready.");
    }
});

// ==========================================
// GET ALL USERS
// ==========================================

app.get("/users", (req, res) => {

    const sql = `
        SELECT id, username, email
        FROM Users
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});

// ==========================================
// CREATE USER
// ==========================================

app.post("/users", async (req, res) => {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: "Username, email and password are required"
        });
    }

    try {

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO Users (username, email, password)
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
            [username, email, hashedPassword],
            function (err) {

                if (err) {

                    if (err.message.includes("UNIQUE")) {
                        return res.status(400).json({
                            error: "Username or email already exists"
                        });
                    }

                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "User created successfully",
                    user: {
                        id: this.lastID,
                        username,
                        email
                    }
                });
            }
        );

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

// ==========================================
// EDIT / UPDATE USER
// ==========================================

app.put("/users/:id", async (req, res) => {

    const userId = req.params.id;

    const {
        username,
        email,
        password
    } = req.body;

    if (!username || !email) {
        return res.status(400).json({
            error: "Username and email are required"
        });
    }

    try {

        // If password was provided, hash it
        if (password) {

            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = `
                UPDATE Users
                SET username = ?, email = ?, password = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [username, email, hashedPassword, userId],
                function (err) {

                    if (err) {

                        if (err.message.includes("UNIQUE")) {
                            return res.status(400).json({
                                error: "Username or email already exists"
                            });
                        }

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
                        message: "User updated successfully"
                    });
                }
            );

        } else {

            const sql = `
                UPDATE Users
                SET username = ?, email = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [username, email, userId],
                function (err) {

                    if (err) {

                        if (err.message.includes("UNIQUE")) {
                            return res.status(400).json({
                                error: "Username or email already exists"
                            });
                        }

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
                        message: "User updated successfully"
                    });
                }
            );
        }

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

// ==========================================
// DELETE USER
// Deletes user's TODOs first
// ==========================================

app.delete("/users/:id", (req, res) => {

    const userId = req.params.id;

    db.serialize(() => {

        db.run("BEGIN TRANSACTION", (err) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            // Delete the user's TODOs first
            db.run(
                "DELETE FROM Todos WHERE user_id = ?",
                [userId],
                (err) => {

                    if (err) {

                        db.run("ROLLBACK");

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    // Delete the user
                    db.run(
                        "DELETE FROM Users WHERE id = ?",
                        [userId],
                        function (err) {

                            if (err) {

                                db.run("ROLLBACK");

                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            if (this.changes === 0) {

                                db.run("ROLLBACK");

                                return res.status(404).json({
                                    error: "User not found"
                                });
                            }

                            // Save transaction
                            db.run("COMMIT", (err) => {

                                if (err) {

                                    db.run("ROLLBACK");

                                    return res.status(500).json({
                                        error: err.message
                                    });
                                }

                                res.json({
                                    message: "User and their TODOs deleted successfully"
                                });
                            });
                        }
                    );
                }
            );
        });
    });
});

// ==========================================
// GET ALL TODOS
// Includes the user who owns each TODO
// ==========================================

app.get("/todos", (req, res) => {

    const sql = `
        SELECT
            Todos.id,
            Todos.description,
            Users.id AS user_id,
            Users.username,
            Users.email
        FROM Todos
        INNER JOIN Users
        ON Todos.user_id = Users.id
        ORDER BY Todos.id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});

// ==========================================
// CREATE TODO
// ==========================================

app.post("/todos", (req, res) => {

    const {
        user_id,
        description
    } = req.body;

    if (!user_id || !description) {
        return res.status(400).json({
            error: "User and description are required"
        });
    }

    // Check if user exists
    db.get(
        "SELECT id, username FROM Users WHERE id = ?",
        [user_id],
        (err, user) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const sql = `
                INSERT INTO Todos (user_id, description)
                VALUES (?, ?)
            `;

            db.run(
                sql,
                [user_id, description],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        message: "TODO created successfully",
                        todo: {
                            id: this.lastID,
                            user_id,
                            description
                        }
                    });
                }
            );
        }
    );
});

// ==========================================
// EDIT / UPDATE TODO
// ==========================================

app.put("/todos/:id", (req, res) => {

    const todoId = req.params.id;

    const {
        user_id,
        description
    } = req.body;

    if (!user_id || !description) {
        return res.status(400).json({
            error: "User and description are required"
        });
    }

    // Check user
    db.get(
        "SELECT id FROM Users WHERE id = ?",
        [user_id],
        (err, user) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const sql = `
                UPDATE Todos
                SET user_id = ?, description = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [user_id, description, todoId],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            error: "TODO not found"
                        });
                    }

                    res.json({
                        message: "TODO updated successfully"
                    });
                }
            );
        }
    );
});

// ==========================================
// DELETE TODO
// ==========================================

app.delete("/todos/:id", (req, res) => {

    const todoId = req.params.id;

    db.run(
        "DELETE FROM Todos WHERE id = ?",
        [todoId],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "TODO not found"
                });
            }

            res.json({
                message: "TODO deleted successfully"
            });
        }
    );
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});