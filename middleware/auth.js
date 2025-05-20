const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user_id = decoded.id;
		next();
	} catch (error) {
		res.status(401).json({ error: "Por favor, faça login" });
	}
};

module.exports = authMiddleware;
