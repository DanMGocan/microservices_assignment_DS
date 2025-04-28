/******************************************************************/
// Client JS, dictating the behavious of the user interface
/******************************************************************/

// Global variables
let products = []; // Array to store all products
let currentPage = 1; // Current page for pagination
const productsPerPage = 18; // Number of products to display per page (3x6 grid)
let brands = new Set(); // Set to store unique brands

// Logger function for client-side actions
// These logs can be seen in the console, inside the browser 
function logAction(action, details = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = {
        timestamp,
        action,
        details
    };
    console.log(`[CLIENT] ${timestamp} - ${action}`, details);
    return logMessage;
}

// DOM elements
const productList = document.getElementById('product-list');
const loadingMessage = document.getElementById('loading-message');
const noProductsMessage = document.getElementById('no-products-message');
const paginationContainer = document.getElementById('pagination');
const addProductForm = document.getElementById('add-product-form');
const updateProductForm = document.getElementById('update-product-form');
const updateFormContainer = document.getElementById('update-form-container');
const cancelUpdateButton = document.getElementById('cancel-update');
const searchForm = document.getElementById('search-form');
const resetSearchButton = document.getElementById('reset-search');
const brandSelect = document.getElementById('search-brand');
const statusMessage = document.getElementById('status-message');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load all products when the page loads
    fetchProducts();
    
    // Add event listeners for forms and buttons and set the 
    // function to be called when the event occurs.
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    if (updateProductForm) {
        updateProductForm.addEventListener('submit', handleUpdateProduct);
    }
    
    if (cancelUpdateButton) {
        cancelUpdateButton.addEventListener('click', () => {
            updateFormContainer.style.display = 'none';
        });
    }
    
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    if (resetSearchButton) {
        resetSearchButton.addEventListener('click', resetSearch);
    }

    // "Show more" buttons
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('show-more')) {
            const description = e.target.previousElementSibling;
            description.classList.toggle('expanded');
            e.target.textContent = description.classList.contains('expanded') ? 'Show less' : 'Show more';
        }
    });
});

function fetchProducts(sortOrder = '') {
    logAction('Fetching Products', { sortOrder: sortOrder || 'default' });
    
    // Show loading message
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (noProductsMessage) noProductsMessage.style.display = 'none';
    
    // Clear the product list
    if (productList) productList.innerHTML = '';
    
    // Build URL with sort parameter if provided
    const url = sortOrder ? `/api/products?sort=${sortOrder}` : '/api/products';
    
    // Fetch products from the server
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store the products
            products = data;
            
            // Extract unique brands
            brands = new Set();
            products.forEach(product => {
                if (product.brand && product.brand.trim() !== '') {
                    brands.add(product.brand);
                }
            });
            
            // Populate the brand select dropdown
            populateBrandSelect();
            
            // Display the products
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            showStatusMessage('Error fetching products. Please try again.', 'error');
            
            // Hide loading message and show no products message
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
        });
}

function populateBrandSelect() {
    if (!brandSelect) return;
    
    // Clear existing options (except the first one)
    while (brandSelect.options.length > 1) {
        brandSelect.remove(1);
    }
    
    // Convert Set to Array and sort alphabetically
    const sortedBrands = Array.from(brands).sort((a, b) => a.localeCompare(b));
    
    // Add options for each brand
    sortedBrands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });
}

function displayProducts(productsToDisplay) {
    if (!productList) return;
    
    // Hide loading message
    if (loadingMessage) loadingMessage.style.display = 'none';
    
    // Clear the product list
    productList.innerHTML = '';
    
    // If there are no products, show the no products message
    if (productsToDisplay.length === 0) {
        if (noProductsMessage) noProductsMessage.style.display = 'block';
        return;
    }
    
    // Hide the no products message
    if (noProductsMessage) noProductsMessage.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(productsToDisplay.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, productsToDisplay.length);
    
    // Get the products for the current page
    const productsForPage = productsToDisplay.slice(startIndex, endIndex);
    
    // Create and append product cards
    productsForPage.forEach(product => {
        const productCard = createProductCard(product);
        productList.appendChild(productCard);
    });
    
    // Update pagination controls
    updatePagination(totalPages);
}

