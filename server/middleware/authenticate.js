import supabaseAdmin from "../config/supabaseAdmin.js";
import connectDB from "../config/DBConnect.js";

const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify token with Supabase
        const { data, error } =
            await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token"
            });
        }

        // Fetch employee profile
        const profileResult = await connectDB.query(
            `SELECT id, organization_id, full_name, email, role, is_active
             FROM profiles
             WHERE id = $1`,
            [data.user.id]
        );

        if (profileResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "User profile not found"
            });
        }

        const profile = profileResult.rows[0];

        if (!profile.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        // Attach authenticated user to request
        req.user = profile;

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

export default authenticate;