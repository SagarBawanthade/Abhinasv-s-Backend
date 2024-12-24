import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  contactInformation: {
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  shippingInformation: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: { type: String, default: 'none' },
    address: { type: String, required: true },
    apartment: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentInformation: {
    method: { type: String, enum: ['on', 'Razorpay'], required: true },
    
  },
  orderSummary: {
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
      productName: { type: String, required: true },
      productImage: { type: [String], required: true },
      
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      size: { type: String }
    }],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    taxes: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  orderDate: { type: Date, default: Date.now }
});

export default mongoose.model('Order', OrderSchema);
