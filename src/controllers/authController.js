const { User, Shop } = require("../models");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/authUtils");
const { sendEmail } = require("../utils/mailer");
const { generateOtpEmailTemplate } = require("../templates/otpEmailTemplate");

// @route POST /api/auth/register
const register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  if (role !== "customer" && role !== "partner") {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    // If partner, initialize an empty shop profile
    if (role === "partner") {
      await Shop.create({
        user_id: user.id,
        shop_name: `${name}'s Shop`,
        address: "Address not set",
      });
    }

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

// @route POST /api/auth/otp/send
const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please provide phone or email" });
  }

  // Generate a 4-digit OTP (for testing, we'll use a dynamic one or keep '1234')
  // Usually, you'd save this to a database/Redis linked to the user.
  const otp = "1234"; // Or Math.floor(1000 + Math.random() * 9000).toString();

  // Simple regex to check if it's an email
  const isEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

  if (isEmail) {
    try {
      const user = await User.findOne({ where: { email: email } });
      const name = user ? user.name : "User";

      const emailHtml = generateOtpEmailTemplate(name, otp);
      await sendEmail(email, "Your Laundry Verification Code", emailHtml);
      console.log(`[MAILER] Sent OTP email to ${email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      // We don't fail hard here for the sake of the tutorial,
      // but in production we might return a 500 error.
    }
  } else {
    // Simulated SMS OTP logic
    console.log(`[SIMULATION] Sending SMS OTP ${otp} to ${email}`);
  }

  res.json({ message: "OTP sent successfully" });
};

// @route POST /api/auth/otp/verify
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ error: "Please provide phone/email and OTP" });
  }

  // Simulated OTP verification
  if (otp !== "1234") {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  console.log(`[SIMULATION] OTP verified for ${email}`);
  res.json({ message: "OTP verified successfully" });
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
};
