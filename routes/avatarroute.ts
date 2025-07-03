const express=require("express")

import { downloadAvatars,uploadAvatar } from '../controllers/profilecontroller';
import { getAllAvatars } from '../controllers/profilecontroller';

const router = express.Router();

// router.post("/", avatarcontroller);
router.get("/all", getAllAvatars);
router.post("/download", downloadAvatars);
router.post("/upload", uploadAvatar);

export default router;