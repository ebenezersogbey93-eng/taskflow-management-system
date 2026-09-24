const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = new Map();
const SESSION_COOKIE = "taskflow_session";

function parseCookies(request) {
    return Object.fromEntries(
        (request.headers.cookie || "").split(";").filter(Boolean).map(cookie => {
            const separator = cookie.indexOf("=");
            return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1))];
        })
    );
}

function getSessionUser(request) {
    const token = parseCookies(request)[SESSION_COOKIE];
    return token ? sessions.get(token) : null;
}

function requireAuth(request, response, next) {
    if (!getSessionUser(request)) {
        if (request.path.startsWith("/api/")) {
            return response.status(401).json({ error: "Please log in to continue." });
        }
        return response.redirect("/login");
    }
    next();
}

function startSession(response, user) {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, {
        id: user.id,
        username: user.username,
        email: user.email
    });

    response.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
    );
}

// Serve current application files before legacy public snapshots.
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/login", (req, res) => {
    if (getSessionUser(req)) return res.redirect("/dashboard");
    res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.post("/login", (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    db.get(
        "SELECT id, username, email, password FROM Users WHERE username = ?",
        [username],
        async (error, user) => {
            if (error) return res.status(500).json({ error: "Unable to log in." });

            const validPassword = user && await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: "Incorrect username or password." });
            }

            startSession(res, user);
            res.json({ message: "Login successful.", user: { id: user.id, username: user.username, email: user.email } });
        }
    );
});

app.post("/register", async (req, res) => {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

    if (username.length < 3 || !email || password.length < 6) {
        return res.status(400).json({
            error: "Use a username with at least 3 characters, a valid email, and a password with at least 6 characters."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            "INSERT INTO Users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
            function (error) {
                if (error) {
                    if (error.message.includes("UNIQUE")) {
                        return res.status(409).json({ error: "That username or email is already registered." });
                    }
                    return res.status(500).json({ error: "Unable to create your account." });
                }

                const user = { id: this.lastID, username, email };
                startSession(res, user);
                res.status(201).json({ message: "Account created successfully.", user });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Unable to create your account." });
    }
});

app.get("/", (req, res) => {
    res.redirect(getSessionUser(req) ? "/dashboard" : "/login");
});

app.get("/dashboard", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "index.html")
    );
});

app.get("/users-page", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "users.html")
    );
});

app.get("/users-page/:id", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "user-detail.html")
    );
});

app.get("/todos-page", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "todos.html")
    );
});

app.get("/todos-page/:id", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "todo-detail.html")
    );
});

app.get("/settings-page", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "settings.html")
    );
});

app.get("/help-page", (req, res) => {
    if (!getSessionUser(req)) return res.redirect("/login");
    res.sendFile(
        path.join(__dirname, "..", "frontend", "help.html")
    );
});

app.get("/logout", (req, res) => {
    const cookies = parseCookies(req);
    if (cookies[SESSION_COOKIE]) sessions.delete(cookies[SESSION_COOKIE]);
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    res.redirect("/login");
});

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
        password TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error("Error creating Users table:", err.message);
    } else {
        console.log("Users table ready.");

        db.all("PRAGMA table_info(Users)", [], (infoError, columns) => {
            if (infoError) {
                console.error("Unable to inspect Users table:", infoError.message);
                return;
            }

            if (!columns.some(column => column.name === "created_at")) {
                db.run(
                    "ALTER TABLE Users ADD COLUMN created_at TEXT",
                    (alterError) => {
                        if (alterError) {
                            console.error("Unable to add user timestamps:", alterError.message);
                            return;
                        }

                        db.run(
                            "UPDATE Users SET created_at = datetime('now') WHERE created_at IS NULL",
                            (backfillError) => {
                                if (backfillError) {
                                    console.error("Unable to backfill user timestamps:", backfillError.message);
                                }
                            }
                        );
                    }
                );
            }
        });
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
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        FOREIGN KEY (user_id)
            REFERENCES Users(id)
            ON DELETE CASCADE
    )
