import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import CustomStyleRequest from '../models/customStyleRequestSchema.js';

// AWS S3 Config
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Multer memory storage - SINGLE FILE UPLOAD
const storage = multer.memoryStorage();
export const customUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
}).single('image'); // 🔥 SINGLE FILE with field name 'image'

export const submitCustomStyleRequest = async (req, res) => {
  try {
    const file = req.file; // Single file, not files array
   const {
  firstName,
  email,
  userId,
  productName,
  selectedColor,
  productImages,
  productPrice,
  selectedSize
} = req.body;

   

    // Validation
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Use provided name/email with fallbacks
    const requestName = firstName || 'Anonymous User';
    const requestEmail = email || 'no-email@provided.com';

    // Upload single file to S3
    const fileKey = `custom-style-requests/${uuidv4()}_${Date.now()}_${file.originalname}`;
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    let imageUrl;
    try {
      const result = await s3.upload(uploadParams).promise();
      imageUrl = result.Location;
     
    } catch (uploadError) {
      console.error('S3 Upload Error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image to S3: ' + uploadError.message });
    }

    // Save the request to database
const request = new CustomStyleRequest({
  firstName: requestName,
  email: requestEmail,
  userId,
  imageUrls: [imageUrl],
  selectedColor,
  selectedSize,
  product: {
    name: productName,
    images: JSON.parse(productImages), // assuming it's stringified array
    price: Number(productPrice),
  }
});

    const savedRequest = await request.save();
    // console.log('Request saved to DB:', savedRequest._id);
res.status(201).json({ 
  message: 'Custom style request submitted successfully', 
  request: {
    id: savedRequest._id,
    firstName: savedRequest.firstName,
    email: savedRequest.email,
    userId: savedRequest.userId,
    imageUrls: savedRequest.imageUrls,
    selectedColor: savedRequest.selectedColor,
    selectedSize: savedRequest.selectedSize,
    product: savedRequest.product,
    submittedAt: savedRequest.submittedAt,
    createdAt: savedRequest.createdAt
  }
});


  } catch (err) {
   
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error: ' + err.message });
    }
    
    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    res.status(500).json({ error: 'Failed to submit request: ' + err.message });
  }
};



// Get all custom style requests (for admin panel)
export const getAllCustomStyleRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch requests with pagination and populate user data
    const requests = await CustomStyleRequest.find(filter)
      .populate('userId', 'name email') // Populate user details
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalRequests = await CustomStyleRequest.countDocuments(filter);
    const totalPages = Math.ceil(totalRequests / parseInt(limit));

    console.log(`Fetched ${requests.length} custom style requests`);

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRequests,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (err) {
    console.error('Fetch All Requests Error:', err);
    res.status(500).json({ error: 'Failed to fetch requests: ' + err.message });
  }
};

// Get custom style requests by user ID
export const getUserCustomStyleRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const requests = await CustomStyleRequest.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    console.log(`Fetched ${requests.length} requests for user ${userId}`);

    res.status(200).json({
      success: true,
      requests
    });

  } catch (err) {
    console.error('Fetch User Requests Error:', err);
    res.status(500).json({ error: 'Failed to fetch user requests: ' + err.message });
  }
};

// Update request status (approve/reject)
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNote } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedRequest = await CustomStyleRequest.findByIdAndUpdate(
      requestId,
      { 
        status,
        adminNote: adminNote || undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`Updated request ${requestId} status to ${status}`);

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}`,
      request: updatedRequest
    });

  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ error: 'Failed to update request status: ' + err.message });
  }
};

// Delete a request
export const deleteCustomStyleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const deletedRequest = await CustomStyleRequest.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Optionally delete image from S3
    if (deletedRequest.imageUrls && deletedRequest.imageUrls.length > 0) {
      try {
        for (const imageUrl of deletedRequest.imageUrls) {
          const key = imageUrl.split('/').pop(); // Extract key from URL
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `custom-style-requests/${key}`
          }).promise();
        }
      } catch (s3Error) {
        console.error('S3 Delete Error:', s3Error);
        // Don't fail the request if S3 deletion fails
      }
    }

    console.log(`Deleted request ${requestId}`);

    res.status(200).json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (err) {
    console.error('Delete Request Error:', err);
    res.status(500).json({ error: 'Failed to delete request: ' + err.message });
  }
};