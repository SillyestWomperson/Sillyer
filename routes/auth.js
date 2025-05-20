const router = require("express").Router();
const pool = require("../utils/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth");

router.post(
	"/register",
	[
		check("username").notEmpty().isLength({ min: 3 }),
		check("email").isEmail(),
		check("password").isLength({ min: 6 }),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { username, email, password } = req.body;
			const hashedPassword = await bcrypt.hash(password, 10);

			const newUser = await pool.query(
				"INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
				[username, email, hashedPassword]
			);

			const token = jwt.sign(
				{ id: newUser.rows[0].id },
				process.env.JWT_SECRET
			);

			res.json({ token });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await pool.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);

		if (user.rows.length === 0) {
			return res.status(401).json({ error: "Usuário não encontrado" });
		}

		const validPassword = await bcrypt.compare(
			password,
			user.rows[0].password
		);
		if (!validPassword) {
			return res.status(401).json({ error: "Senha inválida" });
		}

		const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET);
		res.json({ token });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.put("/profile", authMiddleware, async (req, res) => {
	try {
		const { username, email, profile_bio } = req.body;
		const userId = req.user_id;

		const currentUser = await pool.query(
			"SELECT username, email FROM users WHERE id = $1",
			[userId]
		);

		const updatedUsername = username || currentUser.rows[0].username;
		const updatedEmail = email || currentUser.rows[0].email;
		const updatedProfileBio =
			profile_bio || currentUser.rows[0].profile_bio;

		const updateduser = await pool.query(
			"UPDATE users SET username = $1, email = $2, profile_bio = $3 WHERE id = $4 RETURNING *",
			[updatedUsername, updatedEmail, updatedProfileBio, userId]
		);

		res.json(updateduser.rows[0]);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.delete("/delete-account", authMiddleware, async (req, res) => {
	try {
		const userId = req.user_id;

		await pool.query("DELETE FROM posts WHERE user_id = $1", [userId]);
		await pool.query("DELETE FROM users WHERE id = $1", [userId]);

		res.json({ message: "Conta deletada com sucesso" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
