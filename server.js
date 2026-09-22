const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from public folder
app.use(express.static(path.join(__dirname, "public")));
// ============================================================
// DATABASE
// ============================================================

const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// ============================================================
// CREATE USERS TABLE
// ============================================================

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
        console.log("Users table ready.");
    }
});

// ============================================================
// CREATE TODOS TABLE
// ============================================================

db.run(`
    CREATE TABLE IF NOT EXISTS Todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id)
            REFERENCES Users(id)
            ON DELETE CASCADE
    )
`, (err) => {
    if (err) {
        console.error("Error creating Todos table:", err.message);
    } else {
        console.log("Todos table ready.");
    }
});

// ============================================================
// HOME PAGE
// ============================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
// ============================================================
// DASHBOARD STATISTICS
// ============================================================

app.get("/api/stats", (req, res) => {

    const stats = {};

    db.get(
        "SELECT COUNT(*) AS totalUsers FROM Users",
        [],
        (err, userResult) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            stats.totalUsers = userResult.totalUsers;

            db.get(
                "SELECT COUNT(*) AS totalTodos FROM Todos",
                [],
                (err, todoResult) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    stats.totalTodos = todoResult.totalTodos;

                    db.get(
                        "SELECT COUNT(*) AS completedTodos FROM Todos WHERE completed = 1",
                        [],
                        (err, completedResult) => {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            stats.completedTodos =
                                completedResult.completedTodos;

                            stats.pendingTodos =
                                stats.totalTodos - stats.completedTodos;

                            res.json(stats);
                        }
                    );
                }
            );
        }
    );
});

// ============================================================
// GET ALL USERS
// ============================================================

app.get("/users", (req, res) => {

    const sql = `
        SELECT
            Users.id,
            Users.username,
            Users.email,
            COUNT(Todos.id) AS todo_count
        FROM Users
        LEFT JOIN Todos
            ON Users.id = Todos.user_id
        GROUP BY Users.id
        ORDER BY Users.id DESC
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

// ============================================================
// GET ONE USER
// ============================================================

app.get("/users/:id", (req, res) => {

    const id = Number(req.params.id);

    db.get(
        `
        SELECT id, username, email
        FROM Users
        WHERE id = ?
        `,
        [id],
        (err, user) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!user) {
                return res.status(404).json({
                    error: "User not found."
                });
            }

            res.json(user);
        }
    );
});

// ============================================================
// CREATE USER
// ============================================================

app.post("/users", async (req, res) => {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: "Username, email and password are required."
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO Users
            (username, email, password)
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
            [username.trim(), email.trim(), hashedPassword],
            function (err) {

                if (err) {

                    if (err.message.includes("UNIQUE")) {
                        return res.status(400).json({
                            error: "Username or email already exists."
                        });
                    }

                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "User created successfully.",
                    user: {
                        id: this.lastID,
                        username: username.trim(),
                        email: email.trim()
                    }
                });
            }
        );

    } catch (error) {

        res.status(500).json({
            error: "Unable to hash password."
        });
    }
});

// ============================================================
// EDIT / UPDATE USER
// ============================================================

app.put("/users/:id", async (req, res) => {

    const id = Number(req.params.id);

    const {
        username,
        email,
        password
    } = req.body;

    if (!username || !email) {
        return res.status(400).json({
            error: "Username and email are required."
        });
    }

    try {

        // If password was provided, update password too
        if (password && password.trim() !== "") {

            const hashedPassword =
                await bcrypt.hash(password, 10);

            const sql = `
                UPDATE Users
                SET username = ?,
                    email = ?,
                    password = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [
                    username.trim(),
                    email.trim(),
                    hashedPassword,
                    id
                ],
                function (err) {

                    if (err) {

                        if (err.message.includes("UNIQUE")) {
                            return res.status(400).json({
                                error: "Username or email already exists."
                            });
                        }

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            error: "User not found."
                        });
                    }

                    res.json({
                        message: "User updated successfully."
                    });
                }
            );

        } else {

            // Update username and email only
            const sql = `
                UPDATE Users
                SET username = ?,
                    email = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [
                    username.trim(),
                    email.trim(),
                    id
                ],
                function (err) {

                    if (err) {

                        if (err.message.includes("UNIQUE")) {
                            return res.status(400).json({
                                error: "Username or email already exists."
                            });
                        }

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            error: "User not found."
                        });
                    }

                    res.json({
                        message: "User updated successfully."
                    });
                }
            );
        }

    } catch (error) {

        res.status(500).json({
            error: "Unable to update user."
        });
    }
});

// ============================================================
// DELETE USER
// ============================================================

app.delete("/users/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM Users WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "User not found."
                });
            }

            res.json({
                message:
                    "User and associated Todos deleted successfully."
            });
        }
    );
});

// ============================================================
// GET ALL TODOS
// ============================================================

app.get("/todos", (req, res) => {

    const sql = `
        SELECT
            Todos.id,
            Todos.user_id,
            Todos.description,
            Todos.completed,
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

// ============================================================
// GET ONE TODO
// ============================================================

app.get("/todos/:id", (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        SELECT
            Todos.id,
            Todos.user_id,
            Todos.description,
            Todos.completed,
            Users.username,
            Users.email
        FROM Todos
        INNER JOIN Users
            ON Todos.user_id = Users.id
        WHERE Todos.id = ?
    `;

    db.get(sql, [id], (err, todo) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (!todo) {
            return res.status(404).json({
                error: "Todo not found."
            });
        }

        res.json(todo);
    });
});

// ============================================================
// CREATE TODO
// ============================================================

app.post("/todos", (req, res) => {

    const {
        user_id,
        description
    } = req.body;

    if (!user_id || !description) {
        return res.status(400).json({
            error: "User and Todo description are required."
        });
    }

    // Check that user exists first
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
                    error: "Selected user does not exist."
                });
            }

            const sql = `
                INSERT INTO Todos
                (user_id, description, completed)
                VALUES (?, ?, 0)
            `;

            db.run(
                sql,
                [
                    Number(user_id),
                    description.trim()
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        message: "Todo created successfully.",
                        todo: {
                            id: this.lastID,
                            user_id: Number(user_id),
                            description: description.trim(),
                            completed: 0,
                            username: user.username
                        }
                    });
                }
            );
        }
    );
});

// ============================================================
// EDIT / UPDATE TODO
// ============================================================

app.put("/todos/:id", (req, res) => {

    const id = Number(req.params.id);

    const {
        user_id,
        description,
        completed
    } = req.body;

    if (!user_id || !description) {
        return res.status(400).json({
            error: "User and Todo description are required."
        });
    }

    const completedValue =
        Number(completed) === 1 ? 1 : 0;

    // Make sure selected user exists
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
                    error: "Selected user does not exist."
                });
            }

            const sql = `
                UPDATE Todos
                SET user_id = ?,
                    description = ?,
                    completed = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [
                    Number(user_id),
                    description.trim(),
                    completedValue,
                    id
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            error: "Todo not found."
                        });
                    }

                    res.json({
                        message: "Todo updated successfully."
                    });
                }
            );
        }
    );
});

// ============================================================
// DELETE TODO
// ============================================================

app.delete("/todos/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM Todos WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Todo not found."
                });
            }

            res.json({
                message: "Todo deleted successfully."
            });
        }
    );
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log(" TaskFlow Server Started");
    console.log("======================================");
    console.log(` http://localhost:${PORT}`);
    console.log("======================================");
});