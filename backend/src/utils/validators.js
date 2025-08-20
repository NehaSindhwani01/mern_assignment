export const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
// +<country><number> e.g. +91XXXXXXXXXX (8–15 total digits after +)
export const isValidE164 = (phone) => /^\+[1-9]\d{7,14}$/.test(phone);