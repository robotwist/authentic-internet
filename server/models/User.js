import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true, // ✅ This already creates an index
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/pixel-art/svg?seed=unknown", // ✅ Default pixel avatar
    },
  },
  { timestamps: true }
);

// ✅ Remove duplicate index declaration (this is unnecessary)
// UserSchema.index({ username: 1 }); ❌ REMOVE THIS LINE

// ✅ Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare entered password with stored hash
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
