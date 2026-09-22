// ============================================================
// TASKFLOW FRONTEND JAVASCRIPT
// Users + Todos + Dashboard
// ============================================================


let users = [];
let todos = [];

let editingUserId = null;
let editingTodoId = null;


// ============================================================
// API FUNCTION
// ============================================================

async function api(url, options = {}) {

    const response = await fetch(url, {

        ...options,

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }

    });


    const data =
        await response.json().catch(() => ({}));


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Request failed with status ${response.status}`
        );

    }


    return data;
}


// ============================================================
// ELEMENTS
// ============================================================

const loading =
    document.getElementById("loading");

const notification =
    document.getElementById("notification");

const notificationMessage =
    document.getElementById("notification-message");


// USER ELEMENTS

const userForm =
    document.getElementById("user-form");

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const usersTable =
    document.getElementById("users-table");

const userCount =
    document.getElementById("user-count");


// TODO ELEMENTS

const todoForm =
    document.getElementById("todo-form");

const todoUserSelect =
    document.getElementById("todo-user");

const descriptionInput =
    document.getElementById("description");

const todoContainer =
    document.getElementById("todo-container");

const todoCount =
    document.getElementById("todo-count");


// DASHBOARD ELEMENTS

const totalUsers =
    document.getElementById("total-users");

const totalTodos =
    document.getElementById("total-todos");

const completedTodos =
    document.getElementById("completed-todos");

const pendingTodos =
    document.getElementById("pending-todos");

const recentTodos =
    document.getElementById("recent-todos");


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (userForm) {
            setupUserForm();
        }

        if (todoForm) {
            setupTodoForm();
        }

        loadPageData();

    }
);


// ============================================================
// LOAD DATA
// ============================================================

async function loadPageData() {

    showLoading(true);

    try {

        await loadUsers();

        await loadTodos();


        // Dashboard

        updateDashboard();

        renderRecentTodos();


        // Users page

        populateUserSelect();

        renderUsers();


        // Todos page

        renderTodos();

    }

    catch (error) {

        console.error(error);

        showNotification(
            error.message ||
            "Unable to load data.",
            "error"
        );

    }

    finally {

        showLoading(false);

    }

}


// ============================================================
// LOADING
// ============================================================

function showLoading(show) {

    if (!loading) return;

    loading.style.display =
        show ? "flex" : "none";

}


// ============================================================
// LOAD USERS
// ============================================================

async function loadUsers() {

    const data =
        await api("/users");


    if (Array.isArray(data)) {

        users = data;

    }

    else if (Array.isArray(data.users)) {

        users = data.users;

    }

    else {

        users = [];

    }

}


// ============================================================
// RENDER USERS
// ============================================================

function renderUsers() {

    if (!usersTable) return;


    usersTable.innerHTML = "";


    if (users.length === 0) {

        usersTable.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-state"
                >
                    No users found.
                </td>

            </tr>

        `;

        updateUserCount();

        return;

    }


    users.forEach(user => {


        const userTodoCount =
            todos.filter(
                todo =>
                    Number(todo.user_id) ===
                    Number(user.id)
            ).length;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(user.id)}
            </td>


            <td>

                <strong>
                    ${escapeHTML(user.username)}
                </strong>

            </td>


            <td>
                ${escapeHTML(user.email)}
            </td>


            <td>

                <span class="todo-number">
                    ${userTodoCount}
                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="btn-edit"
                        onclick="editUser(${user.id})"
                    >
                        Edit
                    </button>


                    <button
                        class="btn-delete"
                        onclick="deleteUser(${user.id})"
                    >
                        Delete
                    </button>

                </div>

            </td>

        `;


        usersTable.appendChild(row);

    });


    updateUserCount();

}


// ============================================================
// USER COUNT
// ============================================================

function updateUserCount() {

    if (!userCount) return;


    userCount.textContent =
        `${users.length} user${users.length === 1 ? "" : "s"}`;

}


// ============================================================
// USER FORM
// ============================================================

function setupUserForm() {

    userForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const username =
                usernameInput.value.trim();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value.trim();


            if (!username || !email) {

                showNotification(
                    "Username and email are required.",
                    "error"
                );

                return;

            }


            // Creating a new user

            if (!editingUserId && !password) {

                showNotification(
                    "Password is required when creating a user.",
                    "error"
                );

                return;

            }


            try {


                // EDIT USER

                if (editingUserId) {


                    const body = {
                        username,
                        email
                    };


                    // Only send password
                    // if user entered one

                    if (password) {

                        body.password = password;

                    }


                    await api(
                        `/users/${editingUserId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(body)
                        }
                    );


                    showNotification(
                        "User updated successfully.",
                        "success"
                    );

                }


                // CREATE USER

                else {


                    await api(
                        "/users",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    username,
                                    email,
                                    password
                                })
                        }
                    );


                    showNotification(
                        "User created successfully.",
                        "success"
                    );

                }


                resetUserForm();


                await loadUsers();

                await loadTodos();


                populateUserSelect();

                renderUsers();

                renderTodos();

                renderRecentTodos();

                updateDashboard();

            }


            catch (error) {

                showNotification(
                    error.message ||
                    "Unable to save user.",
                    "error"
                );

            }

        }
    );

}


