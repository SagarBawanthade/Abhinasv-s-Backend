import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';

export const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get the token from the header

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); // Add user to request
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

