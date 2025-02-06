import express from "express";
import Order from "../models/orderSchema.js";
import Product from "../models/productSchema.js";
import User from "../models/userSchema.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";



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


// emailTemplate.js
const createEmailTemplate = (orderData) => {
  const {_id, user, contactInformation, shippingInformation, paymentInformation, orderSummary , status, orderDate} = orderData;
  
  return `<!DOCTYPE html>
<html>
<head>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; padding: 14px;">
            <img src="https://abhinavs-storage-09.s3.ap-south-1.amazonaws.com/products/IMG_0823.JPG" alt="Company Logo" style="max-width: 100px;">
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(43, 37, 37, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <i class="fas fa-check-circle" style="color: #28a745; font-size: 48px;"></i>
                <h2 style="color: #28a745; margin: 10px 0;">Order Confirmed!</h2>
            </div>

            <p style="font-size: 16px; line-height: 1.5;">
                Thank you for your order, <b>${shippingInformation.firstName} ${shippingInformation.lastName}</b>!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><i class="fas fa-hashtag" style="color: #007BFF; width: 20px;"></i> <b>Order ID:</b> ${_id}</p>
              
            </div>

            <div style="margin: 25px 0;">
                <h3 style="color: #007BFF; border-bottom: 1px solid #007BFF; padding-bottom: 2px;">
                    <i class="fas fa-address-card"></i> Contact Information
                </h3>
                <p><i class="fas fa-envelope" style="color: #666; width: 20px;"></i> ${contactInformation.email}</p>
                <p><i class="fas fa-phone" style="color: #666; width: 20px;"></i> ${contactInformation.phone}</p>
            </div>

            <div style="margin: 25px 0;">
                <h3 style="color: #007BFF; border-bottom: 1px solid #007BFF; padding-bottom: 2px;">
                    <i class="fas fa-shipping-fast"></i> Shipping Information
                </h3>
                <p><b>${shippingInformation.firstName} ${shippingInformation.lastName}</b></p>
                <p>${shippingInformation.company}</p>
                <p>${shippingInformation.address}, ${shippingInformation.apartment}</p>
                <p>${shippingInformation.city}, ${shippingInformation.state} ${shippingInformation.postalCode}</p>
                <p>${shippingInformation.country}</p>
            </div>

            <div style="margin: 25px 0;">
                <h3 style="color: #007BFF; border-bottom: 1px solid #007BFF; padding-bottom: 2px;">
                    <i class="fas fa-credit-card"></i> Payment Method
                </h3>
                <p>${paymentInformation.method}</p>
            </div>

            <div style="margin: 25px 0;">
                <h3 style="color: #007BFF; border-bottom: 1px solid #007BFF; padding-bottom: 2px;">
                    <i class="fas fa-shopping-cart"></i> Order Summary
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderSummary.items.map(item => `
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${item.productName}</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${item.price}</td>
                                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${item.price * item.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; text-align: right;">
                    <p style="font-size: 18px; margin: 0;">
                        <b>Total: ₹${orderSummary.total}</b>
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin: 25px 0;">
                <p style="font-size: 16px;">
                    <b>Status: </b>
                    <span style="background-color: #28a745; color: white; padding: 5px 15px; border-radius: 20px;">
                        <i class="fas fa-check"></i> ${status}
                    </span>
                </p>
                <p style="color: #666;">
                    <i class="fas fa-calendar"></i> 
                    Order Date: ${new Date(orderDate).toLocaleString()}
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #666;">Thank you for shopping with us!</p>
                <div style="margin-top: 15px;">
                    <a href="#" style="margin: 0 10px; color: #007BFF;"><i class="fab fa-facebook"></i></a>
                    <a href="#" style="margin: 0 10px; color: #007BFF;"><i class="fab fa-twitter"></i></a>
                    <a href="#" style="margin: 0 10px; color: #007BFF;"><i class="fab fa-instagram"></i></a>
                </div>
            </div>

            <h3 style="color:rgb(0, 0, 0);padding-bottom: 2px;">Abhinav's Best of World</h3>
        </div>
    </div>
</body>
</html>`;
};




export const sendOrderEmail = async (req, res) => {
  const { _id, user, contactInformation, shippingInformation, paymentInformation, orderSummary, status, orderDate } = req.body.data.order;


  
 


  if (!contactInformation || !shippingInformation || !_id) {
    return res.status(400).json({ error: "Missing required order details" });
  }

  const userEmail = process.env.GMAIL_USER;
  const password = process.env.GMAIL_PASSWORD;

 

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: userEmail,
        pass: password,
      },
      
    });
    

    
    const orderData = {
      _id,
      user,
      contactInformation,
      shippingInformation,
      paymentInformation,
      orderSummary,
      status,
      orderDate,

    };
    

    const mailOptions = {
      from: userEmail,
      to: contactInformation.email,
      subject: `Abhinav's Order Confirmation - Order ID: ${_id}`,
      html: createEmailTemplate(orderData),
    };

   
    await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent successfully!");


    res.status(200).json({ message: "Order confirmation email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send order confirmation email." });
  }
};


