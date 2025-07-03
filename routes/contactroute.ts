const express=require("express")
import { contactController } from '../controllers/contactcontroller';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting configuration
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many contact attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to contact route
router.post('/', contactLimiter, contactController);

export default router;