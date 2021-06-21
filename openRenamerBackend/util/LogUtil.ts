import { getLogger, configure } from "log4js";
configure({
    appenders: { cheese: { type: "console" } },
    categories: { default: { appenders: ["cheese"], level: "info" } }
});
const logger = getLogger();
logger.level = "debug";

export default logger;