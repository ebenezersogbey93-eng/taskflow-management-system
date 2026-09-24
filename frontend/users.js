const form = document.getElementById("add-user-form");
const userIdInput = document.getElementById("user-id");
const usernameInput = document.getElementById("new-username");
const emailInput = document.getElementById("new-email");
const passwordInput = document.getElementById("new-password");
const userTable = document.getElementById("users-table");
const userMessage = document.getElementById("user-message");
const submitButton = document.getElementById("user-submit-btn");
const cancelButton = document.getElementById("cancel-user-edit");
const userSearch = document.getElementById("user-search");
const userFormTitle = document.getElementById("user-form-title");

let users = [];
let currentUserPage = 1;
const userPageSize = 10;

function setMessage(message, type = "success") {
    userMessage.innerHTML = `<div class="message ${type}">${escapeHTML(message)}</div>`;
    setTimeout(() => {
        userMessage.innerHTML = "";
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

function validateUserForm() {
    let isValid = true;
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    setFieldError("new-username-error", "");
    setFieldError("new-email-error", "");
    setFieldError("new-password-error", "");

    if (!username) {
        setFieldError("new-username-error", "Username is required.");
        isValid = false;
    } else if (username.length < 3) {
        setFieldError("new-username-error", "Username must be at least 3 characters.");
        isValid = false;
    }

    if (!email) {
        setFieldError("new-email-error", "Email is required.");
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("new-email-error", "Please enter a valid email.");
        isValid = false;
    }

    if (!userIdInput.value && !password) {
        setFieldError("new-password-error", "Password is required for a new user.");
        isValid = false;
    } else if (password && password.length < 6) {
        setFieldError("new-password-error", "Password must be at least 6 characters.");
        isValid = false;
    }

    return isValid;
}

function getFilteredUsers() {
    const term = (userSearch.value || "").trim().toLowerCase();
    if (!term) return users;

    return users.filter(user => {
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        return username.includes(term) || email.includes(term);
    });
}

function renderUsers(rows, totalRows = rows.length, offset = 0) {
    if (!rows.length) {
        userTable.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-users" aria-hidden="true"></i></div>
                        <h3>No users yet</h3>
                        <p>Create your first user to get started.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    userTable.innerHTML = rows.map(user => `
        <tr>
            <td>
                <div class="user-table-profile">
                    <span class="user-table-avatar">👤</span>
                    <div>
                        <a href="/users-page?id=${user.id}" class="link-button user-table-name">${escapeHTML(user.username)}</a>
                        <a href="mailto:${escapeHTML(user.email)}" class="user-table-email">📧 ${escapeHTML(user.email)}</a>
                    </div>
                </div>
            </td>
            <td>
                <span class="task-count"><span aria-hidden="true">✅</span> ${Number(user.todo_count || 0)} Tasks</span>
            </td>
            <td><span class="status-badge active">🟢 Active</span></td>
            <td>
                <div class="action-buttons user-actions">
                    <button type="button" class="btn-edit" data-id="${user.id}" data-action="edit" aria-label="Edit ${escapeHTML(user.username)}">✏ Edit</button>
                    <button type="button" class="btn-delete" data-id="${user.id}" data-action="delete" aria-label="Delete ${escapeHTML(user.username)}">🗑 Delete</button>
                </div>
            </td>
        </tr>
    `).join("");

    userTable.querySelectorAll("button[data-action='edit']").forEach(button => {
        button.addEventListener("click", () => editUser(Number(button.dataset.id)));
    });

    userTable.querySelectorAll("button[data-action='delete']").forEach(button => {
        button.addEventListener("click", () => deleteUser(Number(button.dataset.id)));
    });

    const pagination = document.getElementById("user-pagination");
    const end = Math.min(offset + rows.length, totalRows);
    pagination.innerHTML = `
        <span>Showing ${totalRows ? offset + 1 : 0}-${end} of ${totalRows} users</span>
        <div class="pagination-controls">
            <button type="button" ${currentUserPage === 1 ? "disabled" : ""} data-page="previous">Previous</button>
            <span>Page ${currentUserPage} of ${Math.max(1, Math.ceil(totalRows / userPageSize))}</span>
            <button type="button" ${end >= totalRows ? "disabled" : ""} data-page="next">Next</button>
        </div>
    `;

    pagination.querySelectorAll("button[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            currentUserPage += button.dataset.page === "next" ? 1 : -1;
            renderUserPage();
        });
    });
}

function renderUserPage() {
    const filteredUsers = getFilteredUsers();
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
    currentUserPage = Math.min(currentUserPage, totalPages);
    const offset = (currentUserPage - 1) * userPageSize;
    renderUsers(filteredUsers.slice(offset, offset + userPageSize), filteredUsers.length, offset);
}

async function loadUsers() {
    userTable.innerHTML = `
        <tr><td colspan="4">
            <div class="skeleton-list" aria-label="Loading users">
                <span class="skeleton-line"></span>
                <span class="skeleton-line"></span>
                <span class="skeleton-line"></span>
            </div>
        </td></tr>
    `;

    try {
        const response = await getData(API.users);
        users = response;
        renderUserPage();
    } catch (error) {
        userTable.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <h3>Unable to load users</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function resetForm() {
    form.reset();
    userIdInput.value = "";
    setFieldError("new-username-error", "");
    setFieldError("new-email-error", "");
    setFieldError("new-password-error", "");
    userFormTitle.textContent = "Add New User";
    submitButton.textContent = "Add User";
    cancelButton.style.display = "none";
}

function editUser(id) {
    const user = users.find(item => item.id === id);
    if (!user) return;

    userIdInput.value = user.id;
    usernameInput.value = user.username;
    emailInput.value = user.email;
    passwordInput.value = "";
    userFormTitle.textContent = `Edit ${user.username}`;
    submitButton.textContent = "Update User";
    cancelButton.style.display = "inline-flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteUser(id) {
    const user = users.find(item => item.id === id);
    if (!user) return;

    const confirmed = confirm(`Delete user "${user.username}" and all their TODOS?`);
    if (!confirmed) return;

    try {
        await deleteData(`${API.users}/${id}`);
        setMessage("User deleted successfully.");
        resetForm();
        await loadUsers();
    } catch (error) {
        setMessage(error.message, "error");
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateUserForm()) {
        setMessage("Please fix the highlighted validation errors.", "error");
        return;
    }

    const id = userIdInput.value;
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        if (id) {
            const payload = { username, email };
            if (password.trim()) payload.password = password;
            await putData(`${API.users}/${id}`, payload);
            setMessage("User updated successfully.");
        } else {
            await postData(API.users, { username, email, password });
            setMessage("User created successfully.");
        }

        resetForm();
        await loadUsers();
    } catch (error) {
        setMessage(error.message, "error");
    }
});

usernameInput.addEventListener("input", validateUserForm);
emailInput.addEventListener("input", validateUserForm);
passwordInput.addEventListener("input", validateUserForm);
userSearch.addEventListener("input", () => {
    currentUserPage = 1;
    renderUserPage();
});
cancelButton.addEventListener("click", resetForm);

loadUsers();