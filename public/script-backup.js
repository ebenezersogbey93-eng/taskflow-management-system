// ==========================================
// ELEMENTS
// ==========================================

const usersTable =
    document.getElementById("users-table");

const todoContainer =
    document.getElementById("todo-container");

const userSelect =
    document.getElementById("todo-user");

const totalUsers =
    document.getElementById("total-users");

const totalTodos =
    document.getElementById("total-todos");

const usersWithTasks =
    document.getElementById("users-with-tasks");

const userCount =
    document.getElementById("user-count");


// Store users and todos
let users = [];
let todos = [];


// ==========================================
// GET USERS
// ==========================================

async function fetchUsers() {

    try {

        const response =
            await fetch("/api/users");

        if (!response.ok) {
            throw new Error("Could not load users");
        }

        users =
            await response.json();

        renderUsers();

        populateUserSelect();

        updateStatistics();

    } catch (error) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="4">
                    Error loading users.
                </td>
            </tr>
        `;

    }
}


// ==========================================
// DISPLAY USERS
// ==========================================

function renderUsers() {

    usersTable.innerHTML = "";

    userCount.textContent =
        `${users.length} User${users.length === 1 ? "" : "s"}`;


    if (users.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    users.forEach(user => {

        const row =
            document.createElement("tr");


        const id =
            document.createElement("td");

        id.textContent =
            user.id;


        const username =
            document.createElement("td");

        username.textContent =
            user.username;


        const email =
            document.createElement("td");

        email.textContent =
            user.email;


        const actions =
            document.createElement("td");


        // EDIT BUTTON

        const editButton =
            document.createElement("button");

        editButton.textContent =
            "Edit";

        editButton.className =
            "edit-btn";

        editButton.addEventListener(
            "click",
            () => editUser(
                user.id,
                user.username,
                user.email
            )
        );


        // DELETE BUTTON

        const deleteButton =
            document.createElement("button");

        deleteButton.textContent =
            "Delete";

        deleteButton.className =
            "delete-btn";

        deleteButton.addEventListener(
            "click",
            () => deleteUser(user.id)
        );


        actions.appendChild(editButton);

        actions.appendChild(deleteButton);


        row.appendChild(id);

        row.appendChild(username);

        row.appendChild(email);

        row.appendChild(actions);


        usersTable.appendChild(row);

    });

}


// ==========================================
// USER DROPDOWN
// ==========================================

function populateUserSelect() {

    userSelect.innerHTML = `
        <option value="">
            Select User
        </option>
    `;


    users.forEach(user => {

        const option =
            document.createElement("option");

        option.value =
            user.id;

        option.textContent =
            `${user.username} (ID: ${user.id})`;

        userSelect.appendChild(option);

    });

}


// ==========================================
// CREATE USER
// ==========================================

document
    .getElementById("user-form")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const message =
                document
                    .getElementById("user-message");


            try {

                const response =
                    await fetch(
                        "/api/users",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                username,
                                email,
                                password
                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error
                    );

                }


                message.textContent =
                    "✓ User created successfully.";

                message.style.color =
                    "#16a34a";


                document
                    .getElementById("user-form")
                    .reset();


                await fetchUsers();

                await fetchTodos();


            } catch (error) {

                message.textContent =
                    "Error: " +
                    error.message;

                message.style.color =
                    "#dc2626";

            }

        }
    );


// ==========================================
// EDIT USER
// ==========================================

async function editUser(
    id,
    oldUsername,
    oldEmail
) {

    const username =
        prompt(
            "Enter new username:",
            oldUsername
        );


    if (username === null) {
        return;
    }


    const email =
        prompt(
            "Enter new email:",
            oldEmail
        );


    if (email === null) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/users/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        email
                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        alert(
            "User updated successfully!"
        );


        fetchUsers();

        fetchTodos();


    } catch (error) {

        alert(
            "Error updating user: " +
            error.message
        );

    }

}


// ==========================================
// DELETE USER
// ==========================================

async function deleteUser(id) {

    const confirmation =
        confirm(
            "Are you sure you want to delete this user and their TODOs?"
        );


    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/users/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        alert(
            "User and their TODOs deleted successfully!"
        );


        await fetchUsers();

        await fetchTodos();


    } catch (error) {

        alert(
            "Error deleting user: " +
            error.message
        );

    }

}


// ==========================================
// CREATE TODO
// ==========================================

document
    .getElementById("todo-form")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const userId =
                document
                    .getElementById("todo-user")
                    .value;


            const description =
                document
                    .getElementById(
                        "todo-description"
                    )
                    .value
                    .trim();


            const message =
                document
                    .getElementById(
                        "todo-message"
                    );


            if (!userId) {

                message.textContent =
                    "Please select a user.";

                message.style.color =
                    "#dc2626";

                return;

            }


            try {

                const response =
                    await fetch(
                        "/api/todos",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                user_id:
                                    Number(userId),

                                description

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error
                    );

                }


                message.textContent =
                    "✓ TODO created successfully.";

                message.style.color =
                    "#16a34a";


                document
                    .getElementById("todo-form")
                    .reset();


                await fetchTodos();


            } catch (error) {

                message.textContent =
                    "Error: " +
                    error.message;

                message.style.color =
                    "#dc2626";

            }

        }
    );


// ==========================================
// GET TODOS
// ==========================================

async function fetchTodos() {

    try {

        const response =
            await fetch("/api/todos");


        if (!response.ok) {

            throw new Error(
                "Could not load TODOs"
            );

        }


        todos =
            await response.json();


        renderTodos();

        updateStatistics();


    } catch (error) {

        todoContainer.innerHTML = `
            <div class="empty">
                Error loading TODOs.
            </div>
        `;

    }

}


// ==========================================
// DISPLAY TODO CARDS
// ==========================================

function renderTodos() {

    todoContainer.innerHTML = "";


    if (todos.length === 0) {

        todoContainer.innerHTML = `
            <div class="empty">
                No TODOs available yet.
            </div>
        `;

        return;
    }


    todos.forEach(todo => {

        const card =
            document.createElement("div");

        card.className =
            "todo-card";


        const top =
            document.createElement("div");

        top.className =
            "todo-top";


        const number =
            document.createElement("span");

        number.className =
            "todo-number";

        number.textContent =
            `TODO #${todo.id}`;


        const badge =
            document.createElement("span");

        badge.className =
            "todo-badge";

        badge.textContent =
            "TASK";


        top.appendChild(number);

        top.appendChild(badge);


        const title =
            document.createElement("h3");

        title.textContent =
            todo.description;


        const userInfo =
            document.createElement("div");

        userInfo.className =
            "todo-user";


        const user =
            document.createElement("p");

        user.innerHTML =
            `<strong>User:</strong> ${escapeHTML(todo.username)}`;


        const email =
            document.createElement("p");

        email.innerHTML =
            `<strong>Email:</strong> ${escapeHTML(todo.email)}`;


        userInfo.appendChild(user);

        userInfo.appendChild(email);


        const actions =
            document.createElement("div");

        actions.className =
            "todo-actions";


        const editButton =
            document.createElement("button");

        editButton.textContent =
            "Edit";

        editButton.className =
            "edit-btn";


        editButton.addEventListener(
            "click",
            () => editTodo(
                todo.id,
                todo.user_id,
                todo.description
            )
        );


        const deleteButton =
            document.createElement("button");

        deleteButton.textContent =
            "Delete";

        deleteButton.className =
            "delete-btn";


        deleteButton.addEventListener(
            "click",
            () => deleteTodo(todo.id)
        );


        actions.appendChild(editButton);

        actions.appendChild(deleteButton);


        card.appendChild(top);

        card.appendChild(title);

        card.appendChild(userInfo);

        card.appendChild(actions);


        todoContainer.appendChild(card);

    });

}


