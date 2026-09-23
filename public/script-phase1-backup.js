let allUsers = [];
let allTodos = [];


// ========================================
// GET USERS
// ========================================

async function fetchUsers() {

    const usersTable = document.getElementById("users-table");

    try {

        const response = await fetch("/api/users");

        if (!response.ok) {
            throw new Error("Failed to fetch users");
        }

        allUsers = await response.json();

        displayUsers(allUsers);

        updateStatistics();

    } catch (error) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="4">
                    Error loading users: ${error.message}
                </td>
            </tr>
        `;
    }
}


// ========================================
// DISPLAY USERS
// ========================================

function displayUsers(users) {

    const usersTable = document.getElementById("users-table");

    usersTable.innerHTML = "";

    if (users.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:30px;">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    users.forEach(user => {

        const row = document.createElement("tr");


        // ID
        const idCell = document.createElement("td");

        idCell.textContent = `#${String(user.id).padStart(3, "0")}`;


        // USER
        const userCell = document.createElement("td");

        const userName = document.createElement("div");

        userName.className = "user-name";


        const avatar = document.createElement("div");

        avatar.className = "avatar";

        avatar.textContent =
            user.username.charAt(0).toUpperCase();


        const name = document.createElement("span");

        name.textContent = user.username;


        userName.appendChild(avatar);

        userName.appendChild(name);

        userCell.appendChild(userName);


        // EMAIL
        const emailCell = document.createElement("td");

        emailCell.textContent = user.email;


        // ACTIONS
        const actionCell = document.createElement("td");


        const editButton = document.createElement("button");

        editButton.textContent = "Edit";

        editButton.className = "edit-btn";


        editButton.addEventListener("click", function () {

            editUser(
                user.id,
                user.username,
                user.email
            );

        });


        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";

        deleteButton.className = "delete-btn";


        deleteButton.addEventListener("click", function () {

            deleteUser(user.id);

        });


        actionCell.appendChild(editButton);

        actionCell.appendChild(deleteButton);


        row.appendChild(idCell);

        row.appendChild(userCell);

        row.appendChild(emailCell);

        row.appendChild(actionCell);


        usersTable.appendChild(row);

    });
}


// ========================================
// CREATE USER
// ========================================

document
    .getElementById("user-form")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const username =
            document.getElementById("username").value;

        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("user-message");


        try {

            const response = await fetch("/api/users", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username,
                    email,
                    password
                })

            });


            const data = await response.json();


            if (!response.ok) {

                throw new Error(data.error);

            }


            message.textContent =
                "✓ User created successfully!";

            message.style.color = "green";


            document
                .getElementById("user-form")
                .reset();


            fetchUsers();


        } catch (error) {

            message.textContent =
                "Error: " + error.message;

            message.style.color = "red";

        }

    });


// ========================================
// EDIT USER
// ========================================

async function editUser(
    id,
    oldUsername,
    oldEmail
) {

    const username = prompt(
        "Enter new username:",
        oldUsername
    );


    if (username === null) {
        return;
    }


    const email = prompt(
        "Enter new email:",
        oldEmail
    );


    if (email === null) {
        return;
    }


    const password = prompt(
        "Enter new password, or leave empty to keep the current password:"
    );


    try {

        const body = {
            username,
            email
        };


        if (password) {

            body.password = password;

        }


        const response = await fetch(
            `/api/users/${id}`,
            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(body)

            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(data.error);

        }


        alert("User updated successfully!");

        fetchUsers();


    } catch (error) {

        alert(
            "Error updating user: " +
            error.message
        );

    }

}


// ========================================
// DELETE USER
// ========================================

