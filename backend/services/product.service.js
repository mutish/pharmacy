import Product from "../models/Product.js";

const createProduct = async(data) => {
    return await Product.create(data);
};

const getProducts = async() => {
    return await Product.findAll();
};

const getProductById = async(id) => {
    return await Product.findByPk(id);
};

const getProductByName = async(name) => {
    return await Product.findOne({ where: { name } });
};


const updateProduct = async(id, updates) => {
    const product = await Product.findByPk(id);
    if (!product) {
        throw new Error("Product not found");
    }
    await product.update(updates);
    return product;
};

const deleteProduct = async(id) => {
    const product = await Product.findByPk(id);
    if (!product) {
        throw new Error("Product not found");
    }
    await product.destroy();
    return;
};

export default {
    createProduct,
    getProducts,
    getProductById,
    getProductByName,
    updateProduct,
    deleteProduct
};
