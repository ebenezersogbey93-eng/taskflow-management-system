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

        await loadCharts();
        await loadRecentActivities();
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

async function loadCharts() {
    const chartData = await getData("/api/chart-data");
    const usersCanvas = document.getElementById("users-chart");
    const tasksCanvas = document.getElementById("tasks-chart");

    if (!usersCanvas || !tasksCanvas || typeof Chart === "undefined") {
        return;
    }

    const formatMonth = month => {
        const [year, monthNumber] = month.split("-");
        return new Date(Number(year), Number(monthNumber) - 1, 1)
            .toLocaleDateString(undefined, { month: "short", year: "numeric" });
    };

    new Chart(usersCanvas, {
        type: "bar",
        data: {
            labels: chartData.monthlyUsers.map(item => formatMonth(item.month)),
            datasets: [{
                label: "New users",
                data: chartData.monthlyUsers.map(item => item.count),
                backgroundColor: "rgba(37, 99, 235, 0.78)",
                borderRadius: 8,
                maxBarThickness: 38
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });

    new Chart(tasksCanvas, {
        type: "doughnut",
        data: {
            labels: ["Completed", "Pending"],
            datasets: [{
                data: [chartData.status.completed, chartData.status.pending],
                backgroundColor: ["#22c55e", "#f59e0b"],
                borderColor: "#ffffff",
                borderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: { position: "bottom", labels: { usePointStyle: true, padding: 18 } }
            }
        }
    });
}

async function loadRecentActivities() {
    const container = document.getElementById("recent-activities");
    if (!container) return;

    try {
        const activities = await getData("/api/activity");

        if (!activities.length) {
            container.innerHTML = '<div class="empty-state"><p>No recent activities yet.</p></div>';
            return;
        }

        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${escapeHTML(activity.icon)}</span>
                <div>
                    <strong>${escapeHTML(activity.message)}</strong>
                    ${activity.detail ? `<small>${escapeHTML(activity.detail)}</small>` : ""}
                </div>
            </div>
        `).join("");
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Unable to load recent activities.</p></div>';
    }
}