`, (err) => {
    if (err) {
        console.error("Error creating Todos table:", err.message);
    } else {
        console.log("Todos table ready.");

        db.all("PRAGMA table_info(Todos)", [], (infoError, columns) => {
            if (infoError) {
                console.error("Unable to inspect Todos table:", infoError.message);
                return;
            }

            const addColumn = (name, definition) => {
                if (!columns.some(column => column.name === name)) {
                    db.run(`ALTER TABLE Todos ADD COLUMN ${name} ${definition}`, alterError => {
                        if (alterError) {
                            console.error(`Unable to add ${name}:`, alterError.message);
                        }
                    });
                }
            };

            addColumn("priority", "TEXT");
            addColumn("due_date", "TEXT");
        });
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

app.use("/api", requireAuth);

app.get("/api/me", (req, res) => {
    res.json(getSessionUser(req));
});

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

app.get("/api/users", (req, res) => {

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

app.get("/api/users/:id", (req, res) => {

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

app.post("/api/users", async (req, res) => {

    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (username.length < 3 || !email || password.length < 6) {
        return res.status(400).json({
            error: "Username must be 3+ characters, email is required, and password must be 6+ characters."
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
            [username, email, hashedPassword],
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
                        username,
                        email
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

app.put("/api/users/:id", async (req, res) => {

    const id = Number(req.params.id);

    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (username.length < 3 || !email) {
        return res.status(400).json({
            error: "Username must be 3+ characters and email is required."
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
                    username,
                    email,
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
                    username,
                    email,
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

app.delete("/api/users/:id", (req, res) => {

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

app.get("/api/todos", (req, res) => {

    const sql = `
        SELECT
            Todos.id,
            Todos.user_id,
            Todos.description,
            Todos.completed,
            COALESCE(Todos.priority, 'medium') AS priority,
            Todos.due_date,
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

app.get("/api/todos/:id", (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        SELECT
            Todos.id,
            Todos.user_id,
            Todos.description,
            Todos.completed,
            COALESCE(Todos.priority, 'medium') AS priority,
            Todos.due_date,
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

app.post("/api/todos", (req, res) => {

    const user_id = Number(req.body.user_id);
    const description = String(req.body.description || "").trim();
    const priority = req.body.priority || "medium";
    const due_date = req.body.due_date || null;

    if (!user_id || description.length < 3) {
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
                (user_id, description, completed, priority, due_date)
                VALUES (?, ?, 0, ?, ?)
            `;

            db.run(
                sql,
                [
                    Number(user_id),
                    description,
                    ["high", "medium", "low"].includes(priority) ? priority : "medium",
                    due_date || null
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
                            description,
                            completed: 0,
                            priority,
                            due_date: due_date || null,
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

app.put("/api/todos/:id", (req, res) => {

    const id = Number(req.params.id);

    const user_id = Number(req.body.user_id);
    const description = String(req.body.description || "").trim();
    const completed = req.body.completed;
    const priority = req.body.priority || "medium";
    const due_date = req.body.due_date || null;

    if (!user_id || description.length < 3) {
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
                    completed = ?,
                    priority = ?,
                    due_date = ?
                WHERE id = ?
            `;

            db.run(
                sql,
                [
                    Number(user_id),
                    description,
                    completedValue,
                    ["high", "medium", "low"].includes(priority) ? priority : "medium",
                    due_date || null,
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

app.delete("/api/todos/:id", (req, res) => {

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

app.get("/api/chart-data", (req, res) => {
    const monthlyUsersQuery = `
        SELECT
            strftime('%Y-%m', COALESCE(created_at, datetime('now'))) AS month,
            COUNT(*) AS count
        FROM Users
        WHERE COALESCE(created_at, datetime('now')) >= date('now', '-5 months', 'start of month')
        GROUP BY month
        ORDER BY month ASC
    `;

    db.all(monthlyUsersQuery, [], (usersError, monthlyUsers) => {
        if (usersError) {
            return res.status(500).json({ error: usersError.message });
        }

        db.all(
            "SELECT completed, COUNT(*) AS count FROM Todos GROUP BY completed",
            [],
            (todosError, statusRows) => {
                if (todosError) {
                    return res.status(500).json({ error: todosError.message });
                }

                const status = { completed: 0, pending: 0 };
                statusRows.forEach(row => {
                    status[Number(row.completed) === 1 ? "completed" : "pending"] = row.count;
                });

                res.json({ monthlyUsers, status });
            }
        );
    });
});

app.get("/api/activity", (req, res) => {
    const activities = [];

    db.all(
        "SELECT id, username FROM Users ORDER BY id DESC LIMIT 5",
        [],
        (usersError, recentUsers) => {
            if (usersError) {
                return res.status(500).json({ error: usersError.message });
            }

            recentUsers.forEach(user => {
                activities.push({
                    id: `user-${user.id}`,
                    icon: "✓",
                    message: `${user.username} created User`,
                    type: "user"
                });
            });

            db.all(
                `
                    SELECT Todos.id, Todos.description, Todos.completed, Users.username
                    FROM Todos
                    INNER JOIN Users ON Users.id = Todos.user_id
                    ORDER BY Todos.id DESC
                    LIMIT 5
                `,
                [],
                (todosError, recentTodos) => {
                    if (todosError) {
                        return res.status(500).json({ error: todosError.message });
                    }

                    recentTodos.forEach(todo => {
                        activities.push({
                            id: `todo-${todo.id}`,
                            icon: "✓",
                            message: `${todo.username} ${todo.completed ? "completed" : "added"} TODO`,
                            detail: todo.description,
                            type: "todo"
                        });
                    });

                    res.json(activities.slice(0, 8));
                }
            );
        }
    );
});