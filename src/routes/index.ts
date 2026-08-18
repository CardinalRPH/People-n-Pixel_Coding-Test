import { Router } from "express";
import { bulkInsertHandler, searchHandler, statsHandler } from "../controller/mentionController";
import limitRate from "../middlewares/rateLimiter";
import limitRequest from "../config/limitRequest";

const router = Router()

router.use(limitRate(limitRequest.default))
router.post("/internal/mentions/bulk", bulkInsertHandler)
router.get("/mentions", searchHandler)
router.get("/mentions/stats", statsHandler)


export default router