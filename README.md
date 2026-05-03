<div align="center">

# ⚙️ ShopEase — Backend API

### RESTful API Server for ShopEase E-Commerce Platform

[![Live API](https://img.shields.io/badge/🌐%20Live%20API-ecombackend.onrender.com-green?style=for-the-badge)](https://ecombackend-gso3.onrender.com)
[![GitHub](https://img.shields.io/badge/Frontend%20Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/MRSE435/ecomfrontend)
[![Live Site](https://img.shields.io/badge/🛒%20Live%20Site-shopease.mrse435.world-blue?style=for-the-badge)](https://shopease.mrse435.world)

<br/>

> The complete backend API powering ShopEase — handles authentication, product management, cart operations, and serves a React frontend deployed on a custom domain.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Session Auth | Secure login/register/logout with express-session and httpOnly cookies |
| 🛍️ Products API | Fetch all products — protected, only for authenticated users |
| 🛒 Cart Management | Add, increment, decrement, delete cart items per user |
| 🔄 Cross-Tab Sync | Cart updates broadcast across tabs via BroadcastChannel on frontend |
| 🔒 Auth Middleware | `requireauth` middleware protects all sensitive routes |
| 🌐 CORS Configured | Configured for both localhost dev and production custom domain |
| 🖼️ Static Images | Product images served via Express static middleware |
| 🚀 Production Ready | Deployed on Render with secure cookie config for HTTPS |

---

## 🚀 Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat&logo=mongoose&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white)

---

## 🗄️ Database Schema

```
┌──────────────────────┐
│        User          │
├──────────────────────┤
│ _id                  │
│ username  (String)   │
│ password  (String)   │
└──────────────────────┘

┌──────────────────────┐
│       Product        │
├──────────────────────┤
│ _id                  │
│ name      (String)   │
│ price     (Number)   │
│ imagePath (String)   │
│ category  (String)   │
└──────────────────────┘

┌──────────────────────────────────────────┐
│                  Cart                    │
├──────────────────────────────────────────┤
│ _id                                      │
│ username    (String)                     │
│ items []                                 │
│   └── productid  (ref: Product)          │
│   └── quantity   (Number, default: 1)    │
└──────────────────────────────────────────┘
```

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/register` | Register new user | ❌ |
| `POST` | `/api/login` | Login and create session | ❌ |
| `POST` | `/api/logout` | Destroy session + clear cookie | ❌ |
| `GET` | `/api/checkauth` | Check if session is active | ❌ |

### Products

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/products` | Fetch all products | ✅ |

### Cart

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/fetchcart` | Get user cart (populated with product data) | ✅ |
| `POST` | `/api/handlecart` | Add item or increment quantity (max 10) | ✅ |
| `POST` | `/api/decrementcart` | Decrease quantity or remove if qty is 1 | ✅ |
| `POST` | `/api/deleteitemfromcart` | Remove item completely from cart | ✅ |

---

## 💻 Key Code Highlights

### Auth Middleware
```javascript
const requireauth = (req, res, next) => {
    if (req.session.username) {
        next()                                    // ✅ logged in — continue
    } else {
        res.status(401).json({ message: "Unauthorized" })  // ❌ not logged in
    }
}
```

### Secure Session Cookie Config
```javascript
// Production — HTTPS only
cookie: {
    httpOnly: true,       // JS cannot access cookie
    secure: true,         // HTTPS only
    sameSite: "none",     // cross-origin allowed
    partitioned: true,    // modern browser support
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
}

// Development — HTTP allowed
cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
}
```

### Smart Cart Decrement Logic
```javascript
// If quantity > 1 → just reduce
item.quantity -= 1
await cart.save()

// If quantity === 1 → remove item completely
await Cart.updateOne(
    { username: req.session.username },
    { $pull: { items: { productid: productid } } }
)
```

### CORS — Dev + Production
```javascript
app.use(cors({
    origin: [
        "http://localhost:5173",           // local dev
        "https://shopease.mrse435.world",  // production
        process.env.FRONTEND_URL           // env variable
    ],
    credentials: true  // allow cookies cross-origin
}))
```

---

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/MRSE435/ecombackend
cd ecombackend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
DATABASE_URL=your_mongodb_atlas_connection_string
PORT=3000
NODE_ENV=development
```

### 4. Run the server
```bash
node index.js
# ✅ server started running at port 3000
# ✅ database connection successfully
```

### 5. Test an endpoint
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "test123"}'

# Response: { "message": "User registered" }
```

---

## 🏗️ Project Structure

```
ecombackend/
├── index.js          ← Express server + all routes + Mongoose schemas
├── public/           ← Product images served statically
│   └── images/
├── package.json
├── .env              ← DATABASE_URL, PORT (never commit)
└── .gitignore        ← .env and node_modules ignored
```

---

## 🚀 Production Deployment

```
Platform   →  Render
Database   →  MongoDB Atlas (cloud)
Images     →  Served via Express static middleware
Env Vars   →  Set in Render dashboard (not in code)
```

### Environment Variables on Render
```
DATABASE_URL   = mongodb+srv://...
PORT           = 3000
NODE_ENV       = production
FRONTEND_URL   = https://shopease.mrse435.world
```

---

## 🔗 Related Repositories

| Repo | Description |
|---|---|
| [ecomfrontend](https://github.com/MRSE435/ecomfrontend) | React frontend for ShopEase |
| [ShopEase Live](https://shopease.mrse435.world) | Full live app |

---

<div align="center">

## 👨‍💻 Author

**Mohammed Owais**

*BCA Student — Presidency College, Bangalore | SGPA: 8.98 / 10*

[![GitHub](https://img.shields.io/badge/GitHub-MRSE435-181717?style=flat&logo=github)](https://github.com/MRSE435)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Mohammed%20Owais-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/mohammed-owais-66053a2a0/)
[![Portfolio](https://img.shields.io/badge/Portfolio-mrse435.world-blue?style=flat&logo=google-chrome)](https://mrse435.world)

---

*If you found this project interesting, please consider giving it a ⭐*

</div>
