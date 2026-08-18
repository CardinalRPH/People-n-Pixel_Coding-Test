import { Router } from "express";
import { bulkInsertHandler, searchHandler } from "../controller/mentionController";

const router = Router()

router.post("/internal/mentions/bulk", bulkInsertHandler)
router.get("/mentions", searchHandler)

export default router