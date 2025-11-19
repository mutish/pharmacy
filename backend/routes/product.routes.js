import express from 'express';
import { authorize, protectRoute } from '../middleware/protectRoute.js';
import { addProduct, deleteProduct, getAllProducts, getProductByCategory, getProductById, updateProduct } from '../controllers/product.controller.js';

const router = express.Router();

// Support both /api/products and /api/products/allproducts for convenience
router.get("/", getAllProducts);
router.get("/allproducts", getAllProducts);
router.get("/category/:category", getProductByCategory);
router.get("/:productId", getProductById);

router.use(protectRoute);

router.post("/add", authorize('pharmacist', 'admin'), addProduct);
router.put("/update/:productId", authorize('pharmacist', 'admin'), updateProduct);
router.delete("/delete/:productId", authorize('admin'), deleteProduct);


export default router;