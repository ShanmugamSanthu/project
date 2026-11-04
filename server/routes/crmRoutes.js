import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
    addActivity, addFollowUp, assignLead, completeFollowUp, createEmployee, createLead,
    dashboard, getHistory, listEmployees, listLeads, updateLead
} from "../controller/crmController.js";

const router = express.Router();
router.use(authenticate);
router.get("/dashboard", dashboard);
router.get("/users", listEmployees);
router.post("/users", authorize("admin"), createEmployee);
router.get("/leads", listLeads);
router.post("/leads", authorize("admin", "manager"), createLead);
router.patch("/leads/:id", updateLead);
router.post("/leads/:id/assign", authorize("admin", "manager"), assignLead);
router.get("/leads/:id/history", getHistory);
router.post("/leads/:id/activities", addActivity);
router.post("/leads/:id/follow-ups", addFollowUp);
router.patch("/follow-ups/:id/complete", completeFollowUp);
export default router;