function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col';
    
    const card = document.createElement('div');
    card.className = 'product-card card';
    card.dataset.id = product.id;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Title
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = product.title;
    
    // Price
    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `$${product.price.toFixed(2)}`;
    
    // Brand
    const brand = document.createElement('p');
    brand.className = 'brand';
    brand.textContent = product.brand ? `Brand: ${product.brand}` : 'Brand: Unknown';
    
    // Description with "Show more" button
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'description-container';
    
    const description = document.createElement('p');
    description.className = 'description';
    description.textContent = product.description || 'No description available';
    
    const showMoreBtn = document.createElement('span');
    showMoreBtn.className = 'show-more';
    showMoreBtn.textContent = 'Show more';
    
    descriptionContainer.appendChild(description);
    descriptionContainer.appendChild(showMoreBtn);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-outline-primary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
        populateUpdateForm(product);
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-outline-danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete ${product.title}?`)) {
            deleteProduct(product.id);
        }
    });
    
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    
    // Append all elements to the card
    cardBody.appendChild(title);
    cardBody.appendChild(price);
    cardBody.appendChild(brand);
    cardBody.appendChild(descriptionContainer);
    cardBody.appendChild(actions);
    
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

function updatePagination(totalPages) {
    if (!paginationContainer) return;
    
    // Clear pagination container
    paginationContainer.innerHTML = '';
    
    // If there's only one page, don't show pagination
    if (totalPages <= 1) return;
    
    // Create pagination nav
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Product pagination');
    
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayProducts(products);
        }
    });
    
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        
        const firstLink = document.createElement('a');
        firstLink.className = 'page-link';
        firstLink.href = '#';
        firstLink.textContent = '1';
        
        firstLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = 1;
            displayProducts(products);
        });
        
        firstLi.appendChild(firstLink);
        ul.appendChild(firstLi);
        
        // Ellipsis if needed
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            
            const ellipsisSpan = document.createElement('span');
            ellipsisSpan.className = 'page-link';
            ellipsisSpan.innerHTML = '&hellip;';
            
            ellipsisLi.appendChild(ellipsisSpan);
            ul.appendChild(ellipsisLi);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            displayProducts(products);
        });
        
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }
    
    // Last page
    if (endPage < totalPages) {
        // Ellipsis if needed
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            
            const ellipsisSpan = document.createElement('span');
            ellipsisSpan.className = 'page-link';
            ellipsisSpan.innerHTML = '&hellip;';
            
            ellipsisLi.appendChild(ellipsisSpan);
            ul.appendChild(ellipsisLi);
        }
        
        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        
        const lastLink = document.createElement('a');
        lastLink.className = 'page-link';
        lastLink.href = '#';
        lastLink.textContent = totalPages;
        
        lastLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = totalPages;
            displayProducts(products);
        });
        
        lastLi.appendChild(lastLink);
        ul.appendChild(lastLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayProducts(products);
        }
    });
    
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
}

function handleAddProduct(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(addProductForm);
    
    logAction('Adding Product', { 
        title: formData.get('title'),
        brand: formData.get('brand'),
        price: formData.get('price')
    });
    
    // Log form values for debugging
    console.log('Form title:', formData.get('title'));
    console.log('Form description:', formData.get('description'));
    console.log('Form brand:', formData.get('brand'));
    console.log('Form price:', formData.get('price'));
    
    const productData = {
        title: formData.get('title'),
        description: formData.get('description') || '',
        brand: formData.get('brand') || '',
        price: parseFloat(formData.get('price')) || 0
    };
    
    // Log the data being sent
    console.log('Sending product data:', productData);
    
    // Send POST request to add the product
    fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showStatusMessage('Product added successfully!', 'success');
        
        // Reset the form
        addProductForm.reset();
        
        // Refresh the product list
        fetchProducts();
    })
    .catch(error => {
        console.error('Error adding product:', error);
        showStatusMessage('Error adding product. Please try again.', 'error');
    });
}

function populateUpdateForm(product) {
    if (!updateFormContainer || !updateProductForm) return;
    
    logAction('Opening Update Form', { 
        productId: product.id,
        productTitle: product.title
    });
    
    // Set form values
    document.getElementById('update-id').value = product.id;
    document.getElementById('update-title').value = product.title;
    document.getElementById('update-description').value = product.description || '';
    document.getElementById('update-price').value = product.price;
    document.getElementById('update-brand').value = product.brand || '';
    
    // Show the update form
    updateFormContainer.style.display = 'block';
    
    // Scroll to the update form
    updateFormContainer.scrollIntoView({ behavior: 'smooth' });
}

function handleUpdateProduct(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(updateProductForm);
    const productId = formData.get('id');
    
    logAction('Updating Product', { 
        productId: productId,
        title: formData.get('title'),
        brand: formData.get('brand'),
        price: formData.get('price')
    });
    
    const productData = {
        title: formData.get('title'),
        description: formData.get('description'),
        brand: formData.get('brand'),
        price: parseFloat(formData.get('price'))
    };
    
    // Send PUT request to update the product
    fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showStatusMessage('Product updated successfully!', 'success');
        
        // Hide the update form
        updateFormContainer.style.display = 'none';
        
        // Refresh the product list
        fetchProducts();
    })
    .catch(error => {
        console.error('Error updating product:', error);
        showStatusMessage('Error updating product. Please try again.', 'error');
    });
}

function deleteProduct(productId) {
    logAction('Deleting Product', { productId });
    
    // Send DELETE request to delete the product
    fetch(`/api/products/${productId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showStatusMessage('Product deleted successfully!', 'success');
        
        // Refresh the product list
        fetchProducts();
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        showStatusMessage('Error deleting product. Please try again.', 'error');
    });
}

