import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createPlayer,
  deletePlayer,
  listPlayers,
  updatePlayer,
} from "../controllers/playersController.js";

const router = Router();

router.get("/", requireAuth, listPlayers);
router.post("/", requireAuth, createPlayer);
router.patch("/:id", requireAuth, updatePlayer);
router.delete("/:id", requireAuth, deletePlayer);

export default router;
