const authRoutes = require('express').Router();
const { signupController, loginController } = require('../controller/auth.controller');
const { atscontroller } = require('../controller/Atscontroller');
const { authToken } = require('../middlewares/authenticateToken');

authRoutes.get("/me", authToken)

authRoutes.post("/register/", signupController)

authRoutes.post("/login/", loginController)

authRoutes.post("/atschecker/", atscontroller)

module.exports = authRoutes
