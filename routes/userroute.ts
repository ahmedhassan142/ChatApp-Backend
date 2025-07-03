import express from "express"
import  registercontroller from '../controllers/registercontroller.js';
import { getMessages } from '../controllers/messagecontroller.js';
import { peoplecontroller } from '../controllers/peoplecontroller.js';
import  logincontroller  from '../controllers/logincontroller.js';
import { verifyEmail } from '../controllers/verfiyemail.js';
import  {profileController}  from '../controllers/profilecontroller.js';
import { profileUpdate } from '../controllers/profilecontroller.js';
import { Request,Response } from 'express';
import { clearConversation } from '../controllers/messagecontroller.js';

const router = express.Router();

router.post("/register", registercontroller);
router.post("/login", logincontroller);
// router.get("/:id/verify/:token", verifyEmail);
router.get("/profile", profileController);
router.get("/messages/:userId", getMessages);

router.get("/people", peoplecontroller);
router.get("/verify", verifyEmail);
router.put("/profile/update", profileUpdate);
router.delete('/messages/clear-conversation',clearConversation);
// In your auth routes
router.post('/logout', (req:Request, res:Response) => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

export default router;