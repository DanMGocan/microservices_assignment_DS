// Import required modules
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Logger middleware for this router
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  
  // Store the original send method
  const originalSend = res.send;
  
  // Override the send method to log the response
  res.send = function(body) {
    const responseSize = body ? (typeof body === 'string' ? body.length : JSON.stringify(body).length) : 0;
    console.log(`[${timestamp}] Response: ${res.statusCode} (${responseSize} bytes)`);
    
    // Call the original send method
    return originalSend.apply(this, arguments);
  };
  
  next();
});

// Helper function to load product data
// This function reads the products from the JSON file and inserts them into the database
const loadProductData = async () => {
  try {
    // Check if the database is empty before loading data
    const count = await Product.countDocuments();
    
    // Only load data if the database is empty
    if (count === 0) {
      console.log('Loading products from products.json...');
      
      // First, clear the existing products
      await Product.deleteMany({});
      console.log('Cleared existing products from database');
      
      try {
        // Read the products from the JSON file
        const productsDataPath = path.join(__dirname, '../data/products.json');
        console.log('Reading products from:', productsDataPath);
        
        // Read the file as a string
        const fileContent = fs.readFileSync(productsDataPath, 'utf8');
        console.log('File content length:', fileContent.length);
        
        // Parse the JSON file
        const products = JSON.parse(fileContent);
        console.log(`Successfully parsed ${products.length} products`);
        
        // Load all products
        await Product.insertMany(products);
        console.log(`${products.length} products loaded successfully`);
      } catch (fileError) {
        console.error('Error processing products.json file:', fileError);
        console.error('Error details:', fileError.stack);
      }
    } else {
      const count = await Product.countDocuments();
      console.log(`Found ${count} products in database, skipping data load.`);
    }
  } catch (error) {
    console.error('Error loading product data:', error);
    console.error('Error details:', error.stack);
  }
};

// Load product data when the server starts
loadProductData();

