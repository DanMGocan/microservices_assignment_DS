// Import mongoose for MongoDB schema creation
const mongoose = require('mongoose');

// Define the product schema
// This schema defines the structure of the documents in the products collection
const productSchema = new mongoose.Schema({
  // Product ID (unique identifier)
  id: {
    type: String,
    required: true,
    unique: true
  },
  // Product title
  title: {
    type: String,
    required: true,
    trim: true // Removes whitespace from both ends of the string
  },
  // Product description
  description: {
    type: String,
    required: false,
    trim: true
  },
  // Product brand
  brand: {
    type: String,
    required: false,
    trim: true
  },
  // Product price
  price: {
    type: Number,
    required: true,
    min: 0 // Price cannot be negative
  },
  // Timestamp for when the product was created
  createdAt: {
    type: Date,
    default: Date.now // Automatically set to current date/time when a product is created
  }
});

// Create and export the Product model
// This model will be used to interact with the 'products' collection in MongoDB
module.exports = mongoose.model('Product', productSchema);
