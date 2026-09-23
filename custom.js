async function fetchTodos() {

    const todoContainer = document.getElementById("todo-container");
    const loading = document.getElementById("loading");

    try {

        const response = await fetch("/api/todos");

        if (!response.ok) {
            throw new Error("Failed to fetch TODOs");
        }

        const todos = await response.json();

        loading.style.display = "none";

        if (todos.length === 0) {
            todoContainer.innerHTML = `
                <p>No TODOs found.</p>
            `;
            return;
        }

        todos.forEach(todo => {

            const todoCard = document.createElement("div");

            todoCard.classList.add("todo-card");

            todoCard.innerHTML = `
                <h3>TODO #${todo.id}</h3>

                <p>
                    <strong>Description:</strong>
                    ${todo.description}
                </p>

                <div class="user-info">

                    <p>
                        <strong>Created By:</strong>
                        ${todo.username}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${todo.email}
                    </p>

                </div>
            `;

            todoContainer.appendChild(todoCard);
        });

    } catch (error) {

        loading.style.display = "none";

        todoContainer.innerHTML = `
            <p>Error loading TODOs: ${error.message}</p>
        `;
    }
}

fetchTodos();