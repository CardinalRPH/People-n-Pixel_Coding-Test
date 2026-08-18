import { Router } from "express";
import { bulkInsertHandler, searchHandler, statsHandler } from "../controller/mentionController";

const router = Router()

router.post("/internal/mentions/bulk", bulkInsertHandler)
router.get("/mentions", searchHandler)
router.get("/mentions/stats", statsHandler)


export default router