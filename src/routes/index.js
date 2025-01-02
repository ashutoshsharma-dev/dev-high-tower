import express from "express";
import authRouter from "./auth.route.js";
import autofillRouter from "./autofill.route.js";

// index router
const router = express.Router();

router.use("/oauth", authRouter);
router.use("/canva", autofillRouter);

export default router;
