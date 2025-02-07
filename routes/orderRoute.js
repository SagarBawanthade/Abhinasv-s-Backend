import express from "express";
import {   createOrder, createRazorpayOrder, deleteOrder, getAllOrders, getSingleOrders, sendOrderEmail, sendUpdateOrderEmail, updateOrderStatus } from "../controllers/orderController.js";
import { verifyRazorpayPayment } from "../middleware/verifyRazorPayment.js";

const router = express.Router();

router.post("/create-order",createOrder)
router.get("/orders",getAllOrders)
router.get("/order/:id",getSingleOrders)
router.patch('/update-status/:id', updateOrderStatus);
router.delete("/delete-order/:id",deleteOrder);
router.post("/send-email",sendOrderEmail);
router.post("/send-update-order-email",sendUpdateOrderEmail);


router.post("/verify-razorpay-payment",verifyRazorpayPayment)
router.post("/create-razorpay-order",createRazorpayOrder)







export default router;