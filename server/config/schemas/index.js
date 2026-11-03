import connectDB from "../DBConnect.js";

import { createOrganizationsTable } from "./Organization.js";
import { createProfilesTable } from "./Profile.js";
import { createLeadsTable } from "./Lead.js";
import { createActivitiesTable } from "./Activity.js";
import { createFollowUpsTable } from "./FollowUp.js";
import { createInvitationsTable } from "./Invitation.js";

const schemas = [
    createOrganizationsTable,
    createProfilesTable,
    createLeadsTable,
    createActivitiesTable,
    createFollowUpsTable,
    createInvitationsTable
];

const initializeSchemas = async () => {
    const client = await connectDB.connect();

    try {
        await client.query("BEGIN");

        for (const schema of schemas) {
            await client.query(schema);
        }

        await client.query("COMMIT");
        console.log("All database schemas created successfully!");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Schema initialization failed:", error);
        throw error;
    } finally {
        client.release();
    }
};

export default initializeSchemas;