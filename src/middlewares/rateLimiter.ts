import rateLimit from "express-rate-limit";

const limitRate = (limitValue: { rate: number, max: number }) => rateLimit({
    windowMs: limitValue.rate,
    max: limitValue.max,                
    message: {
        error: "Too many request, please try again later.",
    },
    standardHeaders: true,   
    legacyHeaders: false,   
})

export default limitRate