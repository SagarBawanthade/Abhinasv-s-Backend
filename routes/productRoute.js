import express from "express";
import { addProduct, deleteProduct, getAllProducts, getSingleProduct, ImageUpload, updateProduct } from "../controllers/productController.js";
const router = express.Router();
import multer from "multer";

router.get('/getproducts',  getAllProducts);
router.get('/getproduct/:id',  getSingleProduct);
router.post('/addproduct',  addProduct);
router.put('/updateproduct/:id',updateProduct);
router.delete('/deleteproduct/:id',deleteProduct);



// Multer middleware to handle multiple file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Route to upload images
router.post("/image-upload", upload.array("images", 5), ImageUpload);  // Max 5 images



export default router;