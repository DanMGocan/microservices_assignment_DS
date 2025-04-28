############################################################################
# This scripts is being used to convert the .csv file with Home Depot data #
# into a .json file that can be used by the server, as requested by the    #
# assignment. It has no use past that and can be safely ignored. No Python #
# libraries need to be installed or this script ran.                       #
############################################################################

import csv
import json
import os

# Define input and output file paths
input_file = os.path.join('server', 'data', 'home_depot_data_1_2021_12.csv')
output_file = os.path.join('server', 'data', 'products.json')

# Array to store the transformed products
products = []

# Process the CSV file
print(f"Reading CSV file: {input_file}")
try:
    with open(input_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        row_count = 0
        for row in reader:
            # Extract only the required fields
            try:
                # Parse price, defaulting to 0 if there's an error
                try:
                    price = float(row['price'])
                except (ValueError, TypeError):
                    price = 0.0
                
                # Create a simplified product object
                product = {
                    "id": str(row_count + 1),  # Simple numeric ID
                    "title": row['title'] if row['title'] else "Unknown Product",
                    "description": row['description'] if row['description'] else "",
                    "brand": row['brand'] if row['brand'] else "",
                    "price": price
                }
                
                products.append(product)
                row_count += 1
                
                if row_count % 100 == 0:
                    print(f"Processed {row_count} rows...")
            except Exception as e:
                print(f"Error processing row {row_count}: {e}")
                continue
                
except Exception as e:
    print(f"Error reading CSV file: {e}")
    exit(1)

# Create output directory if it doesn't exist
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Write the products array to a JSON file
print(f"Writing {len(products)} products to {output_file}")
try:
    with open(output_file, 'w', encoding='utf-8') as jsonfile:
        json.dump(products, jsonfile, indent=2)
    print(f"Conversion complete! {len(products)} products written to {output_file}")
except Exception as e:
    print(f"Error writing JSON file: {e}")
    exit(1)
