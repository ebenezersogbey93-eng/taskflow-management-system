const profileToggle = document.getElementById("profile-toggle");
const profileMenu = document.getElementById("profile-menu");
const notificationToggle = document.getElementById("notification-toggle");
const notificationMenu = document.getElementById("notification-menu");
const notificationCount = document.getElementById("notification-count");

function escapeHeaderHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderNotifications(activities) {
    if (!notificationMenu || !notificationCount) return;

    notificationCount.textContent = Math.min(activities.length, 9);
    notificationCount.hidden = activities.length === 0;
    notificationMenu.innerHTML = activities.length
        ? `<strong>Notifications</strong>${activities.slice(0, 3).map(activity => `
            <div class="notification-item">
                <span>🔔</span>
                <span>${escapeHeaderHTML(activity.message)}</span>
            </div>
        `).join("")}`
        : "<strong>No new notifications</strong>";
}

function loadHeaderActivity() {
    if (typeof getData !== "function") return;

    getData("/api/activity")
        .then(renderNotifications)
        .catch(() => renderNotifications([]));
}

profileToggle?.addEventListener("click", event => {
    event.stopPropagation();
    profileMenu.hidden = !profileMenu.hidden;
    if (notificationMenu) notificationMenu.hidden = true;
});

notificationToggle?.addEventListener("click", event => {
    event.stopPropagation();
    notificationMenu.hidden = !notificationMenu.hidden;
    if (profileMenu) profileMenu.hidden = true;
});

document.addEventListener("click", () => {
    if (profileMenu) profileMenu.hidden = true;
    if (notificationMenu) notificationMenu.hidden = true;
});

loadHeaderActivity();
