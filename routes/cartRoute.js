import express from "express";
import { addToCart, getCartItems, removeItemFromCart, updateCartItem } from "../controllers/cartController.js";
const router = express.Router();


router.post("/add-to-cart", addToCart);
router.get('/cart/:userId', getCartItems);
router.post('/cart/remove-item', removeItemFromCart);
router.post("/cart/update-item", updateCartItem);

  

export default router;