import express from 'express';
import { authorize, protectRoute } from '../middleware/protectRoute.js';
import { addProduct, deleteProduct, getAllProducts, getProductByCategory, getProductById, updateProduct } from '../controllers/product.controller.js';

const router = express.Router();
router.use(protectRoute);

router.post("/add", authorize('pharmacist'), addProduct);
router.put("/update/:productId", authorize('pharmacist'), updateProduct); // <-- add :id param for update
router.get("/all", getAllProducts);
router.get("/category/:category", getProductByCategory);
router.get("/:productId", getProductById);
router.delete("/delete/:productId", authorize('admin'), deleteProduct);

export default router;