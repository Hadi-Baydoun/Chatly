import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Added index for better query performance
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Added index for better query performance
    },
    text: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Message must contain either text or image
          return v || this.image;
        },
        message: "Message must contain either text or image",
      },
    },
    image: {
      type: String,
      validate: {
        validator: function (v) {
          // Validate URL format if needed
          return !v || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: "Invalid image URL format",
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Compound indexes for better query performance
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ updatedAt: -1 });

// Virtual for message status
messageSchema.virtual("status").get(function () {
  if (this.read) return "read";
  if (this.delivered) return "delivered";
  return "sent";
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
