const express = require("express");

const {
    getTodos,
    getTodoById,
    createTodo,
    updateTodo,
    deleteTodo
} = require("../controllers/todoController");

const router = express.Router();


// GET all Todos
// GET /api/todos
router.get("/", getTodos);


// GET one Todo
// GET /api/todos/:id
router.get("/:id", getTodoById);


// Create a new Todo
// POST /api/todos
router.post("/", createTodo);


// Update a Todo
// PUT /api/todos/:id
router.put("/:id", updateTodo);


// Delete a Todo
// DELETE /api/todos/:id
router.delete("/:id", deleteTodo);


module.exports = router;