// GET /api/products - Get all products
// This endpoint returns all products in the database
router.get('/', async (req, res) => {
  try {
    // Get sort parameter from query string
    const { sort } = req.query;
    
    // Determine sort order
    let sortOption = { id: 1 }; // Default sort by id ascending
    
    if (sort === 'price_asc') {
      sortOption = { price: 1 }; // Sort by price ascending
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 }; // Sort by price descending
    }
    
    // Get all products from the database with the specified sort order
    const products = await Product.find().sort(sortOption);
    res.json(products);
  } catch (error) {
    // If there's an error, return a 500 status code and the error message
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products - Create a new product
// This endpoint creates a new product with the data provided in the request body
router.post('/', async (req, res) => {
  try {
    console.log('Received product data:', req.body);
    
    // Validate required fields
    if (!req.body.title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (req.body.price === undefined || req.body.price === null) {
      return res.status(400).json({ message: 'Price is required' });
    }
    
    // Generate a new ID (robust implementation)
    let nextId = '';
    try {
      // Find the highest ID in the database
      const products = await Product.find({}, { id: 1 }).sort({ id: -1 });
      
      // Log all product IDs for debugging
      console.log('Current product IDs:', products.map(p => p.id).slice(0, 10));
      
      // Find the maximum ID value
      let maxId = 0;
      for (const product of products) {
        const idNum = parseInt(product.id);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      }
      
      // Generate a new ID that is higher than the maximum
      nextId = (maxId + 1).toString();
      
      console.log('Generated ID:', nextId);
      
      // Verify the ID doesn't already exist
      const existingProduct = await Product.findOne({ id: nextId });
      if (existingProduct) {
        // If the ID already exists, generate a random ID
        nextId = Date.now().toString();
        console.log('ID already exists, using timestamp instead:', nextId);
      }
    } catch (idError) {
      console.error('Error generating ID:', idError);
      // Use timestamp as fallback
      nextId = Date.now().toString();
      console.log('Using timestamp as ID:', nextId);
    }
    
    // Create a new product with the data from the request body
    const product = new Product({
      id: nextId,
      title: req.body.title,
      description: req.body.description || '',
      brand: req.body.brand || '',
      price: parseFloat(req.body.price) || 0
    });
    
    console.log('Creating product:', product);
    
    // Save the new product to the database
    const newProduct = await product.save();
    
    console.log('Product created successfully:', newProduct);
    
    // Return the new product with a 201 status code (Created)
    res.status(201).json(newProduct);
  } catch (error) {
    // Log the error details
    console.error('Error creating product:', error);
    
    // If there's an error, return a 400 status code and the error message
    res.status(400).json({ message: error.message });
  }
});

// GET /api/products/search/query - Search for products
// This endpoint searches for products that match the query parameters
router.get('/search/query', async (req, res) => {
  try {
    // Get the search parameters from the query string
    const { term, minPrice, maxPrice, brand } = req.query;
    
    // Build the search query
    const query = {};
    
    // If a search term is provided, search in title and description
    if (term) {
      query.$or = [
        { title: { $regex: term, $options: 'i' } }, // Case-insensitive search in title
        { description: { $regex: term, $options: 'i' } } // Case-insensitive search in description
      ];
    }
    
    // If a brand is provided, filter by brand
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }
    
    // If price range is provided, filter by price
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Get sort parameter from query string
    const { sort } = req.query;
    
    // Determine sort order
    let sortOption = { id: 1 }; // Default sort by id ascending
    
    if (sort === 'price_asc') {
      sortOption = { price: 1 }; // Sort by price ascending
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 }; // Sort by price descending
    }
    
    // Find products that match the query with the specified sort order
    const products = await Product.find(query).sort(sortOption);
    
    // Return the matching products
    res.json(products);
  } catch (error) {
    // If there's an error, return a 500 status code and the error message
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/brands/all - Get all unique brands
// This endpoint returns all unique brands from the products
router.get('/brands/all', async (req, res) => {
  try {
    // Get all unique brands
    const brands = await Product.distinct('brand');
    
    // Filter out empty brands
    const filteredBrands = brands.filter(brand => brand && brand.trim() !== '');
    
    // Return the brands
    res.json(filteredBrands);
  } catch (error) {
    // If there's an error, return a 500 status code and the error message
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id - Get a specific product by ID
// This endpoint returns a single product with the specified ID
router.get('/:id', async (req, res) => {
  try {
    // Find the product with the specified ID
    const product = await Product.findOne({ id: req.params.id });
    
    // If the product doesn't exist, return a 404 status code
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Return the product
    res.json(product);
  } catch (error) {
    // If there's an error, return a 500 status code and the error message
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/products/:id - Update a product
// This endpoint updates an existing product with the data provided in the request body
router.put('/:id', async (req, res) => {
  try {
    // Find the product with the specified ID
    const product = await Product.findOne({ id: req.params.id });
    
    // If the product doesn't exist, return a 404 status code
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update the product with the data from the request body
    if (req.body.title) product.title = req.body.title;
    if (req.body.description) product.description = req.body.description;
    if (req.body.brand) product.brand = req.body.brand;
    if (req.body.price) product.price = req.body.price;
    
    // Save the updated product to the database
    const updatedProduct = await product.save();
    
    // Return the updated product
    res.json(updatedProduct);
  } catch (error) {
    // If there's an error, return a 400 status code and the error message
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/products/:id - Delete a product
// This endpoint deletes the product with the specified ID
router.delete('/:id', async (req, res) => {
  try {
    // Find and delete the product with the specified ID
    const product = await Product.findOneAndDelete({ id: req.params.id });
    
    // If the product doesn't exist, return a 404 status code
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Return a success message
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    // If there's an error, return a 500 status code and the error message
    res.status(500).json({ message: error.message });
  }
});

// Export the router
module.exports = router;
