const todoForm = document.getElementById("todo-form");
const todoIdInput = document.getElementById("todo-id");
const todoUserSelect = document.getElementById("todo-user");
const todoDescriptionInput = document.getElementById("todo-description");
const todoStatusSelect = document.getElementById("todo-status");
const todoTableContainer = document.getElementById("todo-container");
const todoMessage = document.getElementById("todo-message");
const submitButton = document.getElementById("todo-submit-btn");
const cancelButton = document.getElementById("cancel-todo-edit");
const todoSearch = document.getElementById("todo-search");
const todoStatusFilter = document.getElementById("todo-status-filter");
const todoPriorityFilter = document.getElementById("todo-priority-filter");
const todoPrioritySelect = document.getElementById("todo-priority");
const todoDueDateInput = document.getElementById("todo-due-date");

let todos = [];
let users = [];
let currentTodoPage = 1;
const todoPageSize = 10;

function setMessage(message, type = "success") {
    todoMessage.innerHTML = `<div class="message ${type}">${escapeHTML(message)}</div>`;
    setTimeout(() => {
        todoMessage.innerHTML = "";
    }, 3000);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.textContent = message || "";
    field.style.color = message ? "#dc2626" : "#64748b";
}

function validateTodoForm() {
    let isValid = true;
    const userId = Number(todoUserSelect.value);
    const description = todoDescriptionInput.value.trim();

    setFieldError("todo-user-error", "");
    setFieldError("todo-description-error", "");

    if (!userId) {
        setFieldError("todo-user-error", "Please select a user.");
        isValid = false;
    }

    if (!description) {
        setFieldError("todo-description-error", "Task description is required.");
        isValid = false;
    } else if (description.length < 3) {
        setFieldError("todo-description-error", "Task should be at least 3 characters.");
        isValid = false;
    }

    return isValid;
}

function getFilteredTodos() {
    const term = (todoSearch.value || "").trim().toLowerCase();
    const statusFilter = todoStatusFilter.value;
    const priorityFilter = todoPriorityFilter.value;

    return todos.filter(todo => {
        const matchesText = !term || (todo.description || "").toLowerCase().includes(term) || (todo.username || "").toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" || (statusFilter === "completed" ? !!todo.completed : !todo.completed);
        const matchesPriority = priorityFilter === "all" || (todo.priority || "medium") === priorityFilter;
        return matchesText && matchesStatus && matchesPriority;
    });
}

