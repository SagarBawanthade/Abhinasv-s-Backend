import express from "express";
import { addToCart, getCartItems, removeItemFromCart, syncCart, updateCartItem } from "../controllers/cartController.js";
import { isAuthenticated } from "../middleware/mw.js";
const router = express.Router();


router.post("/add-to-cart",isAuthenticated, addToCart);
router.get('/cart/:userId', getCartItems);
router.delete('/cart/remove-item/:userId/:productId', removeItemFromCart);
router.post("/cart/update-item", updateCartItem);

router.post('/sync-cart',isAuthenticated, syncCart);




  

export default router;