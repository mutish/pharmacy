import express from 'express';
import Product from "../models/Product.js";

export const createProduct = async(req, res) => {
    try {
        const { name, description, price, stock, requiresPrescription } = req.body;

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            prescriptionRequired
        });

        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        console.error("Error creating product:", error.message);
        res.status(500).json({ message: "Error creating product"});
    }

};

export const getProducts = async(req, res) => {
    try {
        const products = await Product.findAll();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).json({ message: "Error fetching products" });
    }
};

export const getProductById = async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("Error fetching product:", error.message);
        res.status(500).json({ message: "Error fetching product" });
    }
};

//trial method
export const getProductByName = async(req, res) => {
    try {
        const { name } = req.params;
        const product = await Product.findOne({ where: { name } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("Error fetching product:", error.message);
        res.status(500).json({ message: "Error fetching product" });
    }
};

export const updateProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.stock = stock || product.stock;

        await product.save();

        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error("Error updating product:", error.message);
        res.status(500).json({ message: "Error updating product" });
    }
};

export const deleteProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await product.destroy();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error.message);
        res.status(500).json({ message: "Error deleting product" });
    }
};