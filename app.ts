import express, { json, urlencoded, static as static_ } from "express";
import path, { join } from "path";
import logger from "morgan";
import processEnv from "./env";
import indexRouter from "./src/routes";
import { StatusCodes } from "http-status-codes";
import { errorHandler } from "./src/middlewares/globalError";
import swaggerUi from 'swagger-ui-express';
import { getOpenApiDocumentation } from "./src/libs/swagger";
import cors from "cors"

const app = express()
const currEnv = processEnv.ENV
const openApiDocument = getOpenApiDocumentation();

app.use(logger(currEnv === "production" ? "short" : "dev"));
app.use(json())
app.use(cors());
app.use(urlencoded({ extended: false }));
app.use(static_(join(__dirname, "public")));
app.set("trust proxy", 1);

// main router
app.use("/", indexRouter);
// docs route
app.use('/docs/v1/', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// fe route
app.get('/fe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler)

// not found route
app.use("/*path", (_req, res) => { return res.status(StatusCodes.NOT_FOUND).json({ message: "Path not found" }) })

export default app;