import mongoose from "mongoose";

const { Schema } = mongoose;
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  role: {
    type: Number,
    default: 0,
  },
  totalTempleCreated: {
    type: Number,
    default: 0,
    required: false,
  },

  createdOn: {
    type: Date,
    default: Date.now,
  },
  avatar: {
    type: String,
    required: false,
  },
});
export default mongoose.model("User", userSchema);
