const settingsForm = document.getElementById("settings-form");
const profileNameInput = document.getElementById("profile-name");
const profileEmailInput = document.getElementById("profile-email");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const emailNotifications = document.getElementById("email-notifications");
const settingsMessage = document.getElementById("settings-message");

function showSettingsMessage(message, type = "success") {
    settingsMessage.textContent = message;
    settingsMessage.className = `settings-message ${type}`;
}

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem("taskflow-settings") || "{}");
    profileNameInput.value = savedSettings.name || "Ebenezer";
    profileEmailInput.value = savedSettings.email || "admin@taskflow.com";
    darkModeToggle.checked = Boolean(savedSettings.darkMode);
    emailNotifications.checked = savedSettings.emailNotifications !== false;
    document.body.classList.toggle("dark-mode", darkModeToggle.checked);
}

settingsForm.addEventListener("submit", event => {
    event.preventDefault();

    if (!settingsForm.checkValidity()) {
        settingsForm.reportValidity();
        return;
    }

    const savedSettings = {
        name: profileNameInput.value.trim(),
        email: profileEmailInput.value.trim(),
        darkMode: darkModeToggle.checked,
        emailNotifications: emailNotifications.checked
    };

    localStorage.setItem("taskflow-settings", JSON.stringify(savedSettings));
    showSettingsMessage("Profile settings saved successfully.");
});

darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", darkModeToggle.checked);
    const savedSettings = JSON.parse(localStorage.getItem("taskflow-settings") || "{}");
    savedSettings.darkMode = darkModeToggle.checked;
    localStorage.setItem("taskflow-settings", JSON.stringify(savedSettings));
});

emailNotifications.addEventListener("change", () => {
    const savedSettings = JSON.parse(localStorage.getItem("taskflow-settings") || "{}");
    savedSettings.emailNotifications = emailNotifications.checked;
    localStorage.setItem("taskflow-settings", JSON.stringify(savedSettings));
    showSettingsMessage(`Email notifications ${emailNotifications.checked ? "enabled" : "disabled"}.`);
});

loadSettings();