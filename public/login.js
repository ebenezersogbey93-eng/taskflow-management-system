const loginForm = document.getElementById("login-form");
const authSwitch = document.getElementById("auth-switch");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authSubmitLabel = document.getElementById("auth-submit-label");
const loginLogo = document.getElementById("login-logo");
const emailInput = document.getElementById("email");
let registerMode = false;

authSwitch.addEventListener("click", () => {
    registerMode = !registerMode;
    document.querySelectorAll(".register-only").forEach(field => {
        field.hidden = !registerMode;
    });
    authTitle.textContent = registerMode ? "Create your account" : "Welcome back";
    authSubtitle.textContent = registerMode ? "Create an account and enter your dashboard." : "Sign in to continue to your dashboard.";
    authSubmitLabel.textContent = registerMode ? "Create account" : "Login";
    authSwitch.textContent = registerMode ? "Already have an account? Login" : "New to TaskFlow? Create an account";
    loginLogo.innerHTML = `<i class="fa-solid ${registerMode ? "fa-user-plus" : "fa-lock"}" aria-hidden="true"></i>`;
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("login-message");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const email = emailInput.value.trim();

    // Clear previous message
    message.textContent = "";
    message.style.color = "";

    // Check that both fields have been filled
    if (!username || !password || (registerMode && !email)) {
        message.textContent = registerMode ? "Please complete all registration fields." : "Please enter your username and password.";
        message.style.color = "#dc2626";
        return;
    }

    if (registerMode && (username.length < 3 || password.length < 6)) {
        message.textContent = "Username needs 3+ characters and password needs 6+ characters.";
        message.style.color = "#dc2626";
        return;
    }

    // Show loading message
    message.textContent = registerMode ? "Creating your account..." : "Logging in...";
    message.style.color = "#2563eb";

    try {
        const response = await fetch(registerMode ? "/register" : "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password,
                ...(registerMode ? { email } : {})
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
        message.textContent = registerMode ? "Account created! Redirecting..." : "Login successful! Redirecting...";
        message.style.color = "#16a34a";

        window.location.href = "/dashboard";

    } catch (error) {
        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to the server. Please make sure the server is running.";
        message.style.color = "#dc2626";
    }
});