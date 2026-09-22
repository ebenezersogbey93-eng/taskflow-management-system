const usersTable =
    document.getElementById("users-table");

const addUserForm =
    document.getElementById("add-user-form");

const userMessage =
    document.getElementById("user-message");


async function loadUsers() {

    try {

        const response =
            await fetch("/users");

        const users =
            await response.json();

        usersTable.innerHTML = "";

        if (users.length === 0) {

            usersTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }

        users.forEach(user => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${user.id}</td>

                <td>
                    <strong>${user.username}</strong>
                </td>

                <td>
                    ${user.email}
                </td>

                <td>
                    <span class="status">
                        Active
                    </span>
                </td>

                <td>

                    <button
                        class="delete-button"
                        onclick="deleteUser(${user.id})"
                    >
                        Delete
                    </button>

                </td>
            `;

            usersTable.appendChild(row);

        });

    } catch (error) {

        console.error(error);

        usersTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load users.
                </td>
            </tr>
        `;

    }

}


addUserForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const username =
            document
                .getElementById("new-username")
                .value
                .trim();

        const email =
            document
                .getElementById("new-email")
                .value
                .trim();

        const password =
            document
                .getElementById("new-password")
                .value;

        try {

            const response =
                await fetch(
                    "/users",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            username,
                            email,
                            password
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                userMessage.textContent =
                    data.error;

                userMessage.style.color =
                    "#dc2626";

                return;
            }

            userMessage.textContent =
                "User created successfully.";

            userMessage.style.color =
                "#16a34a";

            addUserForm.reset();

            loadUsers();

        } catch (error) {

            userMessage.textContent =
                "Unable to create user.";

            userMessage.style.color =
                "#dc2626";
        }

    }
);


async function deleteUser(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this user?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/users/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(data.error);

            return;
        }

        loadUsers();

    } catch (error) {

        alert(
            "Unable to delete user."
        );

    }

}


loadUsers();