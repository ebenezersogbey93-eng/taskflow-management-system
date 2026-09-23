const todoContainer =
    document.getElementById("todo-container");

const todoForm =
    document.getElementById("todo-form");

const todoIdInput =
    document.getElementById("todo-id");

const descriptionInput =
    document.getElementById("description");

const userSelect =
    document.getElementById("todo-user");

const completedSelect =
    document.getElementById("completed");

const todoMessage =
    document.getElementById("todo-message");

const formTitle =
    document.getElementById("todo-form-title");

const submitText =
    document.getElementById("todo-submit-text");

const cancelButton =
    document.getElementById("cancel-todo-edit");

const refreshButton =
    document.getElementById("refresh-todos");


let todos = [];
let users = [];


function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


function showMessage(message, type = "success") {

    todoMessage.innerHTML = `
        <div class="message ${type}">
            ${escapeHTML(message)}
        </div>
    `;

    setTimeout(() => {

        todoMessage.innerHTML = "";

    }, 3000);
}


async function loadUsers() {

    try {

        users = await getData(API.users);

        userSelect.innerHTML = `
            <option value="">
                Select a user
            </option>
        `;


        users.forEach(user => {

            const option =
                document.createElement("option");

            option.value = user.id;

            option.textContent =
                `${user.username} (${user.email})`;

            userSelect.appendChild(option);

        });

    } catch (error) {

        showMessage(
            `Unable to load users: ${error.message}`,
            "error"
        );
    }
}


async function loadTodos() {

    try {

        todoContainer.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-spinner fa-spin"></i>

                <p>
                    Loading todos...
                </p>

            </div>
        `;


        todos = await getData(API.todos);

        displayTodos();

    } catch (error) {

        todoContainer.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-triangle-exclamation"></i>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;
    }
}


function displayTodos() {

    if (todos.length === 0) {

        todoContainer.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-check"></i>

                <h3>
                    No todos yet
                </h3>

                <p>
                    Create your first task above.
                </p>

            </div>
        `;

        return;
    }


    todoContainer.innerHTML = `

        <div class="table-container">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Task</th>

                        <th>User</th>

                        <th>Status</th>

                        <th>Actions</th>

                    </tr>

                </thead>


                <tbody>

                    ${todos.map(todo => `

                        <tr>

                            <td>
                                #${todo.id}
                            </td>


                            <td>

                                <strong>
                                    ${escapeHTML(todo.description)}
                                </strong>

                            </td>


                            <td>

                                <div>

                                    <strong>
                                        ${escapeHTML(todo.username)}
                                    </strong>

                                    <small>
                                        ${escapeHTML(todo.email)}
                                    </small>

                                </div>

                            </td>


                            <td>

                                ${
                                    todo.completed
                                    ? `
                                        <span class="status-badge completed">
                                            <i class="fas fa-check"></i>
                                            Completed
                                        </span>
                                    `
                                    : `
                                        <span class="status-badge pending">
                                            <i class="far fa-circle"></i>
                                            Pending
                                        </span>
                                    `
                                }

                            </td>


                            <td>

                                <div class="table-actions">

                                    <button
                                        type="button"
                                        class="btn btn-small btn-edit"
                                        onclick="editTodo(${todo.id})"
                                    >

                                        <i class="fas fa-pen"></i>

                                        Edit

                                    </button>


                                    <button
                                        type="button"
                                        class="btn btn-small btn-danger"
                                        onclick="deleteTodo(${todo.id})"
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


todoForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const id =
            todoIdInput.value;

        const description =
            descriptionInput.value.trim();

        const user_id =
            userSelect.value;

        const completed =
            Number(completedSelect.value);


        if (!description || !user_id) {

            showMessage(
                "Task description and user are required.",
                "error"
            );

            return;
        }


        try {

            if (id) {

                await putData(
                    `${API.todos}/${id}`,
                    {
                        description,
                        user_id: Number(user_id),
                        completed
                    }
                );

                showMessage(
                    "Todo updated successfully."
                );

            } else {

                await postData(
                    API.todos,
                    {
                        description,
                        user_id: Number(user_id)
                    }
                );

                showMessage(
                    "Todo created successfully."
                );
            }


            resetTodoForm();

            await loadTodos();

        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }

    }
);


window.editTodo = function(id) {

    const todo =
        todos.find(
            item => item.id === id
        );

    if (!todo) return;


    todoIdInput.value =
        todo.id;

    descriptionInput.value =
        todo.description;

    userSelect.value =
        todo.user_id;

    completedSelect.value =
        todo.completed ? "1" : "0";


    formTitle.textContent =
        "Edit Todo";

    submitText.textContent =
        "Update Todo";

    cancelButton.style.display =
        "inline-flex";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};


window.deleteTodo = async function(id) {

    const todo =
        todos.find(
            item => item.id === id
        );

    if (!todo) return;


    const confirmed =
        confirm(
            `Delete "${todo.description}"?`
        );


    if (!confirmed) return;


    try {

        await deleteData(
            `${API.todos}/${id}`
        );

        showMessage(
            "Todo deleted successfully."
        );

        await loadTodos();

    } catch (error) {

        showMessage(
            error.message,
            "error"
        );
    }
};


function resetTodoForm() {

    todoForm.reset();

    todoIdInput.value = "";

    completedSelect.value = "0";

    formTitle.textContent =
        "Add New Todo";

    submitText.textContent =
        "Create Todo";

    cancelButton.style.display =
        "none";
}


cancelButton.addEventListener(
    "click",
    resetTodoForm
);


refreshButton.addEventListener(
    "click",
    async () => {

        await loadUsers();
        await loadTodos();

    }
);


async function initializeTodos() {

    await loadUsers();

    await loadTodos();

}


initializeTodos();