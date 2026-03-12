import express from "express";
import authRoute from "./routes/auth.route.js";
import "dotenv/config";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("LMS Backend running! Use /health for status.");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello Express!" });
});

app.post("/api/echo", (req, res) => {
  res.json({
    received: req.body,
  });
});

app.use("/api", authRoute);

export default app;
