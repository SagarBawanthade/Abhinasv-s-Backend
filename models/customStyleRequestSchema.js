// models/customStyleRequestSchema.js
import mongoose from 'mongoose';

const customStyleRequestSchema = new mongoose.Schema({
  imageUrls: {
    type: [String], // Array of strings to store image URLs
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0; // At least one image URL required
      },
      message: 'At least one image URL is required'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model("CustomStyleRequest", customStyleRequestSchema);