// ============================================================
// EDIT USER
// ============================================================

function editUser(id) {

    const user =
        users.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!user) {

        showNotification(
            "User not found.",
            "error"
        );

        return;

    }


    editingUserId = id;


    usernameInput.value =
        user.username || "";


    emailInput.value =
        user.email || "";


    passwordInput.value = "";


    const submitButton =
        userForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.textContent =
            "Update User";

    }


    const cancelButton =
        document.getElementById(
            "cancel-user-edit"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "inline-flex";

    }


    const title =
        document.getElementById(
            "user-form-title"
        );


    if (title) {

        title.textContent =
            "Edit User";

    }


    const description =
        document.getElementById(
            "user-form-description"
        );


    if (description) {

        description.textContent =
            "Update the user's information.";

    }


    userForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    usernameInput.focus();

}


// ============================================================
// RESET USER FORM
// ============================================================

function resetUserForm() {

    editingUserId = null;


    userForm.reset();


    const submitButton =
        userForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.textContent =
            "Add User";

    }


    const cancelButton =
        document.getElementById(
            "cancel-user-edit"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }


    const title =
        document.getElementById(
            "user-form-title"
        );


    if (title) {

        title.textContent =
            "Create User";

    }


    const description =
        document.getElementById(
            "user-form-description"
        );


    if (description) {

        description.textContent =
            "Add a new user to the system.";

    }

}


// ============================================================
// DELETE USER
// ============================================================

async function deleteUser(id) {

    const user =
        users.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!user) return;


    const userTodos =
        todos.filter(
            todo =>
                Number(todo.user_id) ===
                Number(id)
        );


    let message =
        `Are you sure you want to delete "${user.username}"?`;


    if (userTodos.length > 0) {

        message +=
            `\n\nThis user has ${userTodos.length} Todo(s). ` +
            `Deleting the user will also delete those Todos.`;

    }


    if (!confirm(message)) {

        return;

    }


    try {


        await api(
            `/users/${id}`,
            {
                method: "DELETE"
            }
        );


        showNotification(
            "User deleted successfully.",
            "success"
        );


        if (
            Number(editingUserId) ===
            Number(id)
        ) {

            resetUserForm();

        }


        await loadUsers();

        await loadTodos();


        populateUserSelect();

        renderUsers();

        renderTodos();

        renderRecentTodos();

        updateDashboard();

    }


    catch (error) {

        showNotification(
            error.message ||
            "Unable to delete user.",
            "error"
        );

    }

}


// ============================================================
// LOAD TODOS
// ============================================================

async function loadTodos() {

    const data =
        await api("/todos");


    if (Array.isArray(data)) {

        todos = data;

    }

    else if (Array.isArray(data.todos)) {

        todos = data.todos;

    }

    else {

        todos = [];

    }

}


// ============================================================
// POPULATE USER SELECT
// ============================================================

function populateUserSelect() {

    if (!todoUserSelect) return;


    const previousValue =
        todoUserSelect.value;


    todoUserSelect.innerHTML = `

        <option value="">
            Select a user
        </option>

    `;


    users.forEach(user => {

        const option =
            document.createElement("option");


        option.value =
            user.id;


        option.textContent =
            `${user.username} — ${user.email}`;


        todoUserSelect.appendChild(option);

    });


    if (
        previousValue &&
        users.some(
            user =>
                String(user.id) ===
                String(previousValue)
        )
    ) {

        todoUserSelect.value =
            previousValue;

    }

}


// ============================================================
// TODO FORM
// ============================================================

