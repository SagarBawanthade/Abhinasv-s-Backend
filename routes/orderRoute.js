import express from "express";
import {  createOrder, deleteOrder, getAllOrders, getSingleOrders, updateOrderStatus } from "../controllers/orderController.js";

const router = express.Router();

router.post("/create-order",createOrder)
router.get("/orders",getAllOrders)
router.get("/order/:id",getSingleOrders)
router.patch('/update-status/:id', updateOrderStatus);
router.delete("/delete-order/:id",deleteOrder)




export default router;