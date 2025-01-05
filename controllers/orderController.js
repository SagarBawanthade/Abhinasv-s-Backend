import express from "express";
import Order from "../models/orderSchema.js";
import Product from "../models/productSchema.js";
import User from "../models/userSchema.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";



export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET,
  
});



export const createOrder = async (req, res) => {
  const { user, contactInformation, shippingInformation, paymentInformation, orderSummary } = req.body;

  const { email, id: userId } = user;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const productIds = [...new Set(orderSummary.items.map(item => item.product))];
    

    const products = await Product.find({ _id: { $in: productIds } });
    

    if (products.length !== productIds.length) {
      const missingIds = productIds.filter(id => !products.some(product => product._id.toString() === id));
      
      return res.status(404).json({ message: "One or more products not found", missingIds });
    }

    const subtotal = orderSummary.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + (orderSummary.shipping || 0) + (parseFloat(orderSummary.taxes) || 0);

    const newOrder = new Order({
      user: userId,
      contactInformation,
      shippingInformation,
      paymentInformation: {
        method: paymentInformation.method || "Unknown",
      },
      orderSummary: {
        ...orderSummary,
        items: orderSummary.items.map(item => ({
          product: item.product,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          giftWrapping: item.giftWrapping || false,
        })),
        subtotal,
        total,
      },
    });

    await newOrder.save();

    
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create order",
      details: error.message,
    });
  }
};


export const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body; // Amount in rupees
  try {
    const options = {
      amount: amount , // Convert to smallest currency unit (e.g., paisa for INR)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(201).json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};




export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get orders', details: error.message });
    }
}


export const getSingleOrders = async (req, res) => {
  try {
    // Extract orderId from URL parameters
    const { id } = req.params;

    // Validate the orderId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Find the order by id
    const order = await Order.findById(id);

    // If the order is not found, return an error
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send the order details as response
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// Controller to update order status
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params; // Extract the orderId from the URL params
  const { status } = req.body;    // Extract the new status from the request body

  // Validate that the status is one of the allowed statuses
  const allowedStatuses = ['Pending', 'In Transit', 'Delivered'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    // Find the order by ID and update its status
    const order = await Order.findByIdAndUpdate(
      id,
      { status }, // Update the status field
      { new: true } // Return the updated order
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Respond with the updated order data
    return res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating order status' });
  }
};


export const deleteOrder = async (req, res) => {
  const { id } = req.params; // Extract orderId from URL params

  try {
    // Validate orderId format (optional but recommended)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Order ID format' });
    }

    // Try to find and delete the order
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order deleted successfully', order: deletedOrder });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}