function setupTodoForm() {

    todoForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const userId =
                todoUserSelect.value;


            const description =
                descriptionInput.value.trim();


            if (!userId) {

                showNotification(
                    "Please select a user.",
                    "error"
                );

                return;

            }


            if (!description) {

                showNotification(
                    "Please enter a Todo description.",
                    "error"
                );

                return;

            }


            try {


                // EDIT TODO

                if (editingTodoId) {


                    const todo =
                        todos.find(
                            item =>
                                Number(item.id) ===
                                Number(editingTodoId)
                        );


                    await api(
                        `/todos/${editingTodoId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify({
                                    user_id:
                                        Number(userId),

                                    description,

                                    completed:
                                        todo &&
                                        Number(todo.completed) === 1
                                            ? 1
                                            : 0
                                })
                        }
                    );


                    showNotification(
                        "Todo updated successfully.",
                        "success"
                    );

                }


                // CREATE TODO

                else {


                    await api(
                        "/todos",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({

                                    user_id:
                                        Number(userId),

                                    description

                                })
                        }
                    );


                    showNotification(
                        "Todo created successfully.",
                        "success"
                    );

                }


                resetTodoForm();


                await loadUsers();

                await loadTodos();


                populateUserSelect();

                renderUsers();

                renderTodos();

                renderRecentTodos();

                updateDashboard();

            }


            catch (error) {

                showNotification(
                    error.message ||
                    "Unable to save Todo.",
                    "error"
                );

            }

        }
    );

}


// ============================================================
// RENDER TODOS
// ============================================================

function renderTodos() {

    if (!todoContainer) return;


    todoContainer.innerHTML = "";


    if (todos.length === 0) {

        todoContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Todos Yet
                </h3>

                <p>
                    Create a Todo using the form above.
                </p>

            </div>

        `;


        updateTodoCount();

        return;

    }


    todos.forEach(todo => {


        const user =
            users.find(
                item =>
                    Number(item.id) ===
                    Number(todo.user_id)
            );


        const username =
            user
                ? user.username
                : "Unknown user";


        const completed =
            Number(todo.completed) === 1 ||
            todo.completed === true;


        const todoElement =
            document.createElement("div");


        todoElement.className =
            `todo-item ${completed ? "completed" : ""}`;


        todoElement.innerHTML = `

            <div class="todo-content">


                <div class="todo-check">

                    <button
                        class="complete-btn"
                        onclick="toggleTodo(${todo.id})"
                        title="${
                            completed
                                ? "Mark as pending"
                                : "Mark as completed"
                        }"
                    >

                        ${
                            completed
                                ? "✓"
                                : "○"
                        }

                    </button>

                </div>


                <div class="todo-details">

                    <h3>
                        ${escapeHTML(
                            todo.description
                        )}
                    </h3>


                    <div class="todo-meta">

                        <span>
                            👤
                            ${escapeHTML(username)}
                        </span>


                        <span class="${
                            completed
                                ? "status-completed"
                                : "status-pending"
                        }">

                            ${
                                completed
                                    ? "Completed"
                                    : "Pending"
                            }

                        </span>

                    </div>

                </div>

            </div>


            <div class="action-buttons">


                <button
                    class="btn-edit"
                    onclick="editTodo(${todo.id})"
                >
                    Edit
                </button>


                <button
                    class="btn-delete"
                    onclick="deleteTodo(${todo.id})"
                >
                    Delete
                </button>


            </div>

        `;


        todoContainer.appendChild(
            todoElement
        );

    });


    updateTodoCount();

}


// ============================================================
// TODO COUNT
// ============================================================

function updateTodoCount() {

    if (!todoCount) return;


    todoCount.textContent =
        `${todos.length} Todo${
            todos.length === 1
                ? ""
                : "s"
        }`;

}


// ============================================================
// EDIT TODO
// ============================================================

function editTodo(id) {

    const todo =
        todos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!todo) {

        showNotification(
            "Todo not found.",
            "error"
        );

        return;

    }


    editingTodoId = id;


    todoUserSelect.value =
        todo.user_id;


    descriptionInput.value =
        todo.description || "";


    const submitButton =
        todoForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.textContent =
            "Update Todo";

    }


    const cancelButton =
        document.getElementById(
            "cancel-todo-edit"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "inline-flex";

    }


    const title =
        document.getElementById(
            "todo-form-title"
        );


    if (title) {

        title.textContent =
            "Edit Todo";

    }


    const description =
        document.getElementById(
            "todo-form-description"
        );


    if (description) {

        description.textContent =
            "Update the Todo and its assigned user.";

    }


    todoForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    descriptionInput.focus();

}


// ============================================================
// RESET TODO FORM
// ============================================================

