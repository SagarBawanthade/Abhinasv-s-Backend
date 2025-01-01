import mongoose from "mongoose";
import Cart from "../models/cartSchema.js";
import Product from "../models/productSchema.js";



export const addToCart = async (req, res) => {
  const { productId, quantity, color, size, giftWrapping } = req.body;

  if (!productId || !quantity || !color || !size) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find the user's cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // If the cart doesn't exist, create a new one
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    // Define gift wrapping cost
    const giftWrappingCost = giftWrapping ? 30 : 0;


    // Check if the product is already in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size && item.color === color
    );

    if (existingItemIndex >= 0) {
      // If the product exists in the cart, update its quantity and gift wrapping preference
      const existingItem = cart.items[existingItemIndex];
      existingItem.quantity += quantity;
      existingItem.giftWrapping = giftWrapping; // Update gift wrapping
      // You can also update the total price by adding gift wrapping cost for the product
      existingItem.totalPrice = (existingItem.price + giftWrappingCost) * existingItem.quantity;
    } else {
      // Add new item to cart
      const newItem = {
        product: productId,
        quantity,
        size,
        color,
        giftWrapping,
        price: product.price,
        name: product.name,
        images: product.images,
        totalPrice: (product.price + giftWrappingCost) * quantity, 
      };
      cart.items.push(newItem);
    }

    // Save the cart
    await cart.save();

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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
