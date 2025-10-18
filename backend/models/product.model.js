import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productId:{
        type: String,
        unique: true
    },
    productName:{
        type: String,
        required: true  
    },
    productDescription: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Pain and Inflammation',
            'Respiratory and Allergy Care', 
            'Digestive Health',
            'Eye and Ear Care',
            'Vitamins and Supplements',
            'Personal Care and Hygiene',
            'Family Health',
            'First Aid and Medical Devices',
            'Foot and Leg Care',
            'Habit Treatment'
        ]
    },
    imageUrl: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    mfgDate: {
        type: Date,
        required: true,
    },
    expDate: {
        type: Date,
        required: true,
    },
    prescriptionRequired: {
        type: Boolean,
        required: true,
        default: false,
    },

    
}, {timestamps: true});

productSchema.pre("save", function (next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.productId = `PR${timestamp}${rand}`;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;