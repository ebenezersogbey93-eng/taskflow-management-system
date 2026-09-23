const bcrypt = require("bcrypt");

const User = require("../models/userModel");

const getUsers = (req, res) => {

    User.getAll((err, users) => {

        if (err) {
            console.error(err.message);

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(users);
    });
};


const getUserById = (req, res) => {

    const { id } = req.params;

    User.getById(id, (err, user) => {

        if (err) {
            console.error(err.message);

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
    });
};


const createUser = async (req, res) => {

    const {
        username,
        email,
        password
    } = req.body;

    if (!username || !email || !password) {

        return res.status(400).json({
            error: "Username, email and password are required."
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        User.create(
            username,
            email,
            hashedPassword,
            (err, result) => {

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
                    id: result.lastID
                });
            }
        );

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
};


const updateUser = async (req, res) => {

    const { id } = req.params;

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

        let hashedPassword = null;

        if (password) {
            hashedPassword = await bcrypt.hash(
                password,
                10
            );
        }

        User.update(
            id,
            username,
            email,
            hashedPassword,
            (err, result) => {

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

                if (result.changes === 0) {

                    return res.status(404).json({
                        error: "User not found."
                    });
                }

                res.json({
                    message: "User updated successfully."
                });
            }
        );

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
};


const deleteUser = (req, res) => {

    const { id } = req.params;

    User.delete(id, (err, result) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        if (result.changes === 0) {

            return res.status(404).json({
                error: "User not found."
            });
        }

        res.json({
            message: "User deleted successfully."
        });
    });
};


module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};