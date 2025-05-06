import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  searchUsers,
  getConversationUsers,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authentication routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Profile routes
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);

// New user search and conversation routes
router.get("/search", protectRoute, searchUsers); // GET /api/auth/search?email=...
router.get("/conversations", protectRoute, getConversationUsers); // GET /api/auth/conversations

export default router;
