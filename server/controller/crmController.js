import connectDB from "../config/DBConnect.js";
import supabaseAdmin from "../config/supabaseAdmin.js";
import { employeeSchema, leadSchema } from "../middleware/validate.js";

const canAccessLead = async (leadId, user) => {
    const result = await connectDB.query(
        `SELECT * FROM leads WHERE id = $1 AND organization_id = $2`,
        [leadId, user.organization_id]
    );
    const lead = result.rows[0];
    if (!lead || (user.role === "salesperson" && lead.assigned_to !== user.id)) return null;
    return lead;
};

export const createEmployee = async (req, res) => {
    const { error, value } = employeeSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, message: error.details.map((item) => item.message).join(", ") });
    try {
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: value.email, password: value.password, email_confirm: true
        });
        if (authError) throw authError;
        const profile = await connectDB.query(
            `INSERT INTO profiles (id, organization_id, full_name, email, role)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role`,
            [data.user.id, req.user.organization_id, value.fullName, value.email, value.role]
        );
        res.status(201).json({ success: true, user: profile.rows[0] });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message.includes("already") ? "This email already exists" : "Could not create employee" });
    }
};

export const listEmployees = async (req, res) => {
    const salespersonFilter = req.user.role === "salesperson" ? " AND id = $2" : "";
    const parameters = req.user.role === "salesperson"
        ? [req.user.organization_id, req.user.id]
        : [req.user.organization_id];
    const result = await connectDB.query(
        `SELECT id, full_name, email, role FROM profiles WHERE organization_id = $1 AND is_active = TRUE${salespersonFilter} ORDER BY full_name`,
        parameters
    );
    res.json({ success: true, users: result.rows });
};

export const listLeads = async (req, res) => {
    const parameters = [req.user.organization_id];
    let where = "l.organization_id = $1";
    if (req.user.role === "salesperson") {
        parameters.push(req.user.id);
        where += ` AND l.assigned_to = $${parameters.length}`;
    }
    const result = await connectDB.query(
        `SELECT l.*, p.full_name AS assigned_name
         FROM leads l LEFT JOIN profiles p ON p.id = l.assigned_to
         WHERE ${where} ORDER BY l.updated_at DESC, l.created_at DESC`, parameters
    );
    res.json({ success: true, leads: result.rows });
};

export const createLead = async (req, res) => {
    const { error, value } = leadSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const result = await connectDB.query(
        `INSERT INTO leads (organization_id, customer_name, email, phone, product_interest, status, source, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'manual', $7) RETURNING *`,
        [req.user.organization_id, value.customerName, value.email || null, value.phone, value.productInterest || null, value.status, req.user.id]
    );
    res.status(201).json({ success: true, lead: result.rows[0] });
};

export const updateLead = async (req, res) => {
    const lead = await canAccessLead(req.params.id, req.user);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    const status = req.body.status;
    if (!['new', 'contacted', 'qualified', 'won', 'lost'].includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    const result = await connectDB.query("UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *", [status, lead.id]);
    res.json({ success: true, lead: result.rows[0] });
};

export const assignLead = async (req, res) => {
    const { userId } = req.body;
    const employee = await connectDB.query(
        "SELECT id, role FROM profiles WHERE id = $1 AND organization_id = $2 AND is_active = TRUE", [userId, req.user.organization_id]
    );
    if (!employee.rows[0] || employee.rows[0].role === "admin") return res.status(400).json({ success: false, message: "Choose an active manager or salesperson" });
    if (req.user.role === "manager" && employee.rows[0].role !== "salesperson") return res.status(403).json({ success: false, message: "Managers assign leads to salespeople" });
    const result = await connectDB.query(
        "UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *",
        [userId, req.params.id, req.user.organization_id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "Lead not found" });
    res.json({ success: true, lead: result.rows[0] });
};

export const getHistory = async (req, res) => {
    const lead = await canAccessLead(req.params.id, req.user);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    const [activities, followUps] = await Promise.all([
        connectDB.query(`SELECT a.*, p.full_name FROM activities a LEFT JOIN profiles p ON p.id = a.performed_by WHERE a.lead_id = $1 ORDER BY a.created_at DESC`, [lead.id]),
        connectDB.query(`SELECT f.*, p.full_name AS assigned_name FROM follow_ups f LEFT JOIN profiles p ON p.id = f.assigned_to WHERE f.lead_id = $1 ORDER BY f.due_at ASC`, [lead.id])
    ]);
    res.json({ success: true, activities: activities.rows, followUps: followUps.rows });
};

export const addActivity = async (req, res) => {
    const lead = await canAccessLead(req.params.id, req.user);
    const { type, description } = req.body;
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    if (!['call', 'meeting', 'email', 'note'].includes(type) || !description?.trim()) return res.status(400).json({ success: false, message: "Add an activity type and description" });
    const result = await connectDB.query("INSERT INTO activities (lead_id, performed_by, activity_type, description) VALUES ($1, $2, $3, $4) RETURNING *", [lead.id, req.user.id, type, description.trim()]);
    res.status(201).json({ success: true, activity: result.rows[0] });
};

export const addFollowUp = async (req, res) => {
    const lead = await canAccessLead(req.params.id, req.user);
    const { dueAt, notes } = req.body;
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    if (!dueAt) return res.status(400).json({ success: false, message: "Choose a follow-up date" });
    const assignedTo = lead.assigned_to || req.user.id;
    const result = await connectDB.query("INSERT INTO follow_ups (lead_id, assigned_to, created_by, due_at, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *", [lead.id, assignedTo, req.user.id, dueAt, notes || null]);
    res.status(201).json({ success: true, followUp: result.rows[0] });
};

export const completeFollowUp = async (req, res) => {
    const result = await connectDB.query(
        `UPDATE follow_ups f SET status = 'completed' FROM leads l
         WHERE f.id = $1 AND f.lead_id = l.id AND l.organization_id = $2
         AND ($3 <> 'salesperson' OR f.assigned_to = $4) RETURNING f.*`,
        [req.params.id, req.user.organization_id, req.user.role, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: "Follow-up not found" });
    res.json({ success: true, followUp: result.rows[0] });
};

export const dashboard = async (req, res) => {
    const org = req.user.organization_id;
    const owned = req.user.role === "salesperson" ? "AND assigned_to = $2" : "";
    const args = req.user.role === "salesperson" ? [org, req.user.id] : [org];
    const [leadStats, followUps, team] = await Promise.all([
        connectDB.query(`SELECT status, COUNT(*)::int AS count FROM leads WHERE organization_id = $1 ${owned} GROUP BY status`, args),
        connectDB.query(`SELECT COUNT(*)::int AS count FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE l.organization_id = $1 AND f.status = 'pending' AND f.due_at <= NOW() ${req.user.role === "salesperson" ? "AND f.assigned_to = $2" : ""}`, args),
        req.user.role === "manager" ? connectDB.query("SELECT p.full_name, COUNT(l.id)::int AS lead_count FROM profiles p LEFT JOIN leads l ON l.assigned_to = p.id WHERE p.organization_id = $1 AND p.role = 'salesperson' GROUP BY p.id, p.full_name ORDER BY lead_count DESC", [org]) : Promise.resolve({ rows: [] })
    ]);
    res.json({ success: true, stats: { leads: leadStats.rows, overdueFollowUps: followUps.rows[0].count, team: team.rows } });
};
