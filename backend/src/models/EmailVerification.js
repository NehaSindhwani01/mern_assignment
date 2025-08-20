// models/EmailVerification.js
import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        otp: { type: String, required: true },
        is_verified: { type: Boolean, default: false },
        created_at: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.model("EmailVerification", emailVerificationSchema);
