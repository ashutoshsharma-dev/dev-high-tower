import express from "express";
import { autoFillController } from "../controllers/autofill.contoller.js";

const autofillRouter = express.Router();

autofillRouter.post("/autofill/:designId", autoFillController);

export default autofillRouter;
