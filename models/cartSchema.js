import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    giftWrapping: {
      type: Boolean,
      default: false, // Default is no gift wrapping
    },
    price: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
    },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to update total price
cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce((total, item) => {
    const itemTotal = item.quantity * item.price;
    const giftWrappingCost = item.giftWrapping ? 30 : 0;
    return total + itemTotal + giftWrappingCost;
  }, 0);
  next();
});

export default mongoose.model("Cart", cartSchema);
