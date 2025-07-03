// Create a new file: routes/verifyRoute.ts
const express=require("express")
import { verifyEmail } from "../controllers/verfiyemail";

const router = express.Router();
router.get("/verify", verifyEmail);  // Now accessible at /api/user/verify

export default router;