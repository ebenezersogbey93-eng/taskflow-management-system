const db = require("../config/database");

const Todo = {

    getAll: (callback) => {

        const sql = `
            SELECT
                Todos.id,
                Todos.description,
                Todos.user_id,
                Todos.completed,
                Users.username,
                Users.email
            FROM Todos
            INNER JOIN Users
                ON Todos.user_id = Users.id
            ORDER BY Todos.id DESC
        `;

        db.all(sql, [], callback);
    },

    getById: (id, callback) => {

        const sql = `
            SELECT
                Todos.id,
                Todos.description,
                Todos.user_id,
                Todos.completed,
                Users.username,
                Users.email
            FROM Todos
            INNER JOIN Users
                ON Todos.user_id = Users.id
            WHERE Todos.id = ?
        `;

        db.get(sql, [id], callback);
    },

    create: (description, user_id, callback) => {

        const sql = `
            INSERT INTO Todos
            (description, user_id, completed)
            VALUES (?, ?, 0)
        `;

        db.run(
            sql,
            [description, user_id],
            function (err) {
                callback(err, this);
            }
        );
    },

    update: (id, description, user_id, completed, callback) => {

        const sql = `
            UPDATE Todos
            SET description = ?,
                user_id = ?,
                completed = ?
            WHERE id = ?
        `;

        db.run(
            sql,
            [description, user_id, completed, id],
            function (err) {
                callback(err, this);
            }
        );
    },

    delete: (id, callback) => {

        const sql = `
            DELETE FROM Todos
            WHERE id = ?
        `;

        db.run(
            sql,
            [id],
            function (err) {
                callback(err, this);
            }
        );
    }
};

module.exports = Todo;