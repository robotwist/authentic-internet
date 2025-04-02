import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { PASSWORD_REQUIREMENTS } from "../utils/validation.js";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`],
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/pixel-art/svg?seed=unknown",
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Keeping friends system

    // 🔹 New Additions:
    experience: { type: Number, default: 0 }, // ✅ EXP Progress
    level: { type: Number, default: 1 }, // ✅ Level Progression
    inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artifact" }], // ✅ Artifacts Found
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], // ✅ Persistent Messages
    createdAt: { type: Date, default: Date.now }, // ✅ Keeps timestamps for history
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// 🔹 Hash Password Before Saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔹 Password Comparison Method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
