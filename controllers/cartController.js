import mongoose from "mongoose";
import Cart from "../models/cartSchema.js";
import Product from "../models/productSchema.js";



export const addToCart = async (req, res) => {
  try {
    const { userId, productId, items } = req.body;

    // Find or create the cart for the user
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create a new cart if one does not exist for the user
      cart = new Cart({ user: userId, items: [] }); // Initialize items as an empty array
    }

    // Ensure the items array is not undefined
    if (!cart.items) {
      cart.items = []; // Make sure items is an empty array if it's undefined
    }

    // Add or update the products in the cart
    items.forEach((item) => {
      const existingProductIndex = cart.items.findIndex(
        (product) =>
          product.product.toString() === item.id && // Compare product ID correctly
          product.size === item.size && 
          product.color === item.color
      );

      if (existingProductIndex >= 0) {
        // Update the quantity of the existing product if already in the cart
        cart.items[existingProductIndex].quantity += item.quantity;
      } else {
        // Add the new product if it does not already exist in the cart
        cart.items.push({
          product: item.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
          title: item.title,
          price: item.price,
        });
      }
    });

    // Recalculate total price (optional based on your logic)
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Product added to cart successfully",
      cart: cart.items, // Return the updated cart items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add product to cart" });
  }
};


// Get all cart items for a specific user
export const getCartItems = async (req, res) => {
  const { userId } = req.params; // assuming userId is passed as a parameter

  try {
    // Find the cart for the user
    const cart = await Cart.findOne({ user: userId }).populate('items.product'); // Populating product details

    if (!cart) {
      return res.status(404).json({ error: "Cart not found for this user" });
    }

    // Return the cart items along with product details
    res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





// Remove item from cart
export const removeItemFromCart = async (req, res) => {
    const { userId, productId } = req.body;
  
    try {
      // Find the user's cart
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
  
      // Find the product index in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex === -1) {
        return res.status(404).json({ error: "Product not found in cart" });
      }
  
      // Remove the product from the cart
      cart.items.splice(itemIndex, 1);
  
      // Recalculate total price
      let totalPrice = 0;
      for (const item of cart.items) {
        const product = await Product.findById(item.product);
        if (product) {
          totalPrice += product.price * item.quantity;
        }
      }
  
      // Update the cart's total price
      cart.totalPrice = totalPrice;
  
      // Save the updated cart
      await cart.save();
  
      res.status(200).json({ message: "Item removed from cart", cart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  


export const updateCartItem =  async (req, res) => {
    const { userId, productId, quantity } = req.body;
  
    try {
      let cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
      // Find the product in the cart and update its quantity
      const productIndex = cart.items.findIndex(item => item.product.toString() === productId);
  
      if (productIndex === -1) {
        return res.status(404).json({ message: "Product not found in cart" });
      }
  
      cart.items[productIndex].quantity = quantity;
  
      // Save the updated cart
      await cart.save();
  
      // Return success response
      res.status(200).json({ message: "Cart updated successfully", quantity: quantity });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
