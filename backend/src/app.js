const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { env } = require("./config/env");
const routes = require("./routes");
const { securityHeaders } = require("./middleware/securityHeaders");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const corsOrigin = env.clientOrigin === "*" ? true : env.clientOrigin;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(securityHeaders);

app.use("/api", routes);
app.use(express.static(path.join(__dirname, "..", ".."), {
  maxAge: env.nodeEnv === "production" ? "7d" : 0,
  setHeaders(res, filePath) {
    if (/\.(?:png|jpg|jpeg|webp|gif|svg|css|js)$/i.test(filePath)) {
      res.setHeader("Cache-Control", env.nodeEnv === "production" ? "public, max-age=604800, immutable" : "no-cache");
    }
  }
}));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
