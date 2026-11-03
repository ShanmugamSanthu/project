import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
const { Pool } = pg;

dotenv.config({
    path: path.resolve(process.cwd(), ".env")
});


const connectDB = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default connectDB;