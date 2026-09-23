const db = require("../config/database");

const User = {

    getAll: (callback) => {
        const sql = `
            SELECT
                Users.id,
                Users.username,
                Users.email,
                COUNT(Todos.id) AS todo_count
            FROM Users
            LEFT JOIN Todos ON Users.id = Todos.user_id
            GROUP BY Users.id
            ORDER BY Users.id DESC
        `;

        db.all(sql, [], callback);
    },

    getById: (id, callback) => {
        const sql = `
            SELECT
                Users.id,
                Users.username,
                Users.email,
                COUNT(Todos.id) AS todo_count
            FROM Users
            LEFT JOIN Todos ON Users.id = Todos.user_id
            WHERE Users.id = ?
            GROUP BY Users.id
        `;

        db.get(sql, [id], callback);
    },

    create: (username, email, password, callback) => {
        const sql = `
            INSERT INTO Users (username, email, password)
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
            [username, email, password],
            function (err) {
                callback(err, this);
            }
        );
    },

    update: (id, username, email, password, callback) => {

        let sql;
        let params;

        if (password) {
            sql = `
                UPDATE Users
                SET username = ?, email = ?, password = ?
                WHERE id = ?
            `;

            params = [username, email, password, id];

        } else {
            sql = `
                UPDATE Users
                SET username = ?, email = ?
                WHERE id = ?
            `;

            params = [username, email, id];
        }

        db.run(sql, params, function (err) {
            callback(err, this);
        });
    },

    delete: (id, callback) => {

        db.run(
            `DELETE FROM Todos WHERE user_id = ?`,
            [id],
            (err) => {

                if (err) {
                    return callback(err);
                }

                db.run(
                    `DELETE FROM Users WHERE id = ?`,
                    [id],
                    function (err) {
                        callback(err, this);
                    }
                );
            }
        );
    }
};

module.exports = User;