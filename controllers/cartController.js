import mongoose from "mongoose";
import Cart from "../models/cartSchema.js";
import Product from "../models/productSchema.js";

export const addToCart = async (req, res) => {
  const { product: productId, quantity, color, size, giftWrapping } = req.body;

  // Ensure no missing fields and validate properly
  if (!productId || !quantity  || !size) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Fetch product details from the database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find or create the user's cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Define gift wrapping cost
    const giftWrappingCost = giftWrapping ? 30 : 0;

    // Check if product already exists in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItemIndex >= 0) {
      // Update the existing item
      const existingItem = cart.items[existingItemIndex];
      existingItem.quantity += quantity;
      existingItem.giftWrapping = giftWrapping;
      existingItem.totalPrice =
        (existingItem.price + giftWrappingCost) * existingItem.quantity;
    } else {
      // Add a new item to the cart
      const newItem = {
        product: productId,
        quantity,
        size,
        color: product.color && product.color.length > 0 ? color : "",
        giftWrapping,
        price: product.price,
        name: product.name,
        images: product.images,
        totalPrice: (product.price + giftWrappingCost) * quantity,
      };
      cart.items.push(newItem);
    }

    // Save the updated cart
    await cart.save();

    return res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// // Get all cart items for a specific user
// export const getCartItems = async (req, res) => {
//   const { userId } = req.params; // assuming userId is passed as a parameter

//   try {
//     // Find the cart for the user
//     const cart = await Cart.findOne({ user: userId }).populate('items.product'); // Populating product details

//     if (!cart) {
//       return res.status(404).json({ error: "Cart not found for this user" });
//     }

//     // Return the cart items along with product details
//     res.status(200).json({ cart });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };




export const getCartItems = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find and populate the cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      return res.status(404).json({ error: "Cart not found for this user" });
    }

    // Filter for T-shirts and check eligibility
    const tshirtItems = cart.items.filter(item =>
      item.product && item.product.category === "Tshirt" && item.quantity === 1
    );

    // Check if there are exactly 3 T-shirts with quantity 1
    const isEligibleForOffer = tshirtItems.length === 3;

    // Calculate prices
    let totalPrice = 0;
    if (isEligibleForOffer) {
      // Apply special offer price for the 3 T-shirts
      totalPrice = 1299;

      // Add prices of non-T-shirt items if any
      const nonTshirtItems = cart.items.filter(item =>
        item.product && item.product.category !== "Tshirt"
      );

      const nonTshirtTotal = nonTshirtItems.reduce((sum, item) =>
        sum + (item.product.price * item.quantity), 0
      );

      totalPrice += nonTshirtTotal;
    } else {
      // Regular price calculation if not eligible
      const validItems = cart.items.filter(item => item.product); // filter out null products
      totalPrice = validItems.reduce((sum, item) =>
        sum + (item.product.price * item.quantity), 0
      );
    }

    // Update cart with new total
    cart.totalPrice = totalPrice;
    await cart.save();

    // Additional offer details for frontend
    const offerDetails = {
      isEligibleForOffer,
      tshirtCount: tshirtItems.length,
      remainingForOffer: Math.max(0, 3 - tshirtItems.length),
      savings: isEligibleForOffer ?
        (tshirtItems.reduce((sum, item) => sum + item.product.price, 0) - 1299) : 0
    };

    res.status(200).json({
      cart,
      offerDetails
    });

  } catch (error) {
    console.error('Error in getCartItems:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




export const syncCart = async (req, res) => {
  const { userId, items } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: 'Cart items must be an array' });
  }

  try {
    // Find existing cart
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      // If no cart exists, create new one
      cart = new Cart({ user: userId, items: [] });
    }

    for (const localItem of items) {
      // Normalize color value to string
      const normalizedColor = Array.isArray(localItem.color)
        ? localItem.color[0] || ''
        : localItem.color;

      // Check if item already exists in cart (product, size, color)
      const existingItemIndex = cart.items.findIndex(item =>
        item.product.toString() === localItem.product &&
        item.size === localItem.size &&
        item.color === normalizedColor
      );

      if (existingItemIndex !== -1) {
        // If item exists, update quantity
        cart.items[existingItemIndex].quantity += localItem.quantity;
      } else {
        // Add new item to cart
        cart.items.push({
          product: localItem.product,
          quantity: localItem.quantity,
          size: localItem.size,
          color: normalizedColor,
          price: localItem.price,
          name: localItem.name,
          images: localItem.images,
          giftWrapping: localItem.giftWrapping || false
        });
      }
    }

    // Recalculate total price
    let totalPrice = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    cart.totalPrice = totalPrice;

    await cart.save();

    return res.status(200).json({
      message: 'Cart synced successfully',
      cart: cart
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    return res.status(500).json({ message: 'Error syncing cart' });
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


  export const removeItemFromCart = async (req, res) => {
    const { userId, productId } = req.params;
  
    try {
      let cart = await Cart.findOne({ user: userId });
      
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
  
      // Changed: Compare with item.product instead of item._id
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
        totalPrice += item.price * item.quantity; // Use item.price directly since it's stored in cart
      }
  
      cart.totalPrice = totalPrice;
      await cart.save();
  
      res.status(200).json({ message: "Item removed from cart", cart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };