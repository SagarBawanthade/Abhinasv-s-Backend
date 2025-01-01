import express from "express";
import { addToCart, getCartItems, removeItemFromCart, updateCartItem } from "../controllers/cartController.js";
import { isAuthenticated } from "../middleware/mw.js";
const router = express.Router();


router.post("/add-to-cart",isAuthenticated, addToCart);
router.get('/cart/:userId', getCartItems);
router.post('/cart/remove-item', removeItemFromCart);
router.post("/cart/update-item", updateCartItem);

  

export default router;