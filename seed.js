const mongoose = require("mongoose");
const mongoURI = "mongodb+srv://m54655967_db_user:rCLKAzYVtWlw3qxj@cluster0.htuq1ct.mongodb.net/Ecommerce";

const seed = async () => {
    try {
        // 1. Wait for connection to be READY
        await mongoose.connect(mongoURI);
        console.log("✅ Connected to MongoDB...");

        // 2. Define Schema (Fixed imagePath casing)
        const Product = mongoose.model("Product", new mongoose.Schema({
            name: String,
            price: Number,
            imagePath: String, // Capital 'P' to match your data
            category: String
        }));

        const products = [
            { name: "Gaming PC Pro", price: 1500, imagePath: "/images/pc.jpg", category: "Desktop" },
            { name: "Workstation Z1", price: 1200, imagePath: "/images/pc.jpg", category: "Desktop" },
            { name: "Office Desktop", price: 700, imagePath: "/images/pc.jpg", category: "Desktop" }
        ];

        // 3. Clear and Insert
        await Product.deleteMany({}); // Clears old ones so you don't get duplicates
        await Product.insertMany(products);
        
        console.log("🚀 Products seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
};

seed();