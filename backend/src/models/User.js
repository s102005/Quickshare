import mongoose from 'mongoose';

/**
 * User Schema
 * Defines the structure of user documents in MongoDB.
 */
const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    // Unique email address used for login
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true, // Creates a unique index in MongoDB to prevent duplicate accounts
      lowercase: true, // Normalizes email to lowercase
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    // Encrypted password (hashed via bcrypt, NEVER store plain text!)
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    // Optional role for future extension (e.g. admin, premium, free)
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    // Automatically creates `createdAt` and `updatedAt` ISO timestamps
    timestamps: true,
  }
);

/**
 * Remove sensitive data like passwordHash whenever a User document is converted to JSON
 * This ensures we never accidentally send the hashed password back to the frontend client.
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

// Export the Mongoose model
const User = mongoose.model('User', userSchema);
export default User;
