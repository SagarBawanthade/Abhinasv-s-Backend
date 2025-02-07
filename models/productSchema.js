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
      enum: ["Hoodies", "Tshirt", "Oversize-Tshirt"], // Can expand to more categories later
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
      type: [String], // Array to support multiple sizes
      enum: ["S", "M", "L", "XL"],
      required: true,
    },
    color: {
      type: [String], // Array to support multiple colors
      required: true, 
    },
    images: {
      type: [String], // Store S3 URLs or image URLs
      required: true,
    },
    tags: {
      type: [String], // For search and categorization
      default: [],
    },
    details: {
      type: Map, // Key-value pairs for additional product details
      of: String,
      default: {
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
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

export default mongoose.model("Product", productSchema);
