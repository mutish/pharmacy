import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";

export const addProduct = async (req, res) => {
    try {
        const { 
            productName, 
            productDescription, 
            category, 
            price, 
            stock, 
            mfgDate, 
            expDate, 
            prescriptionRequired 
        } = req.body;

        const imageFile = req.body.imageUrl;

        const uploadedResult = await cloudinary.uploader.upload(imageFile, {
            folder: 'products',
            public_id: productName.replace(/\s+/g,'_')
        });

        const existingProduct = await Product.findOne({productName});
        if(existingProduct) {
            return res.status(400).json({error: "Product already exists"});
        }
        const productId = `PR${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5).toUpperCase()}`;

        const newProduct = new Product({
            productId,
            productName,
            productDescription,
            category,
            imageUrl:uploadedResult.secure_url,
            price,
            stock,
            mfgDate,
            expDate,
            prescriptionRequired
        });

        await newProduct.save();

        res.status(201).json(newProduct);
    } catch (error) {
        console.log("Error in addProduct controller",error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { price, stock } = req.body;
        const {id: productId} = req.params;

        const product = await Product.findOne({productId});
        if(!product) {
            return res.status(400).json({error: "Product does not exist"});
        }
        const updatedProduct = await Product.findOneAndUpdate(
            { productId },
            { price, stock },
            { new: true }
        );

        if(!updatedProduct) {
            return res.status(404).json({ error: "Product not found "});
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.log("Error in updateProduct controller",error.message);
        res.status(500).json({ error:"Internal Server Error" });
    } 
    
};

//fetch all products
export const  getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.log("Error in getAllProducts controller: ", error.message);
        res.status(500).json({error: "Internal Server Error"});
        
    }
};


//fetch by category
export const getProductByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category });
        res.status(200).json(products);
    } catch (error) {
        console.log("Error in getProductByCategory controller: ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
};

//fetch by id
export const getProductById = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const product = await Product.findOne({ productId });
        if(!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.log("Error in getProductById controller: ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
};

//delete product
export const deleteProduct = async (req, res) => {
    try {
        const {id: productId} = req.params;
        const product = await Product.findOneAndDelete({productId});
        if(!product) {
            return res.status(400).json({error: "Product does not exist"});
        }
        res.status(200).json(product, {message: "Product deleted successfully"});
    } catch (error) {
        console.log("Error in deleteProduct controller: ", error.message);
        res.status(500).json({error: "Failed to delete product"});
    }
};



