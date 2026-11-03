import connectDB from "../config/DBConnect.js";
import { enquirySchema } from "../middleware/validate.js";

export const createPublicEnquiry = async (req, res) => {
    try {
        // Validate the incoming form data
        const { error, value } = enquirySchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map(detail => detail.message)
            });
        }

        // Find the organization using its URL slug
        const { slug } = req.params;

        const organizationResult = await connectDB.query(
            `SELECT id FROM organizations WHERE slug = $1`,
            [slug]
        );

        if (organizationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        const organizationId = organizationResult.rows[0].id;

        // Get validated form values
        const { customerName, email, phone, productName } = value;

        // Save the enquiry as a new lead
        const leadResult = await connectDB.query(
            `INSERT INTO leads
                (organization_id, customer_name, email, phone, product_interest, source)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, customer_name, email, phone, product_interest, status, created_at`,
            [
                organizationId,
                customerName,
                email,
                phone,
                productName,
                "public_form"
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully",
            lead: leadResult.rows[0]
        });

    } catch (error) {
        console.error("Public enquiry error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to submit enquiry"
        });
    }
};