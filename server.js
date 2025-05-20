const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const pool = require("./utils/db");
const authMiddleware = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/public/index.html");
});

app.use("/api/auth", authRoutes);

app.post("/api/posts", authMiddleware, async (req, res) => {
	try {
		const { content } = req.body;
		const user_id = req.user_id;

		const newPost = await pool.query(
			"INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *",
			[user_id, content]
		);

		const postWithUser = await pool.query(
			"SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = $1",
			[newPost.rows[0].id]
		);

		res.json(postWithUser.rows[0]);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get("/api/posts", async (req, res) => {
	try {
		const posts = await pool.query(
			"SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY created_at DESC"
		);
		res.json(posts.rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Silly server conectado em https://localhost:${PORT}`);
});