function formatDueDate(value) {
    if (!value) return "No due date";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

async function loadUsers() {
    try {
        users = await getData(API.users);
        todoUserSelect.innerHTML = '<option value="">Select user</option>' + users.map(user => `
            <option value="${user.id}">${escapeHTML(user.username)} (${escapeHTML(user.email)})</option>
        `).join("");
    } catch (error) {
        setMessage(`Unable to load users: ${error.message}`, "error");
    }
}

function renderTodos(rows) {
    if (!rows.length) {
        todoTableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i></div>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started.</p>
            </div>
        `;
        return;
    }

    todoTableContainer.innerHTML = `
        <div class="todo-card-grid">
            ${rows.map(todo => `
                <article class="todo-card">
                    <div class="todo-card-header">
                        <span class="todo-card-icon">📋</span>
                        <a href="/todos-page?id=${todo.id}" class="link-button todo-card-title">${escapeHTML(todo.description)}</a>
                        <span class="status-badge ${todo.completed ? "completed" : "pending"}">${todo.completed ? "Completed" : "Pending"}</span>
                    </div>
                    <div class="todo-card-details">
                        <span>Assigned to: <strong>${escapeHTML(todo.username)}</strong></span>
                        <span class="priority-badge ${(todo.priority || "medium")}">${(todo.priority || "medium").charAt(0).toUpperCase() + (todo.priority || "medium").slice(1)} priority</span>
                        <span>Due: <strong>${formatDueDate(todo.due_date)}</strong></span>
                    </div>
                    <div class="action-buttons">
                        <button type="button" class="btn-edit" data-id="${todo.id}" data-action="edit">✏ Edit</button>
                        <button type="button" class="btn-delete" data-id="${todo.id}" data-action="delete">🗑 Delete</button>
                    </div>
                </article>
            `).join("")}
        </div>
    `;

    todoTableContainer.querySelectorAll("button[data-action='edit']").forEach(button => {
        button.addEventListener("click", () => editTodo(Number(button.dataset.id)));
    });

    todoTableContainer.querySelectorAll("button[data-action='delete']").forEach(button => {
        button.addEventListener("click", () => deleteTodo(Number(button.dataset.id)));
    });

    const filteredCount = getFilteredTodos().length;
    const offset = (currentTodoPage - 1) * todoPageSize;
    const end = Math.min(offset + rows.length, filteredCount);
    const pagination = document.getElementById("todo-pagination");
    pagination.innerHTML = `
        <span>Showing ${filteredCount ? offset + 1 : 0}-${end} of ${filteredCount} tasks</span>
        <div class="pagination-controls">
            <button type="button" ${currentTodoPage === 1 ? "disabled" : ""} data-page="previous">Previous</button>
            <span>Page ${currentTodoPage} of ${Math.max(1, Math.ceil(filteredCount / todoPageSize))}</span>
            <button type="button" ${end >= filteredCount ? "disabled" : ""} data-page="next">Next</button>
        </div>
    `;

    pagination.querySelectorAll("button[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            currentTodoPage += button.dataset.page === "next" ? 1 : -1;
            renderTodoPage();
        });
    });
}

function renderTodoPage() {
    const filteredTodos = getFilteredTodos();
    const totalPages = Math.max(1, Math.ceil(filteredTodos.length / todoPageSize));
    currentTodoPage = Math.min(currentTodoPage, totalPages);
    renderTodos(filteredTodos.slice((currentTodoPage - 1) * todoPageSize, currentTodoPage * todoPageSize));
}

async function loadTodos() {
    todoTableContainer.innerHTML = `
        <div class="skeleton-list" aria-label="Loading tasks">
            <span class="skeleton-line"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-line"></span>
        </div>
    `;

    try {
        todos = await getData(API.todos);
        renderTodoPage();
    } catch (error) {
        todoTableContainer.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load TODOs</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}

function resetForm() {
    todoForm.reset();
    todoIdInput.value = "";
    todoStatusSelect.value = "0";
    todoPrioritySelect.value = "medium";
    todoDueDateInput.value = "";
    setFieldError("todo-user-error", "");
    setFieldError("todo-description-error", "");
    submitButton.textContent = "Add TODO";
    cancelButton.style.display = "none";
}

function editTodo(id) {
    const todo = todos.find(item => item.id === id);
    if (!todo) return;

    todoIdInput.value = todo.id;
    todoDescriptionInput.value = todo.description;
    todoUserSelect.value = String(todo.user_id);
    todoStatusSelect.value = todo.completed ? "1" : "0";
    todoPrioritySelect.value = todo.priority || "medium";
    todoDueDateInput.value = todo.due_date || "";
    submitButton.textContent = "Update TODO";
    cancelButton.style.display = "inline-flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteTodo(id) {
    const todo = todos.find(item => item.id === id);
    if (!todo) return;

    const confirmed = confirm(`Delete task "${todo.description}"?`);
    if (!confirmed) return;

    try {
        await deleteData(`${API.todos}/${id}`);
        setMessage("Todo deleted successfully.");
        resetForm();
        await loadTodos();
    } catch (error) {
        setMessage(error.message, "error");
    }
}

todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateTodoForm()) {
        setMessage("Please fix the validation errors before saving.", "error");
        return;
    }

    const id = todoIdInput.value;
    const userId = Number(todoUserSelect.value);
    const description = todoDescriptionInput.value.trim();
    const completed = Number(todoStatusSelect.value);
    const priority = todoPrioritySelect.value;
    const due_date = todoDueDateInput.value || null;

    try {
        if (id) {
            await putData(`${API.todos}/${id}`, { user_id: userId, description, completed, priority, due_date });
            setMessage("Todo updated successfully.");
        } else {
            await postData(API.todos, { user_id: userId, description, priority, due_date });
            setMessage("Todo created successfully.");
        }

        resetForm();
        await loadTodos();
    } catch (error) {
        setMessage(error.message, "error");
    }
});

todoUserSelect.addEventListener("change", validateTodoForm);
todoDescriptionInput.addEventListener("input", validateTodoForm);
todoSearch.addEventListener("input", () => { currentTodoPage = 1; renderTodoPage(); });
todoStatusFilter.addEventListener("change", () => { currentTodoPage = 1; renderTodoPage(); });
todoPriorityFilter.addEventListener("change", () => { currentTodoPage = 1; renderTodoPage(); });
cancelButton.addEventListener("click", resetForm);

async function initializeTodos() {
    await loadUsers();
    await loadTodos();
}

initializeTodos();