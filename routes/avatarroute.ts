import express from "express"

import { downloadAvatars,uploadAvatar } from '../controllers/profilecontroller.js';
import { getAllAvatars } from '../controllers/profilecontroller.js';

const router = express.Router();

// router.post("/", avatarcontroller);
router.get("/all", getAllAvatars);
router.post("/download", downloadAvatars);
router.post("/upload", uploadAvatar);

export default router;