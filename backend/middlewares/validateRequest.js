import { validationResult } from 'express-validator';
import { body, param, query } from 'express-validator';

export const validateCreateOrder = [
    body('paymentMethod')
        .isIn(['card', 'mpesa'])
        .withMessage('Invalid payment method'),
    
    body('shippingAddress')
        .isObject()
        .withMessage('Shipping address is required'),
    
    body('shippingAddress.street')
        .isString()
        .notEmpty()
        .withMessage('Street is required'),
    
    body('shippingAddress.city')
        .isString()
        .notEmpty()
        .withMessage('City is required'),
    
    body('shippingAddress.country')
        .isString()
        .notEmpty()
        .withMessage('Country is required'),
    
    body('payment')
        .isObject()
        .withMessage('Payment details are required'),
    
    body('payment.phone')
        .isString()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Invalid phone number format'),
    
    body('payment.name')
        .isString()
        .notEmpty()
        .withMessage('Name is required')
];

export const validateUpdateStatus = [
    param('id')
        .isUUID()
        .withMessage('Invalid order ID'),
    
    body('status')
        .isIn(['processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('Invalid status')
];

export const validateOrderQuery = [
    query('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('Invalid status'),
    
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format. Use ISO8601'),
    
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format. Use ISO8601'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

export const validateOrderId = [
    param('id')
        .isUUID()
        .withMessage('Invalid order ID')
];

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }
    next();
};

export default validateRequest;
