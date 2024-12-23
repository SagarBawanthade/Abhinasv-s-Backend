import User from '../models/userSchema.js';
import { generateToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import path from 'path';

//Register
export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, role = "user" } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,  // Store the hashed password
      role,
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

//Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      //console.log(`Login failed: User with email ${email} not found`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // // Debug: Log the plain-text password and hashed password in DB
    // console.log(`Plain-text password: ${password}`);
    // console.log(`Hashed password in DB: ${user.password}`);

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      //console.log(`Login failed: Incorrect password for email ${email}`);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Respond with user details and token
    res.status(200).json({
      id: user._id,
      role: user.role,
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};


// Get all users
export const getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password } = req.body;

  try {
    let updateData = { firstName, lastName, email };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user', details: error.message });
  }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Logout
export const logoutUser = (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'Strict' });
  res.status(200).json({ message: 'Logged out successfully' });
};



// Reset Password API (Direct reset)
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Check if email and newPassword are provided
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Please provide an email and new password' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: 'Password has been successfully reset',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};