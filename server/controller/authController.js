import connectDB from "../config/DBConnect.js";
import supabaseAdmin from "../config/supabaseAdmin.js";
import { registerSchema } from "../middleware/validate.js";
import crypto from "node:crypto";

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
};

export const registerOrganization = async (req, res) => {
    let organizationId;
    let authUserId;

    try {
        const { error, value } = registerSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map((detail) => detail.message)
            });
        }

        const { organizationName, fullName, email, password } = value;


        const baseSlug = generateSlug(organizationName);
        const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;


        const organizationResult = await connectDB.query(
            `INSERT INTO organizations (name, slug)
             VALUES ($1, $2)
             RETURNING id, name, slug`,
            [organizationName, slug]
        );

        organizationId = organizationResult.rows[0].id;


        const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

        if (authError) throw authError;

        authUserId = authData.user.id;

        await connectDB.query(
            `INSERT INTO profiles
             (id, organization_id, full_name, email, role)
             VALUES ($1, $2, $3, $4, $5)`,
            [authUserId, organizationId, fullName, email, "admin"]
        );

        return res.status(201).json({
            success: true,
            message: "Organization registered successfully",
            organization: organizationResult.rows[0],
            admin: {
                id: authUserId,
                fullName,
                email,
                role: "admin"
            }
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        if (authUserId) {
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }

        if (organizationId) {
            await connectDB.query(
                "DELETE FROM organizations WHERE id = $1",
                [organizationId]
            );
        }

        return res.status(500).json({
            success: false,
            message: "Organization registration failed"
        });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Authenticate user with Supabase
        const { data, error } =
            await supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const userId = data.user.id;

        // Fetch employee profile
        const profileResult = await connectDB.query(
            `SELECT id, organization_id, full_name, email, role
             FROM profiles
             WHERE id = $1 AND is_active = TRUE`,
            [userId]
        );

        if (profileResult.rows.length === 0) {
            await supabaseAdmin.auth.admin.signOut(data.session.access_token);

            return res.status(403).json({
                success: false,
                message: "User profile not found or inactive"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            profile: profileResult.rows[0]
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};