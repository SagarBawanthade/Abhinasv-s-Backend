import crypto from "crypto";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    if (!razorpay_payment_id) {
      return res.status(400).json({ message: "Missing payment ID" });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    // Check if the payment was made using UPI (either Intent or UPI ID)
    if (payment.method === "upi") {
      if (payment.status === "captured") {
        return res.status(200).json({ message: "UPI Payment verified successfully" });
      } else {
        return res.status(400).json({ message: "UPI Payment verification failed" });
      }
    }

    // If it's not a UPI payment, verify using signature
    if (!razorpay_signature) {
      return res.status(400).json({ message: "Signature is missing for non-UPI payments" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};
