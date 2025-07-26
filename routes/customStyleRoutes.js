// routes/customStyleRoutes.js
import express from 'express';
import { 
  submitCustomStyleRequest, 
  customUpload,
  getAllCustomStyleRequests,
  getUserCustomStyleRequests,
  updateRequestStatus,
  deleteCustomStyleRequest
} from '../controllers/customStyleController.js';

const router = express.Router();

// Submit new custom style request
router.post('/submit', customUpload, submitCustomStyleRequest);

// Get all requests (admin panel)
router.get('/all', getAllCustomStyleRequests);

// Get requests by user ID
router.get('/user/:userId', getUserCustomStyleRequests);

// Update request status
router.put('/status/:requestId', updateRequestStatus);

// Delete request
router.delete('/:requestId', deleteCustomStyleRequest);

export default router;