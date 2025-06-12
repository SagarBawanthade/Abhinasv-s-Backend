import express from "express";
import Product from "../models/productSchema.js";
import { body, validationResult } from "express-validator"; // Optional for validation
import { configDotenv } from "dotenv";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
configDotenv();
import multer from "multer";

//AWS ConFIG
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


// Multer configuration to handle image uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export const ImageUpload = async (req, res) => {
  try {
    const files = req.files; // Handle multiple files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Array to store image URLs
    const imageUrls = [];

    // Upload each image to S3
    for (const file of files) {
      // Fix template literal syntax
      const fileKey = `products/${uuidv4()}_${file.originalname}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make images publicly accessible
      };

      const result = await s3.upload(uploadParams).promise();
      imageUrls.push(result.Location); // Store image URL
    }

    // Send back the image URLs
    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: "Failed to upload image: " + error.message });
  }
};

export const uploadMiddleware = upload.array('images', 10);



// GET: Fetch all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET: Fetch a single product by ID
export const getSingleProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id); // Find product by ID
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(product); // Send the product as a JSON response
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

// POST: Add a new product
export const addProduct = [
  // Validation middleware
  body("name").notEmpty().withMessage("Product name is required."),
  body("description").notEmpty().withMessage("Description is required."),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer."),
  body("size").isArray().withMessage("Size must be an array."),
  body("color").isArray().withMessage("Color must be an array of strings"),

  body("images").isArray().withMessage("Images must be an array."),

  // Handler to process the request after validation
  async (req, res) => {
    // Validate the incoming request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, gender, price, stock, size, color, images, tags, details } = req.body;

    try {
      // Create a new product based on the schema
      const newProduct = new Product({
        name,
        description,
        category,
        gender,
        price,
        stock,
        size,
        color,
        images,
        tags,
        details,
      });

      // Save the product to the database
      await newProduct.save();

      // Respond with success message
      res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
];

// PUT: Update a product by ID
export const updateProduct = [
    // Validation middleware (optional)
    body("name").optional().notEmpty().withMessage("Product name is required."),
    body("description").optional().notEmpty().withMessage("Description is required."),
    body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number."),
    body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer."),
    body("size").optional().isArray().withMessage("Size must be an array."),
    body("color").isArray().withMessage("Color must be an array of strings"),
 
    body("images").optional().isArray().withMessage("Images must be an array."),


  
    // Handler to process the request after validation
    async (req, res) => {
      // Validate the incoming request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { name, description, category, gender, price, stock, size, color, images, tags, details } = req.body;
  
      try {
        // Find the product by ID and update it with new data
        const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id,  // Product ID from request params
          { name, description, category, gender, price, stock, size, color, images, tags, details },
          { new: true }    // Return the updated product after saving
        );
  
        // If the product is not found, return a 404
        if (!updatedProduct) {
          return res.status(404).json({ message: "Product not found" });
        }
  
        // Respond with the updated product
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
      } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
      }
    }
  ];


// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
      // Check if the product exists
      const product = await Product.findById(id);

      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }

      // Delete the product
        // Delete the product
    await Product.deleteOne({ _id: id });

      res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Server error' });
  }
}



export const updateProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("productId", id);  
    const updateData = req.body;

    // Validate if productId exists
    const product = await Product.findById(id);
   
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Create a new details object with existing and updated values
    const updatedDetails = {
      ...product.details.toObject(), // Convert existing Map to plain object
      ...updateData
    };

    // Validate the required fields in details
    const requiredFields = [
      'material',
      'careInstructions',
      'origin',
      'shippingInfo',
      'fabric',
      'pattern',
      'neck',
      'sleeve',
      'styleCode',
      'occasion',
     
     
      'knitType',
      'suitableFor',
     
      'fabricCare',
      'netQuantity'
    ];

    const missingFields = requiredFields.filter(field => !updatedDetails[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Update the product with new details
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        details: updatedDetails,
        updatedAt: Date.now()
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    res.status(200).json({
      success: true,
      message: "Product details updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error updating product details:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product details",
      error: error.message
    });
  }
};



// export const getProductsByCategory = async (req, res) => {
//   try {
//       const { category } = req.params;
      
//       // Fetch products of the given category
//       const products = await Product.find({ category });
      
//       // Send response with count and products
//       res.status(200).json({
//           count: products.length,
//           products
//       });
//   } catch (error) {
//       res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

// New details to update
const newDetails = {
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
  suitableFor: "Western Wear, Sports",
  fabricCare: "Gentle Machine Wash, Do not bleach",
  netQuantity: "1"
};



export const getProductsByCategory =  async (req, res) => {
  try {
      const category = req.params.category;

      // Update all products matching the given category
      const result = await Product.updateMany(
          { category: category }, // Filter by category
          { $set: { details: newDetails } } // Update details
      );

      res.json({
          message: "Products updated successfully!",
          modifiedCount: result.modifiedCount
      });
  } catch (error) {
      console.error("Error updating products:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
}


export const updateProductsSize = async (req, res) => {
  try {
    // Update all products except the "Hoodies" category
    const result = await Product.updateMany(
      { category: { $ne: "Hoodies" } }, // Exclude "Hoodies"
      { $addToSet: { size: "XXL" } } // Add "XXL" only if not present
    );

    res.json({
      message: "Products updated successfully!",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error updating products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
