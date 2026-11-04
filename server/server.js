import express from "express";
import cors from "cors";
import connectDB from "./config/DBConnect.js";
import "dotenv/config";
import initializeSchemas from "./config/schemas/index.js";
import authRoutes from "./routes/authRoute.js";
import authenticate from "./middleware/authenticate.js";
import authorize from "./middleware/authorize.js";
import leadRoutes from "./routes/leadRoutes.js";
import crmRoutes from "./routes/crmRoutes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";


const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client/dist");

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || true
}));

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "LeadFlow CRM API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api", crmRoutes);
app.use("/enquiry", leadRoutes);

app.use(express.static(clientDist));
app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/enquiry")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (error) => error && next());
});



const startServer = async () => {
    try {
        await connectDB.query("SELECT NOW()");
        await initializeSchemas()
        console.log("Database connected successfully");
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
    }
};
startServer();
