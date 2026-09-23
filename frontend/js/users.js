const userContainer = document.getElementById("user-container");
const userCount = document.getElementById("user-count");

const userForm = document.getElementById("user-form");
const userIdInput = document.getElementById("user-id");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const submitText = document.getElementById("submit-text");
const formTitle = document.getElementById("form-title");

const cancelEditButton = document.getElementById("cancel-edit");
const refreshButton = document.getElementById("refresh-users");

const userMessage = document.getElementById("user-message");

let users = [];


function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


function showMessage(message, type = "success") {

    userMessage.innerHTML = `
        <div class="message ${type}">
            ${escapeHTML(message)}
        </div>
    `;

    setTimeout(() => {
        userMessage.innerHTML = "";
    }, 3000);
}


async function loadUsers() {

    try {

        userContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading users...</p>
            </div>
        `;

        users = await getData(API.users);

        userCount.textContent = users.length;

        displayUsers();

    } catch (error) {

        userContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-triangle-exclamation"></i>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}


function displayUsers() {

    if (users.length === 0) {

        userContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No users yet</h3>
                <p>Create your first user above.</p>
            </div>
        `;

        return;
    }


    userContainer.innerHTML = `

        <div class="table-container">

            <table class="data-table">

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Todos</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody>

                    ${users.map(user => `

                        <tr>

                            <td>#${user.id}</td>

                            <td>
                                <strong>
                                    ${escapeHTML(user.username)}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(user.email)}
                            </td>

                            <td>
                                <span class="badge">
                                    ${user.todo_count}
                                </span>
                            </td>

                            <td>

                                <div class="table-actions">

                                    <button
                                        type="button"
                                        class="btn btn-small btn-edit"
                                        onclick="editUser(${user.id})"
                                    >
                                        <i class="fas fa-pen"></i>
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-small btn-danger"
                                        onclick="deleteUser(${user.id})"
                                    >
                                        <i class="fas fa-trash"></i>
                                        Delete
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


userForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const id = userIdInput.value;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;


    if (!username || !email) {

        showMessage(
            "Username and email are required.",
            "error"
        );

        return;
    }


    try {

        if (id) {

            const body = {
                username,
                email
            };

            if (password) {
                body.password = password;
            }

            await putData(`${API.users}/${id}`, body);

            showMessage("User updated successfully.");

        } else {

            if (!password) {

                showMessage(
                    "Password is required for a new user.",
                    "error"
                );

                return;
            }

            await postData(API.users, {
                username,
                email,
                password
            });

            showMessage("User created successfully.");
        }


        resetForm();

        await loadUsers();

    } catch (error) {

        showMessage(error.message, "error");
    }

});


window.editUser = function(id) {

    const user = users.find(
        user => user.id === id
    );

    if (!user) return;


    userIdInput.value = user.id;

    usernameInput.value = user.username;
    emailInput.value = user.email;

    passwordInput.value = "";

    formTitle.textContent = "Edit User";

    submitText.textContent = "Update User";

    cancelEditButton.style.display = "inline-flex";

    document
        .getElementById("password-note")
        .textContent = "(leave blank to keep current password)";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};


window.deleteUser = async function(id) {

    const user = users.find(
        user => user.id === id
    );

    if (!user) return;


    const confirmed = confirm(
        `Delete user "${user.username}"? Their todos will also be deleted.`
    );

    if (!confirmed) return;


    try {

        await deleteData(`${API.users}/${id}`);

        showMessage("User deleted successfully.");

        await loadUsers();

    } catch (error) {

        showMessage(error.message, "error");
    }
};


function resetForm() {

    userForm.reset();

    userIdInput.value = "";

    formTitle.textContent = "Add New User";

    submitText.textContent = "Create User";

    cancelEditButton.style.display = "none";

    document
        .getElementById("password-note")
        .textContent = "(required for new users)";
}


cancelEditButton.addEventListener(
    "click",
    resetForm
);


refreshButton.addEventListener(
    "click",
    loadUsers
);


loadUsers();