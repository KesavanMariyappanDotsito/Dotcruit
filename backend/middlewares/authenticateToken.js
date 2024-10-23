const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });

        req.user = decoded;
        next();
    });
};

const authToken = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });

        res.json({ user });
    });
}

module.exports = { authenticateToken, authToken };