function handleSearch(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(searchForm);
    const searchParams = new URLSearchParams();
    
    // Create a search parameters object for logging
    const searchDetails = {
        term: formData.get('term') || '',
        brand: formData.get('brand') || '',
        minPrice: formData.get('minPrice') || '',
        maxPrice: formData.get('maxPrice') || '',
        sort: formData.get('sort') || 'default'
    };
    
    logAction('Searching Products', searchDetails);
    
    // Add search parameters to the URL
    if (formData.get('term')) searchParams.append('term', formData.get('term'));
    if (formData.get('brand')) searchParams.append('brand', formData.get('brand'));
    if (formData.get('minPrice')) searchParams.append('minPrice', formData.get('minPrice'));
    if (formData.get('maxPrice')) searchParams.append('maxPrice', formData.get('maxPrice'));
    if (formData.get('sort')) searchParams.append('sort', formData.get('sort'));
    
    // Reset pagination to page 1
    currentPage = 1;
    
    // Show loading message
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (noProductsMessage) noProductsMessage.style.display = 'none';
    
    // Clear the product list
    if (productList) productList.innerHTML = '';
    
    // Send GET request to search for products
    fetch(`/api/products/search/query?${searchParams.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store the products
            products = data;
            
            // Display the products
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error searching products:', error);
            showStatusMessage('Error searching products. Please try again.', 'error');
            
            // Hide loading message and show no products message
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
        });
}

function resetSearch() {
    if (!searchForm) return;
    
    logAction('Resetting Search');
    
    // Reset the form
    searchForm.reset();
    
    // Reset pagination to page 1
    currentPage = 1;
    
    // Reset sort order dropdown
    const sortOrderSelect = document.getElementById('sort-order');
    if (sortOrderSelect) {
        sortOrderSelect.value = '';
    }
    
    // Fetch all products with no sort order
    fetchProducts();
}

function showStatusMessage(message, type) {
    if (!statusMessage) return;
    
    // Set message text and type
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Show the message
    statusMessage.style.display = 'block';
    
    // Hide the message after 3 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}
