import express from "express";
import { createPublicEnquiry } from "../controller/leadController.js";

const router = express.Router();

router.post("/:slug", createPublicEnquiry);

export default router;