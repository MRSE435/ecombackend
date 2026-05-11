const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";


const session = require('express-session');
const app = express();
app.use(express.json())
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://shopease.mrse435.world",
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

app.use("/images", express.static(path.join(__dirname, "public")));

app.set('trust proxy', 1);
app.use(session({
  secret: "m7861901@ifp",
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: isProduction
    ? {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        partitioned: true,
        maxAge: 24 * 60 * 60 * 1000
      }
    : {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
      }
}));

//
const requireauth = (req, res, next) => {
    if (req.session.user) {
        next()
    }
    else {
        res.status(401).json({ message: "Unauthorized" })
    }
}


const mongoURI = process.env.DATABASE_URL;
mongoose.connect(mongoURI)
    .then(() => { console.log("database connection succesfully") })
    .catch(err => console.log("❌ MongoDB Error:", err));


const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    imagePath: String,
    category: String
});

const userschema = new mongoose.Schema({
    username: String,
    password: String
})
const User = mongoose.model("User", userschema)
const Product = mongoose.model("Product", productSchema);


const cartschema = new mongoose.Schema({
    userId:{type: mongoose.Schema.Types.ObjectId,
            ref:User,
            required:true
    },
    items: [
        {
            productid: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: { type: Number, default: 1 }
        }

    ]
})

const Cart = mongoose.model("Cart", cartschema)
module.exports = Cart




app.post("/api/register", async(req, res) => {
    try {
        const newuser = new User({
            username: req.body.username,
            password: req.body.password
        });
        await newuser.save();
        res.status(201).json({ message: "User registered" }); // Add this line
    } catch (error) {
        res.status(400).json({ message: "Registration failed" });
    }
});

app.post("/api/login", async (req, res) => {
    const userfind = await User.findOne({
        username: req.body.username,
        password: req.body.password
    })
    if (userfind) {
         req.session.user={
                    id:userfind._id,
                    username:userfind.username
                }

        res.status(200).send({ username: userfind.username })
    }

})
app.get("/api/products", requireauth, async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products)
    } catch ({ error }) {
        res.send("an error occured");
    }
})

app.get("/api/checkauth", (req, res) => {
    if (req.session.user) {
        res.json({
            isloggedin: true,
            username: req.session.user.username
        });
    }
    else {
        res.json({ isloggedin: false })
    }
})

app.post("/api/decrementcart", requireauth, async (req, res) => {
    try {
        const { productid } = req.body;
        const userId=req.session.user.id;
        const cart = await Cart.findOne({ userId});

        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find(p => p.productid.toString() === productid);

        if (item) {
            if (item.quantity > 1) {
                // Scenario 1: Just reduce quantity
                item.quantity -= 1;
                cart.markModified('items');
                await cart.save(); // Save the new quantity
                return res.json({ message: "Quantity decreased" });
            } else {
                // Scenario 2: Quantity is 1, use $pull to remove
                // We do NOT call cart.save() here
                await Cart.updateOne(

                    { username: req.session.username },

                    { userId},

                    { $pull: { items: { productid: productid } } }
                );
                return res.json({ message: "Item removed from cart via pull" });
            }
        }

        res.status(404).json({ message: "Item not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


// 1. Fixed the typo from "delte" to "delete"
// 2. Added res.json so the frontend gets a success signal
app.post("/api/deleteitemfromcart", requireauth, async (req, res) => {
    const { productid } = req.body;
       const userId=req.session.user.id;
    try {
        await Cart.updateOne(
            { userId },
            { $pull: { items: { productid: productid } } }
        );
        res.json({ message: "Item deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting item" });
    }
});


app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send("errr could not lpgout")
      res.clearCookie("connect.sid", {
    path: "/",
    sameSite: "none",
          partitioned: true, // ADD THIS LINE
            httpOnly: true,
    secure: true
});
        res.status(200).send("logged out")
    })
})

app.post("/api/handlecart", requireauth, async (req, res) => {
    try {
        const { productid } = req.body;
           const userId=req.session.user.id;
        // DEBUG: Log this to see if the ID is actually reaching the server
        console.log("Adding Product ID:", productid);

        let cart = await Cart.findOne({ userId});
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Potential crash point: Ensure productid exists before calling toString()
        const item = cart.items.find(p => p.productid && p.productid.toString() === productid);
        const maxlimit = 10;

        if (item) {
            if (item.quantity >= maxlimit) {
                return res.status(400).json({ message: "Limit reached" });
            }
            item.quantity += 1;
        } else {
            cart.items.push({ productid, quantity: 1 });
        }

        await cart.save();
        res.json({ message: "success" });

    } catch (error) {
        // THIS IS KEY: Look at your terminal/command prompt to see the red text!
        console.error("SERVER CRASH:", error); 
        res.status(400).json({ message: "Server error: " + error.message });
    }
});


app.get("/api/fetchcart", requireauth, async (req, res) => {
    try {
        const userId=req.session.user.id;
        const cart = await Cart.findOne({ userId }).populate("items.productid")
        res.json(cart ? cart.items : [])
    } catch (error) {
        res.status(400).send("error")
    }

})

app.listen(PORT, () => {
    console.log(`server started running at port ${PORT}`)
})
