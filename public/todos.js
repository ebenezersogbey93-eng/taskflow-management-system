const todoForm =
    document.getElementById("todo-form");

const todoContainer =
    document.getElementById(
        "todo-container"
    );

const todoMessage =
    document.getElementById(
        "todo-message"
    );


async function loadTodos() {

    try {

        const response =
            await fetch("/todos");

        const todos =
            await response.json();

        todoContainer.innerHTML = "";

        if (todos.length === 0) {

            todoContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No TODOs yet</h3>
                    <p>
                        Add your first task above.
                    </p>
                </div>
            `;

            return;
        }

        todos.forEach(todo => {

            const card =
                document.createElement("div");

            card.className =
                "todo-card";

            const status =
                todo.completed
                    ? "Completed"
                    : "Pending";

            const statusClass =
                todo.completed
                    ? "completed"
                    : "pending";

            card.innerHTML = `

                <div class="todo-card-header">

                    <span
                        class="todo-status ${statusClass}"
                    >
                        ${status}
                    </span>

                </div>

                <p class="todo-description">
                    ${todo.description}
                </p>

                <div class="todo-actions">

                    <button
                        onclick="
                            toggleTodo(
                                ${todo.id},
                                '${todo.description.replace(/'/g, "\\'")}',
                                ${todo.completed}
                            )
                        "
                    >
                        ${
                            todo.completed
                                ? "Mark Pending"
                                : "Complete"
                        }
                    </button>

                    <button
                        class="delete-button"
                        onclick="
                            deleteTodo(${todo.id})
                        "
                    >
                        Delete
                    </button>

                </div>

            `;

            todoContainer.appendChild(card);

        });

    } catch (error) {

        console.error(error);

        todoContainer.innerHTML = `
            <p>
                Unable to load TODOs.
            </p>
        `;

    }

}


todoForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const description =
            document
                .getElementById(
                    "todo-description"
                )
                .value
                .trim();

        if (!description) {
            return;
        }

        try {

            const response =
                await fetch(
                    "/todos",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            description
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                todoMessage.textContent =
                    data.error;

                todoMessage.style.color =
                    "#dc2626";

                return;
            }

            todoMessage.textContent =
                "TODO added successfully.";

            todoMessage.style.color =
                "#16a34a";

            todoForm.reset();

            loadTodos();

        } catch (error) {

            todoMessage.textContent =
                "Unable to add TODO.";

            todoMessage.style.color =
                "#dc2626";

        }

    }
);


async function toggleTodo(
    id,
    description,
    completed
) {

    try {

        await fetch(
            `/todos/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    description,
                    completed:
                        !completed
                })
            }
        );

        loadTodos();

    } catch (error) {

        alert(
            "Unable to update TODO."
        );

    }

}


async function deleteTodo(id) {

    const confirmed =
        confirm(
            "Delete this TODO?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/todos/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {

            const data =
                await response.json();

            alert(data.error);

            return;
        }

        loadTodos();

    } catch (error) {

        alert(
            "Unable to delete TODO."
        );

    }

}


loadTodos();