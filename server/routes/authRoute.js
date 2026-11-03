import express from "express";
import {
    registerOrganization,
    loginUser
} from "../controller/authController.js";

const router = express.Router();

router.post("/register", registerOrganization);
router.post("/login", loginUser);

export default router;