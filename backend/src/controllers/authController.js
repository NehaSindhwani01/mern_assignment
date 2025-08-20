import EmailVerification from "../models/EmailVerification.js";
import User from "../models/User.js";
import sendMail from "../utils/mailer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "❌ Email already registered! Please login instead." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await EmailVerification.findOneAndUpdate(
      { email },
      { otp, is_verified: false, created_at: new Date() },
      { upsert: true, new: true }
    );

    await sendMail({
      to: email,
      subject: "📧 Verify Your Email - Machine Test",
      html: `<h2>Your OTP: ${otp}</h2><p>Valid for 10 minutes.</p>`
    });

    res.json({ message: "✅ Verification code sent!" });
  } catch (err) {
    console.error("[sendOTP]", err);
    res.status(500).json({ error: "Failed to send verification code." });
  }
};


export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const record = await EmailVerification.findOne({
      email,
      otp,
      created_at: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // last 10 min
    });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired code!" });
    }

    record.is_verified = true;
    await record.save();

    res.json({ message: "✅ Email verified successfully!" });
  } catch (err) {
    console.error("[verifyOTP]", err);
    res.status(500).json({ error: "Verification failed." });
  }
};


export const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const verification = await EmailVerification.findOne({ email, is_verified: true });
    if (!verification) {
      return res.status(400).json({ error: "Please verify your email first." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered!" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // role defaults to "admin" from schema
    const user = await User.create({ email, password: hashed });
    const { _id, role } = user;   // ✅ no shadowing

    await EmailVerification.deleteOne({ email });

    res.status(201).json({
      message: "🎉 Registration successful!",
      user: { _id, email, role }  // ✅ using email from req.body
    });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ error: "Registration failed." });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { _id, role } = user;

    res.json({ message: "✅ Login successful!", token,  user: { _id, email, role }});
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Login failed." });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "❌ Email not found." });
    }

    const resetCode = generateOTP();

    await EmailVerification.findOneAndUpdate(
      { email },
      { otp: resetCode, is_verified: false, created_at: new Date() },
      { upsert: true, new: true }
    );

    await sendMail({
      to: email,
      subject: "🔐 Reset Your Password - Machine Test",
      html: `
        <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background-color:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0;">
          <h1 style="text-align:center;">🔐 Password Reset Request</h1>
          <p>Use this code to reset your password:</p>
          <div style="text-align:center;padding:20px;background:#e8f5e8;border:2px solid #4CAF50;border-radius:8px;">
            <h2 style="letter-spacing:8px;">${resetCode}</h2>
          </div>
          <p>This code is valid for 10 minutes.</p>
        </div>`
    });

    res.json({ message: "✅ Reset code sent! Check your email." });
  } catch (err) {
    console.error("[forgotPassword]", err);
    res.status(500).json({ error: "Failed to send reset code." });
  }
};


export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const record = await EmailVerification.findOne({
      email,
      otp,
      created_at: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // valid for 10 min
    });

    if (!record) {
      return res.status(400).json({ error: "❌ Invalid or expired code!" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashed });
    await EmailVerification.deleteOne({ email });

    await sendMail({
      to: email,
      subject: "✅ Password Successfully Reset - Machine Test",
      html: `
        <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background-color:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0;">
          <h1 style="text-align:center;">✅ Password Reset Successful</h1>
          <p>Your password has been reset successfully. You can now log in with your new password.</p>
        </div>`
    });

    res.json({ message: "🎉 Password reset successful!" });
  } catch (err) {
    console.error("[resetPassword]", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
};
