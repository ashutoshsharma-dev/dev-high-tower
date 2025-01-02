import express from "express";
import { autoFillController } from "../controllers/autofill.contoller.js";

const autofillRouter = express.Router();

autofillRouter.get("/autofill/:designId", autoFillController);

export default autofillRouter;