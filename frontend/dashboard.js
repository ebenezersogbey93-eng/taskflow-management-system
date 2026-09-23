document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});


// ================================
// LOAD DASHBOARD
// ================================

async function loadDashboard() {
    try {
        const stats = await getData(API.stats);

        const totalUsers = document.getElementById("total-users");
        const totalTodos = document.getElementById("total-todos");
        const completedTodos = document.getElementById("completed-todos");
        const pendingTodos = document.getElementById("pending-todos");

        if (totalUsers) {
            totalUsers.textContent = stats.totalUsers;
        }

        if (totalTodos) {
            totalTodos.textContent = stats.totalTodos;
        }

        if (completedTodos) {
            completedTodos.textContent = stats.completedTodos;
        }

        if (pendingTodos) {
            pendingTodos.textContent = stats.pendingTodos;
        }

        await loadRecentTodos();

    } catch (error) {
        console.error("Dashboard error:", error.message);
    }
}


// ================================
// RECENT TODOS
// ================================

async function loadRecentTodos() {
    const container = document.getElementById("recent-todos");

    if (!container) {
        return;
    }

    try {
        const todos = await getData(API.todos);

        if (todos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✓</div>
                    <h4>No TODOs yet</h4>
                    <p>Create your first task to get started.</p>
                </div>
            `;

            return;
        }

        const recentTodos = todos.slice(0, 5);

        container.innerHTML = recentTodos.map(todo => `
            <div class="recent-todo">
                <div>
                    <strong>${escapeHTML(todo.description)}</strong>
                    <small>
                        Assigned to ${escapeHTML(todo.username)}
                    </small>
                </div>

                <span class="todo-status ${todo.completed ? "completed" : "pending"}">
                    ${todo.completed ? "Completed" : "Pending"}
                </span>
            </div>
        `).join("");

    } catch (error) {
        console.error("Recent todos error:", error.message);

        container.innerHTML = `
            <div class="empty-state">
                <p>Unable to load recent TODOs.</p>
            </div>
        `;
    }
}


// ================================
// HTML SECURITY HELPER
// ================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}