import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  filters: {
    type: Array,
    required: true,
  },
  image: {
    type: String, // URL to the business image
    required: true,
  },
});

export default mongoose.model("categories", categorySchema);
