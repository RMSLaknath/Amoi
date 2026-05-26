import express from "express";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
} from "../controllers/productController.js";

// ✅ NEW IMPORT (debug controller)
import { getDebugProducts } from "../controllers/productDebugController.js";

const productRouter = express.Router();

// Admin features
productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct,
);

productRouter.post("/remove", adminAuth, removeProduct);

// User features
productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);

// ✅ DEBUG ROUTE (NEW)
productRouter.get("/debug-list", getDebugProducts);

export default productRouter;
