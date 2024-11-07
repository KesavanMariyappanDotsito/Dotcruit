const connection = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signupController = async (req, res) => {
    const { userName, password, email, mobile, displayName } = req.body;

    bcrypt.hash(password, 10, async (err, hash) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });
        console.log(hash);


        const query = 'INSERT INTO users (userName, password, email, mobile, displayName) VALUES (?, ?, ?, ?, ?)';
        try {
            await connection.promise().query(query, [userName, hash, email, mobile, displayName])
            res.status(200).json({ message: 'User registered' });
        } catch (error) {
            res.status(500).json({ error, message: 'Error registering user' });
        }
    });
}

const loginController = async (req, res) => {
    const { login, password } = req.body;

    // Determine if login is email or username
    const query = login.includes('@')
        ? 'SELECT * FROM users WHERE email = ?'
        : 'SELECT * FROM users WHERE userName = ?';
    connection.execute(query, [login], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching user' });

        if (results.length === 0) return res.status(401).json({ message: 'User not found' });

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ message: 'Error comparing passwords' });

            if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

            const token = jwt.sign({ id: user.userId, username: user.userName, email: user.email, displayName: user.displayName }, process.env.JWT_SECRET, { expiresIn: '4h' });

            res.status(200).json({ message: 'Login successful', token });
        });
    });
}




module.exports = { signupController, loginController}