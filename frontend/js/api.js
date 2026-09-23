const API = {
    users: "/api/users",
    todos: "/api/todos",
    stats: "/api/stats"
};

async function request(url, options = {}) {
    const response = await fetch(url, options);

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

async function getData(url) {
    return request(url);
}

async function postData(url, body) {
    return request(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
}

async function putData(url, body) {
    return request(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
}

async function deleteData(url) {
    return request(url, {
        method: "DELETE"
    });
}