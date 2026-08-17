import debugLib from "debug";
import processEnv from "../../env";

const serverName = processEnv.APP_NAME

type LogLevel = "info" | "warn" | "error";

const createDebug = (namespace: string) => {
    const cache: Partial<Record<LogLevel, debugLib.Debugger>> = {};

    return (level: LogLevel, message: string, meta?: unknown) => {
        if (!cache[level]) {
            cache[level] = debugLib(`${namespace}:[${level}]`);
        }

        const logger = cache[level]!;
        if (meta !== undefined) {
            logger(message, meta);
        } else {
            logger(message);
        }
    };
}

const debug = createDebug(serverName)

export default debug
