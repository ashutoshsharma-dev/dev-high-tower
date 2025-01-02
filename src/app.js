import express from "express";
import morgan from "morgan";
import cors from "cors";
import router from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: "GET,POST",
  }),
);
app.use("/api", router);

export default app;
