// ============================================================
// SETTINGS PAGE
// ============================================================

function setupSettingsPage() {

    const settingsForm =
        document.getElementById("settings-form");


    if (!settingsForm) return;


    settingsForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "settings-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "settings-email"
                ).value.trim();


            if (!name || !email) {

                showNotification(
                    "Please complete all fields.",
                    "error"
                );

                return;

            }


            localStorage.setItem(
                "taskflowAdminName",
                name
            );


            localStorage.setItem(
                "taskflowAdminEmail",
                email
            );


            showNotification(
                "Settings saved successfully.",
                "success"
            );

        }
    );


    // Compact mode

    const compactMode =
        document.getElementById(
            "compact-mode"
        );


    if (compactMode) {

        const savedCompact =
            localStorage.getItem(
                "taskflowCompactMode"
            );


        compactMode.checked =
            savedCompact === "true";


        compactMode.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "taskflowCompactMode",
                    compactMode.checked
                );

            }
        );

    }


    // Notifications

    const notifications =
        document.getElementById(
            "notifications"
        );


    if (notifications) {

        const savedNotifications =
            localStorage.getItem(
                "taskflowNotifications"
            );


        if (savedNotifications !== null) {

            notifications.checked =
                savedNotifications === "true";

        }


        notifications.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "taskflowNotifications",
                    notifications.checked
                );

            }
        );

    }

}


// ============================================================
// START SETTINGS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupSettingsPage();

    }
);