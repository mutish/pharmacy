import { Op } from 'sequelize';
import Product from "../models/Product.js";
import { validationResult } from 'express-validator';

export const createProduct = async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

export const getProducts = async(req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build where clause based on query params
    const where = {};
    
    if (req.query.search) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${req.query.search}%` } },
            { description: { [Op.iLike]: `%${req.query.search}%` } }
        ];
    }
    
    if (req.query.category) {
        where.category = req.query.category;
    }
    
    if (req.query.minPrice) {
        where.price = { [Op.gte]: parseFloat(req.query.minPrice) };
    }
    
    if (req.query.maxPrice) {
        where.price = { ...where.price, [Op.lte]: parseFloat(req.query.maxPrice) };
    }
    
    if (req.query.minStock) {
        where.stockQuantity = { [Op.gte]: parseInt(req.query.minStock) };
    }
    
    if (req.query.expired === 'true') {
        where.expiryDate = { [Op.lt]: new Date() };
    } else if (req.query.expired === 'false') {
        where[Op.or] = [
            { expiryDate: { [Op.gte]: new Date() } },
            { expiryDate: null }
        ];
    }
    
    // Handle sorting
    let order = [];
    if (req.query.sort) {
        const [field, direction] = req.query.sort.split('_');
        order = [[field, direction.toUpperCase()]];
    } else {
        order = [['createdAt', 'DESC']];
    }
    
    try {
        const { count, rows: products } = await Product.findAndCountAll({
            where,
            limit,
            offset,
            order,
        });
        
        res.json({
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getProductById = async(req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const updateProduct = async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updatedProduct = await product.update(req.body);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

export const deleteProduct = async(req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Soft delete
        await product.update({ isDeleted: true });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

export const updateStock = async(req, res) => {
    const { action, quantity } = req.body;
    
    if (!['add', 'subtract'].includes(action) || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid action or quantity' });
    }
    
    const transaction = await Product.sequelize.transaction();
    
    try {
        const product = await Product.findByPk(req.params.id, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });
        
        if (!product) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Product not found' });
        }
        
        let newStock;
        if (action === 'add') {
            newStock = product.stockQuantity + quantity;
        } else {
            if (product.stockQuantity < quantity) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            newStock = product.stockQuantity - quantity;
        }
        
        await product.update({ stockQuantity: newStock }, { transaction });
        
        // Check for low stock alert after update
        if (newStock <= product.lowStockThreshold) {
            console.log(`Low stock alert for ${product.name}. Current stock: ${newStock}, Threshold: ${product.lowStockThreshold}`);
            // In a real app, you might want to trigger a notification here
        }
        
        await transaction.commit();
        res.json(product);
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
};

export const getLowStockProducts = async(req, res) => {
    try {
        const products = await Product.findAll({
            where: {
                stockQuantity: {
                    [Op.lte]: Product.sequelize.col('lowStockThreshold')
                }
            },
            order: [['stockQuantity', 'ASC']]
        });
        
        res.json(products);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
};