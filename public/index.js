let token = localStorage.getItem("token");
const API_BASE_URL = "";

const navAuthBtn = document.getElementById("nav-auth-btn");
const navFeedBtn = document.getElementById("nav-feed-btn");
const navProfileBtn = document.getElementById("nav-profile-btn");
const allNavButtons = [navAuthBtn, navFeedBtn, navProfileBtn];

const allPageSections = document.querySelectorAll(".page-section");

const showSection = (sectionId) => {
	allPageSections.forEach((section) => {
		section.classList.remove("active");
	});
	const activeSection = document.getElementById(sectionId);
	if (activeSection) {
		activeSection.classList.add("active");
	}

	allNavButtons.forEach((btn) => btn.classList.remove("active"));
	const activeButton = document.querySelector(
		`button[data-section="${sectionId}"]`
	);
	if (activeButton) {
		activeButton.classList.add("active");
	}

	if (token) {
		navAuthBtn.disabled = true;
		navFeedBtn.disabled = false;
		navProfileBtn.disabled = false;
	} else {
		navAuthBtn.disabled = false;
		navFeedBtn.disabled = true;
		navProfileBtn.disabled = true;
	}
};

const loadProfileData = async () => {
	if (!token) return;
	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				console.warn("Token might be invalid. Logging out.");
				logout();
				return;
			}
			throw new Error(`Failed to load profile: ${response.statusText}`);
		}
		const data = await response.json();
		document.getElementById("profile-username").value = data.username || "";
		document.getElementById("profile-email").value = data.email || "";
		document.getElementById("profile-bio").value = data.profile_bio || "";
	} catch (error) {
		console.error("Error loading profile:", error);
	}
};

const register = async (e) => {
	e.preventDefault();
	const username = document.getElementById("register-username").value;
	const email = document.getElementById("register-email").value;
	const password = document.getElementById("register-password").value;

	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
	if (email || !emailRegex.test(email)) {
		alert("Por favor, insira um e-mail válido");
		return;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, email, password }),
		});
		const data = await response.json();
		if (data.token) {
			token = data.token;
			localStorage.setItem("token", token);
			showSection("feed-page");
			loadPosts();
			loadProfileData();
		} else {
			alert(data.message || "Registration failed");
		}
	} catch (error) {
		console.error("Registration error:", error);
		alert("An error occurred during registration.");
	}
};

const login = async (e) => {
	e.preventDefault();
	const email = document.getElementById("login-email").value;
	const password = document.getElementById("login-password").value;

	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const data = await response.json();
		if (data.token) {
			token = data.token;
			localStorage.setItem("token", token);
			showSection("feed-page");
			loadPosts();
			loadProfileData();
		} else {
			alert(data.message || "Login failed");
		}
	} catch (error) {
		console.error("Login error:", error);
		alert("An error occurred during login.");
	}
};

const createPost = async (e) => {
	e.preventDefault();
	const content = document.getElementById("post-content").value;
	if (!content.trim()) {
		alert("Post content cannot be empty.");
		return;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api/posts`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`,
			},
			body: JSON.stringify({ content }),
		});
		if (!response.ok)
			throw new Error(`Failed to create post: ${response.statusText}`);
		const data = await response.json();
		if (data) {
			document.getElementById("post-content").value = "";
			loadPosts();
		}
	} catch (error) {
		console.error("Create post error:", error);
		alert("Failed to create post.");
	}
};

const loadPosts = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/api/posts`);
		if (!response.ok)
			throw new Error(`Failed to load posts: ${response.statusText}`);
		const posts = await response.json();
		const container = document.getElementById("posts-container");
		container.innerHTML = "";

		if (posts.length === 0) {
			container.innerHTML = "<p>Nenhum post ainda. Seja o primeiro!</p>";
			return;
		}

		posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		posts.forEach((post) => {
			const postElement = document.createElement("div");
			postElement.className = "post";
			postElement.innerHTML = `
                <strong>${post.username || "Usuário Anônimo"}</strong>
                <p>${escapeHTML(post.content)}</p>
                <small>${new Date(post.created_at).toLocaleString(
					"pt-BR"
				)}</small>
            `;
			container.appendChild(postElement);
		});
	} catch (error) {
		console.error("Load posts error:", error);
		document.getElementById("posts-container").innerHTML =
			"<p>Erro ao carregar posts.</p>";
	}
};

function escapeHTML(str) {
	const div = document.createElement("div");
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
}

const updateProfile = async (e) => {
	e.preventDefault();
	const username = document.getElementById("profile-username").value;
	const email = document.getElementById("profile-email").value;
	const profile_bio = document.getElementById("profile-bio").value;

	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
	if (!emailRegex.test(email)) {
		alert("Por favor, insira um e-mail válido");
		return;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`,
			},
			body: JSON.stringify({
				username,
				email,
				profile_bio,
			}),
		});

		if (!response.ok) {
			const errorData = await response
				.json()
				.catch(() => ({ message: response.statusText }));
			throw new Error(
				errorData.message ||
					`Failed to update profile: ${response.statusText}`
			);
		}

		const data = await response.json();
		if (data) {
			alert("Perfil atualizado com sucesso!");
			loadProfileData();
			if (data.token) {
				token = data.token;
				localStorage.setItem("token", token);
			}
		}
	} catch (error) {
		console.error("Update profile error:", error);
		alert(`Erro ao atualizar perfil: ${error.message}`);
	}
};

const logout = () => {
	localStorage.removeItem("token");
	token = null;
	showSection("auth-page");
	document.getElementById("login-form").reset();
	document.getElementById("register-form").reset();
	document.getElementById("profile-form").reset();
};

const deleteAccount = async () => {
	if (
		confirm(
			"Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita."
		)
	) {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/auth/delete-account`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.ok) {
				alert("Conta deletada com sucesso!");
				logout();
			} else {
				const errorData = await response
					.json()
					.catch(() => ({ message: response.statusText }));
				throw new Error(
					errorData.message || "Failed to delete account."
				);
			}
		} catch (error) {
			console.error("Delete account error:", error);
			alert(`Erro ao deletar conta: ${error.message}`);
		}
	}
};

document.getElementById("register-form").addEventListener("submit", register);
document.getElementById("login-form").addEventListener("submit", login);
document.getElementById("post-form").addEventListener("submit", createPost);
document
	.getElementById("profile-form")
	.addEventListener("submit", updateProfile);
document.getElementById("logout-btn").addEventListener("click", logout);
document
	.getElementById("delete-account-btn")
	.addEventListener("click", deleteAccount);

navAuthBtn.addEventListener("click", () => showSection("auth-page"));
navFeedBtn.addEventListener("click", () => {
	if (token) {
		showSection("feed-page");
		loadPosts();
	}
});
navProfileBtn.addEventListener("click", () => {
	if (token) {
		showSection("profile-page");
		loadProfileData();
	}
});

if (token) {
	showSection("feed-page");
	loadPosts();
	loadProfileData();
} else {
	showSection("auth-page");
}
