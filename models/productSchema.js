import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Hoodies", "Tshirt", "Oversize-Tshirt", "Couple-Tshirt","Polo-Tshirt","Plain-Tshirt"],
      default: "Hoodies",
    },
    gender: {
      type: String,
      enum: ["Unisex", "Male", "Female"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      validate(value) {
        if (value < 0) throw new Error("Price cannot be negative.");
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    size: {
      type: [String],
      enum: ["S", "M", "L", "XL", "XXL"],
      required: true,
    },
    color: {
      type: [String],
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    details: {
      type: Map,
      of: String,
      default: {},
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

// Define category-specific details
const categoryDetails = {
  Hoodies: {
    material: "Cotton Fleece Blend",
    careInstructions: "Regular Machine Wash",
    origin: "Made in India",
    shippingInfo: "Ships within 3-5 business days.",
    fabric: "Cotton Fleece Blend",
    pattern: "Graphic Print",
    neck: "Hooded Neck",
    sleeve: "Full Sleeve",
    styleCode: "Red",
    occasion: "Casual",
    pockets: "Kangaroo pocket",
    hooded: "Yes",
    reversible: "No",
    knitType: "Fleece cotton blend",
    suitableFor: "Western Wear",
    secondaryColor: "Red",
    fabricCare: "Regular Machine Wash",
    netQuantity: "1"
  },
  "Tshirt": {
    material: "Platinum Soft Cotton",
    careInstructions: "Machine wash cold, tumble dry low",
    origin: "Made in India",
    shippingInfo: "Express shipping available 3 - 5 business days",
    fabric: "Platinum Soft Cotton",
    pattern: "Solid with Graphic Print",
    neck: "Round Neck",
    sleeve: "Half Sleeve",
    styleCode: "OS-1",
    occasion: "Casual, Sports",
    knitType: "Platinum Soft Cotton",
    suitableFor: "Western Wear, Sports",
    fabricCare: "Gentle Machine Wash, Do not bleach",
    netQuantity: "1"
  },
  "Couple-Tshirt": {
    material: "Platinum Soft Cotton",
    careInstructions: "Machine wash cold, tumble dry low",
    origin: "Made in India",
    shippingInfo: "Express shipping available 3 - 5 business days",
    fabric: "Platinum Soft Cotton",
    pattern: "Solid with Graphic Print",
    neck: "Round Neck",
    sleeve: "Half Sleeve",
    styleCode: "OS-1",
    occasion: "Casual, Sports",
    knitType: "Platinum Soft Cotton",
    suitableFor: "Western Wear, Sports",
    fabricCare: "Gentle Machine Wash, Do not bleach",
    netQuantity: "1"
  },
  "Oversize-Tshirt": {
    material: "Premium Soft Cotton",
    careInstructions: "Machine wash cold, tumble dry low",
    origin: "Made in India",
    shippingInfo: "Express shipping available 3 - 5 business days",
    fabric: "Premium Soft Cotton",
    pattern: "Solid with Graphic Print",
    neck: "Round Neck",
    sleeve: "Half Sleeve",
    styleCode: "OS-1",
    occasion: "Casual, Sports",
    knitType: "Premium Soft Cotton",
    suitableFor: "Western Wear, Sports, Casual Outings",
    fabricCare: "Gentle Machine Wash, Do not bleach",
    netQuantity: "1"
  }
};

// Pre-save middleware to set details based on category
productSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('category')) {
    const categorySpecificDetails = categoryDetails[this.category];
    if (categorySpecificDetails) {
      this.details = new Map(Object.entries(categorySpecificDetails));
    }
  }
  next();
});

export default mongoose.model("Product", productSchema);