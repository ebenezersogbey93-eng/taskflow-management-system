const express = require("express");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const router = express.Router();


// GET all users
// GET /api/users
router.get("/", getUsers);


// GET one user
// GET /api/users/:id
router.get("/:id", getUserById);


// Create a new user
// POST /api/users
router.post("/", createUser);


// Update a user
// PUT /api/users/:id
router.put("/:id", updateUser);


// Delete a user
// DELETE /api/users/:id
router.delete("/:id", deleteUser);


module.exports = router;