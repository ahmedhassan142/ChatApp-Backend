import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import dotenv from "dotenv";

import express from "express"
import  { Request, Response, NextFunction } from "express";
import cors from "cors";
import connectDB from "./db/connect.js";
import userroute from "./routes/userroute.js";
import avatarroute from "./routes/avatarroute.js";
import cookieParser from "cookie-parser";
import { createWebSocketServer } from "./wsserver.js";

import verifyroute from "./routes/verifyroute.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



dotenv.config();
// Database connection
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.NEXT_PUBLIC_BASE_URL|| 'http://localhost:3000',process.env.NEXT_PUBLIC_SMART_REPLY_API||"http://localhost:8000"],
     methods: ["GET", "POST", "PUT", "DELETE"], // Your Next.js URL
    credentials: true,
     allowedHeaders: ['Content-Type', 'Authorization','Cookie'] // Required for cookies/sessions
  })
);

// Routes
app.use("/api/user", userroute);
app.use("/api/avatar", avatarroute);
app.use("/api/contact", avatarroute);

// Add this with other routes
app.use("/api/user", verifyroute);  // ✅ Now routes to /api/user/verify


// Serve static files
const staticPath = join(__dirname, "..", "frontend", "dist");
app.use(express.static(staticPath));

// Verify frontend files exist
// const indexPath = path.join(staticPath, "index.html");
// if (!fs.existsSync(indexPath)) {
//   console.error("Frontend index.html not found at:", indexPath);
//   process.exit(1);
// }

// // Handle SPA
// app.get("/*", (req: Request, res: Response) => {
//   res.sendFile(indexPath, (err: Error | null) => {
//     if (err) {
//       console.error("Error sending file:", err);
//       if (!res.headersSent) {
//         res.status(500).send("Error loading application");
//       }
//     }
//   });
// });

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Application running on port ${port}`);
});

createWebSocketServer(server);