import express from "express";
import { addProduct, deleteProduct, getAllProducts, getProductsByCategory, getSingleProduct, ImageUpload, updateProduct, updateProductDetails, updateProductsSize, uploadMiddleware } from "../controllers/productController.js";
const router = express.Router();
import multer from "multer";

router.get('/getproducts',  getAllProducts);
router.get('/getproduct/:id',  getSingleProduct);
router.post('/addproduct',  addProduct);
router.put('/updateproduct/:id',updateProduct);
router.delete('/deleteproduct/:id',deleteProduct);
router.put("/update-product-details/:id",updateProductDetails);

//for test
router.put('/products/category/:category', getProductsByCategory);
router.put("/products/update-sizes", updateProductsSize);




// // Multer middleware to handle multiple file uploads
// const upload = multer({ storage: multer.memoryStorage() });

// // Route to upload images
// router.post("/image-upload", upload.array("images", 5), ImageUpload);  // Max 5 images

router.post('/image-upload', uploadMiddleware, ImageUpload);



export default router;