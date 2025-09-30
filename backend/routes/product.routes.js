import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
    createProduct, 
    getProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    updateStock,
    getLowStockProducts
} from '../controllers/product.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';

const router = Router();

// Validation rules
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    body('price')
        .isFloat({ gt: 0 })
        .withMessage('Price must be a positive number'),
    body('stockQuantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    body('lowStockThreshold')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Low stock threshold must be a non-negative integer'),
    body('category')
        .isIn(['OTC', 'Prescription', 'Supplements'])
        .withMessage('Invalid category'),
    body('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid expiry date')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Expiry date must be in the future');
            }
            return true;
        }),
    body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Invalid image URL')
];

// Routes
router.post(
    '/', 
    authMiddleware,
    productValidation,
    validateRequest,
    createProduct
);

router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('search').optional().trim(),
        query('category').optional().isIn(['OTC', 'Prescription', 'Supplements']),
        query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
        query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
        query('minStock').optional().isInt({ min: 0 }).toInt(),
        query('expired').optional().isIn(['true', 'false']),
        query('sort').optional().matches(/^(name|price|stockQuantity|createdAt)_(asc|desc)$/i)
    ],
    validateRequest,
    getProducts
);

router.get(
    '/low-stock',
    authMiddleware,
    getLowStockProducts
);

router.get(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid product ID')
    ],
    validateRequest,
    getProductById
);

router.put(
    '/:id',
    authMiddleware,
    [
        param('id').isUUID().withMessage('Invalid product ID'),
        ...productValidation.map(validation => validation.optional())
    ],
    validateRequest,
    updateProduct
);

router.delete(
    '/:id',
    authMiddleware,
    [
        param('id').isUUID().withMessage('Invalid product ID')
    ],
    validateRequest,
    deleteProduct
);

router.patch(
    '/:id/stock',
    authMiddleware,
    [
        param('id').isUUID().withMessage('Invalid product ID'),
        body('action').isIn(['add', 'subtract']).withMessage('Action must be either "add" or "subtract"'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
    ],
    validateRequest,
    updateStock
);

export default router;