import express from "express";
import {
    registerOrganization,
    loginUser
} from "../controller/authController.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.post("/register", registerOrganization);
router.post("/login", loginUser);
router.get("/me", authenticate, (req, res) => res.json({ success: true, profile: req.user }));

export default router;
