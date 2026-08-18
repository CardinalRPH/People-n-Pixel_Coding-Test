import express, { json, urlencoded, static as static_ } from "express";
import { join } from "path";
import logger from "morgan";
import processEnv from "./env";
import indexRouter from "./src/routes";
import { StatusCodes } from "http-status-codes";
import { errorHandler } from "./src/middlewares/globalError";
import swaggerUi from 'swagger-ui-express';
import { getOpenApiDocumentation } from "./src/libs/swagger";


const app = express()
const currEnv = processEnv.ENV
const openApiDocument = getOpenApiDocumentation();

app.use(logger(currEnv === "production" ? "short" : "dev"));
app.use(json())
app.use(urlencoded({ extended: false }));
app.use(static_(join(__dirname, "public")));
app.set("trust proxy", 1);


app.use("/", indexRouter);
app.use('/docs/v1/', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use(errorHandler)

app.use("/*path", (_req, res) => { return res.status(StatusCodes.NOT_FOUND).json({ message: "Path not found" }) })

export default app;