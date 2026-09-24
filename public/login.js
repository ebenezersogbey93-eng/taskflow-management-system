const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("login-message");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Clear previous message
    message.textContent = "";
    message.style.color = "";

    // Check that both fields have been filled
    if (!username || !password) {
        message.textContent = "Please enter your username and password.";
        message.style.color = "#dc2626";
        return;
    }

    // Show loading message
    message.textContent = "Logging in...";
    message.style.color = "#2563eb";

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        // Login failed
        if (!response.ok) {
            message.textContent =
                data.error || "Incorrect username or password.";
            message.style.color = "#dc2626";
            return;
        }

        // Login successful
        message.textContent = "Login successful! Redirecting...";
        message.style.color = "#16a34a";

        window.location.href = "/dashboard";

    } catch (error) {
        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to the server. Please make sure the server is running.";
        message.style.color = "#dc2626";
    }
});