async function deleteUser(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this user?\n\nAll TODOs belonging to this user will also be deleted."
    );


    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `/api/users/${id}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(data.error);

        }


        alert(
            "User deleted successfully!"
        );


        fetchUsers();

        fetchTodos();


    } catch (error) {

        alert(
            "Error deleting user: " +
            error.message
        );

    }

}


// ========================================
// GET TODOS
// ========================================

async function fetchTodos() {

    const todoContainer =
        document.getElementById("todo-container");

    const loading =
        document.getElementById("loading");


    try {

        const response =
            await fetch("/api/todos");


        if (!response.ok) {

            throw new Error(
                "Failed to fetch TODOs"
            );

        }


        allTodos =
            await response.json();


        loading.style.display = "none";


        displayTodos(allTodos);


        updateStatistics();


    } catch (error) {

        loading.style.display = "none";


        todoContainer.innerHTML = `
            <p>
                Error loading TODOs:
                ${error.message}
            </p>
        `;

    }

}


// ========================================
// DISPLAY TODO CARDS
// ========================================

function displayTodos(todos) {

    const todoContainer =
        document.getElementById("todo-container");


    todoContainer.innerHTML = "";


    if (todos.length === 0) {

        todoContainer.innerHTML = `
            <div class="todo-card">

                <h3>No tasks yet</h3>

                <p class="todo-description">
                    There are currently no To-Dos
                    in the system.
                </p>

            </div>
        `;

        return;
    }


    todos.forEach(todo => {

        const card =
            document.createElement("div");

        card.className = "todo-card";


        // TOP
        const top =
            document.createElement("div");

        top.className = "todo-top";


        const title =
            document.createElement("h3");

        title.textContent =
            todo.description;


        const number =
            document.createElement("span");

        number.className = "todo-number";

        number.textContent =
            `#${String(todo.id).padStart(3, "0")}`;


        top.appendChild(title);

        top.appendChild(number);


        // DESCRIPTION
        const description =
            document.createElement("p");

        description.className =
            "todo-description";

        description.textContent =
            "Task assigned to a registered user.";


        // USER SECTION
        const user =
            document.createElement("div");

        user.className =
            "todo-user";


        const avatar =
            document.createElement("div");

        avatar.className =
            "todo-user-avatar";


        const username =
            todo.username || "Unknown User";


        avatar.textContent =
            username.charAt(0).toUpperCase();


        const userInfo =
            document.createElement("div");

        userInfo.className =
            "todo-user-info";


        const userNameText =
            document.createElement("strong");

        userNameText.textContent =
            username;


        const userEmail =
            document.createElement("span");

        userEmail.textContent =
            todo.email || "No email";


        userInfo.appendChild(
            userNameText
        );

        userInfo.appendChild(
            userEmail
        );


        user.appendChild(avatar);

        user.appendChild(userInfo);


        // STATUS
        const status =
            document.createElement("span");

        status.className =
            "todo-status";

        status.textContent =
            "● Pending";


        // ADD EVERYTHING
        card.appendChild(top);

        card.appendChild(description);

        card.appendChild(user);

        card.appendChild(status);


        todoContainer.appendChild(card);

    });

}


// ========================================
// UPDATE DASHBOARD STATISTICS
// ========================================

function updateStatistics() {

    document.getElementById(
        "total-users"
    ).textContent =
        allUsers.length;


    document.getElementById(
        "total-todos"
    ).textContent =
        allTodos.length;


    // Phase 1 does not yet have
    // a status field in the database.
    // Therefore all current TODOs
    // are treated as pending.

    document.getElementById(
        "completed-todos"
    ).textContent = 0;


    document.getElementById(
        "pending-todos"
    ).textContent =
        allTodos.length;

}


// ========================================
// USER SEARCH
// ========================================

document
    .getElementById("user-search")
    .addEventListener("input", function () {

        const search =
            this.value.toLowerCase();


        const filteredUsers =
            allUsers.filter(user =>

                user.username
                    .toLowerCase()
                    .includes(search)

                ||

                user.email
                    .toLowerCase()
                    .includes(search)

            );


        displayUsers(filteredUsers);

    });


// ========================================
// TODO SEARCH
// ========================================

document
    .getElementById("todo-search")
    .addEventListener("input", function () {

        const search =
            this.value.toLowerCase();


        const filteredTodos =
            allTodos.filter(todo =>

                todo.description
                    .toLowerCase()
                    .includes(search)

                ||

                (todo.username || "")
                    .toLowerCase()
                    .includes(search)

            );


        displayTodos(filteredTodos);

    });


// ========================================
// MOBILE SIDEBAR
// ========================================

const mobileMenuBtn =
    document.getElementById(
        "mobile-menu-btn"
    );


const sidebar =
    document.getElementById("sidebar");


mobileMenuBtn.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle(
            "open"
        );

    }
);


// Close sidebar after
// clicking navigation on mobile

document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            function () {

                sidebar.classList.remove(
                    "open"
                );

            }
        );

    });


// ========================================
// ADD USER BUTTON
// ========================================

document
    .getElementById("focus-user-form")
    .addEventListener("click", function () {

        document
            .getElementById("username")
            .focus();

        document
            .getElementById("user-form")
            .scrollIntoView({
                behavior: "smooth"
            });

    });


// ========================================
// START APPLICATION
// ========================================

fetchUsers();

fetchTodos();