// ==========================================
// EDIT TODO
// ==========================================

async function editTodo(
    id,
    oldUserId,
    oldDescription
) {

    const description =
        prompt(
            "Edit TODO description:",
            oldDescription
        );


    if (description === null) {
        return;
    }


    const userId =
        prompt(
            "Enter User ID:",
            oldUserId
        );


    if (userId === null) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/todos/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        user_id:
                            Number(userId),

                        description

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        alert(
            "TODO updated successfully!"
        );


        fetchTodos();


    } catch (error) {

        alert(
            "Error updating TODO: " +
            error.message
        );

    }

}


// ==========================================
// DELETE TODO
// ==========================================

async function deleteTodo(id) {

    const confirmation =
        confirm(
            "Are you sure you want to delete this TODO?"
        );


    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/todos/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        alert(
            "TODO deleted successfully!"
        );


        fetchTodos();


    } catch (error) {

        alert(
            "Error deleting TODO: " +
            error.message
        );

    }

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics() {

    totalUsers.textContent =
        users.length;


    totalTodos.textContent =
        todos.length;


    const userIds =
        new Set(
            todos.map(todo => todo.user_id)
        );


    usersWithTasks.textContent =
        userIds.size;

}


// ==========================================
// SECURITY HELPER
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ==========================================
// MOBILE SIDEBAR
// ==========================================

const menuButton =
    document.getElementById("menu-btn");

const sidebar =
    document.getElementById("sidebar");


menuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "show"
        );

    }
);


// Close sidebar when navigation
// link is clicked on mobile

document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "show"
                );

            }
        );

    });


// ==========================================
// LOAD EVERYTHING
// ==========================================

fetchUsers();

fetchTodos();