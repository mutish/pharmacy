import express from "express";
import { createProduct, getProducts, getProductById, getProductByName, updateProduct, deleteProduct } from "../../controllers/product.controller.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import roleMiddleware from "../../middlewares/roleMiddleware.js";

const router = express.Router();

//Only admin/pharmacist can add or modify products
router.post("/new-product", authMiddleware, roleMiddleware(["admin", "pharmacist"]), createProduct);
router.get("/all", getProducts);
router.get("/name/:name", getProductByName);
//router.get("/search", getFilteredProducts);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "pharmacist"]), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "pharmacist"]), deleteProduct);




export default router;