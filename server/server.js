import express from "express";
import cors from "cors";
import connectDB from "./config/DBConnect.js";
import "dotenv/config";
import initializeSchemas from "./config/schemas/index.js";
import authRoutes from "./routes/authRoute.js";
import authenticate from "./middleware/authenticate.js";
import authorize from "./middleware/authorize.js";
import leadRoutes from "./routes/leadRoutes.js";


const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}));


app.use("/org", authRoutes);
app.use("/enquiry", leadRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "LeadFlow CRM API is running"
    });
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