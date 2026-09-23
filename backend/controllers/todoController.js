const Todo = require("../models/todoModel");


const getTodos = (req, res) => {

    Todo.getAll((err, todos) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(todos);
    });
};


const getTodoById = (req, res) => {

    const { id } = req.params;

    Todo.getById(id, (err, todo) => {

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
};


const createTodo = (req, res) => {

    const {
        description,
        user_id
    } = req.body;

    if (!description || !user_id) {

        return res.status(400).json({
            error: "Description and user_id are required."
        });
    }

    Todo.create(
        description,
        user_id,
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Todo created successfully.",
                id: result.lastID
            });
        }
    );
};


const updateTodo = (req, res) => {

    const { id } = req.params;

    const {
        description,
        user_id,
        completed
    } = req.body;

    if (!description || !user_id) {

        return res.status(400).json({
            error: "Description and user_id are required."
        });
    }

    Todo.update(
        id,
        description,
        user_id,
        completed ? 1 : 0,
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.changes === 0) {

                return res.status(404).json({
                    error: "Todo not found."
                });
            }

            res.json({
                message: "Todo updated successfully."
            });
        }
    );
};


const deleteTodo = (req, res) => {

    const { id } = req.params;

    Todo.delete(id, (err, result) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        if (result.changes === 0) {

            return res.status(404).json({
                error: "Todo not found."
            });
        }

        res.json({
            message: "Todo deleted successfully."
        });
    });
};


module.exports = {
    getTodos,
    getTodoById,
    createTodo,
    updateTodo,
    deleteTodo
};