function resetTodoForm() {

    editingTodoId = null;


    todoForm.reset();


    const submitButton =
        todoForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.textContent =
            "Add Todo";

    }


    const cancelButton =
        document.getElementById(
            "cancel-todo-edit"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }


    const title =
        document.getElementById(
            "todo-form-title"
        );


    if (title) {

        title.textContent =
            "Create Todo";

    }


    const formDescription =
        document.getElementById(
            "todo-form-description"
        );


    if (formDescription) {

        formDescription.textContent =
            "Create a Todo and assign it to a user.";

    }

}


// ============================================================
// COMPLETE / UNCOMPLETE TODO
// ============================================================

async function toggleTodo(id) {

    const todo =
        todos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!todo) return;


    const currentlyCompleted =
        Number(todo.completed) === 1 ||
        todo.completed === true;


    try {


        await api(
            `/todos/${id}`,
            {
                method: "PUT",

                body:
                    JSON.stringify({

                        user_id:
                            Number(todo.user_id),

                        description:
                            todo.description,

                        completed:
                            currentlyCompleted
                                ? 0
                                : 1

                    })
            }
        );


        await loadTodos();


        renderTodos();

        renderRecentTodos();

        updateDashboard();


        showNotification(
            currentlyCompleted
                ? "Todo marked as pending."
                : "Todo completed successfully.",
            "success"
        );

    }


    catch (error) {

        showNotification(
            error.message ||
            "Unable to update Todo.",
            "error"
        );

    }

}


// ============================================================
// DELETE TODO
// ============================================================

async function deleteTodo(id) {

    const todo =
        todos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!todo) return;


    const confirmed =
        confirm(
            `Are you sure you want to delete this Todo?\n\n"${todo.description}"`
        );


    if (!confirmed) return;


    try {


        await api(
            `/todos/${id}`,
            {
                method: "DELETE"
            }
        );


        showNotification(
            "Todo deleted successfully.",
            "success"
        );


        if (
            Number(editingTodoId) ===
            Number(id)
        ) {

            resetTodoForm();

        }


        await loadTodos();


        renderUsers();

        renderTodos();

        renderRecentTodos();

        updateDashboard();

    }


    catch (error) {

        showNotification(
            error.message ||
            "Unable to delete Todo.",
            "error"
        );

    }

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const total =
        todos.length;


    const completed =
        todos.filter(
            todo =>
                Number(todo.completed) === 1 ||
                todo.completed === true
        ).length;


    const pending =
        total - completed;


    if (totalUsers) {

        totalUsers.textContent =
            users.length;

    }


    if (totalTodos) {

        totalTodos.textContent =
            total;

    }


    if (completedTodos) {

        completedTodos.textContent =
            completed;

    }


    if (pendingTodos) {

        pendingTodos.textContent =
            pending;

    }

}


// ============================================================
// RECENT TODOS
// ============================================================

function renderRecentTodos() {

    if (!recentTodos) return;


    recentTodos.innerHTML = "";


    if (todos.length === 0) {

        recentTodos.innerHTML = `

            <div class="empty-state">
                No recent Todos.
            </div>

        `;

        return;

    }


    const recent =
        [...todos]
            .slice(0, 5);


    recent.forEach(todo => {


        const user =
            users.find(
                item =>
                    Number(item.id) ===
                    Number(todo.user_id)
            );


        const username =
            user
                ? user.username
                : "Unknown user";


        const completed =
            Number(todo.completed) === 1 ||
            todo.completed === true;


        const item =
            document.createElement("div");


        item.className =
            "recent-todo";


        item.innerHTML = `

            <div>

                <strong>
                    ${escapeHTML(
                        todo.description
                    )}
                </strong>


                <small>
                    Created by
                    ${escapeHTML(username)}
                </small>

            </div>


            <span class="${
                completed
                    ? "status-completed"
                    : "status-pending"
            }">

                ${
                    completed
                        ? "Completed"
                        : "Pending"
                }

            </span>

        `;


        recentTodos.appendChild(item);

    });

}


// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(
    message,
    type = "success"
) {

    if (
        !notification ||
        !notificationMessage
    ) {

        alert(message);

        return;

    }


    notificationMessage.textContent =
        message;


    notification.className =
        `notification ${type}`;


    notification.classList.add(
        "show"
    );


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 3500);

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML BUTTONS
// ============================================================

window.editUser =
    editUser;

window.deleteUser =
    deleteUser;

window.resetUserForm =
    resetUserForm;

window.editTodo =
    editTodo;

window.deleteTodo =
    deleteTodo;

window.toggleTodo =
    toggleTodo;

window.resetTodoForm =
    resetTodoForm;