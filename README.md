# Product Catalog Microservice

This is a microservices-based product catalog application built with Node.js, Express, MongoDB, and AJAX. It allows users to manage a product catalog through a web interface. This is an assignment completed for the Distributed Systems
and Systems Integration course, under the TU082 programme, under Technological University of Dublin. 

## Features
- View all products in the catalog
- Add new products to the catalog
- Update existing products
- Delete products from the catalog
- Search for products by title, description, brand, and price range
- Pagination for product listing

## Prerequisites
Before running this application, you need to have the following installed:

- Node.js
- MongoDB Community Edition
- The documentation assumes that this application will be tested into a Windows environment. Not optimized for any other operating systems. 

### Installing Node.js
1. Download and install Node.js from [nodejs.org](https://nodejs.org/)

### Installing MongoDB
1. Download the MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard


## Installation
1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```

## Data Structure
The application uses a simplified product catalog with the following fields:
- title
- description
- brand
- price (in USD)

The original data is stored in a .csv file inside the server/data folder. 
Original data converted to .json format by running the convert_csv_to_json.py script. 
Data comes already converted into .json, no user input required. 


## Running the Application
1. Make sure MongoDB is running
2. Start the application:
   ```
   npm start
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## API Endpoints
The application provides the following RESTful API endpoints:

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/products/search/query` - Search for products with query parameters:
  - `term` - Search term for title and description
  - `brand` - Filter by brand
  - `minPrice` - Filter by minimum price
  - `maxPrice` - Filter by maximum price
- `GET /api/products/brands/all` - Get all unique brands

## License
This project is for educational purposes only.
