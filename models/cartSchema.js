import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference the Product model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  size: {
    type: String,
    required: true, // Store the size of the product in the cart
  },
  color: {
    type: String,
    required: true, // Store the color of the product in the cart
  },
  image: {
    type: String, // Store the image URL of the product
  },
  title: {
    type: String, // Store the title of the product
  },
  price: {
    type: Number, // Store the price of the product
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference the User model
      required: true,
    },
    items: [cartItemSchema], // Array of cart items
    totalPrice: {
      type: Number,
      default: 0, // Will be calculated dynamically
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Cart", cartSchema);
