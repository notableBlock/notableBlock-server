if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const notesRouter = require("./routes/notes");
const sharedRouter = require("./routes/shared");
const notificationRouter = require("./routes/notification");

const isAuthenticated = require("./middlewares/auth");

const app = express();

try {
  mongoose.connect(process.env.MONGO_ATLAS_URI);
  console.log("MongoDB 연결 성공");
} catch (err) {
  console.log("MongoDB 연결 실패:", err);
  next(err);
}

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

const corsOptions = {
  origin: [process.env.CLIENT_URL, "http://localhost:5173"],
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
};
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.use(isAuthenticated);
app.use("/notes", notesRouter);
app.use("/shared", sharedRouter);
app.use("/notification", notificationRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = app;
