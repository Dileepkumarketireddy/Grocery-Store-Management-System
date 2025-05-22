document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabLinks = document.querySelectorAll('.sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');
    const productForm = document.getElementById('product-form');
    const inventoryTable = document.getElementById('inventory-table').getElementsByTagName('tbody')[0];
    const searchInput = document.getElementById('search-inventory');
    const searchBtn = document.getElementById('search-btn');
    const editModal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close-modal');
    const editForm = document.getElementById('edit-form');
    const saleProductId = document.getElementById('sale-product-id');
    const saleQuantity = document.getElementById('sale-quantity');
    const addToCartBtn = document.getElementById('add-to-cart');
    const cartTable = document.getElementById('cart-table').getElementsByTagName('tbody')[0];
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const completeSaleBtn = document.getElementById('complete-sale');
    const inventoryReportBtn = document.getElementById('inventory-report');
    const salesReportBtn = document.getElementById('sales-report');
    const reportResults = document.getElementById('report-results');
    const totalProductsEl = document.getElementById('total-products');
    const lowStockEl = document.getElementById('low-stock');
    const inventoryValueEl = document.getElementById('inventory-value');

    // Store Data
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let sales = JSON.parse(localStorage.getItem('sales')) || [];
    let currentCart = [];

    // Initialize the app
    function init() {
        renderInventoryTable();
        updateDashboardStats();
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Tab navigation
        tabLinks.forEach(link => {
            link.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // Add product form
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });

        // Search functionality
        searchBtn.addEventListener('click', searchProducts);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchProducts();
        });

        // Edit modal
        closeModal.addEventListener('click', function() {
            editModal.style.display = 'none';
        });

        // Edit form submission
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProduct();
        });

        // Sales functionality
        addToCartBtn.addEventListener('click', addToCart);
        completeSaleBtn.addEventListener('click', completeSale);

        // Reports
        inventoryReportBtn.addEventListener('click', generateInventoryReport);
        salesReportBtn.addEventListener('click', generateSalesReport);
    }

    // Switch between tabs
    function switchTab(tabId) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        tabLinks.forEach(link => {
            link.classList.remove('active');
        });

        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    // Add a new product
    function addProduct() {
        const id = parseInt(document.getElementById('product-id').value);
        const name = document.getElementById('product-name').value;
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const price = parseFloat(document.getElementById('product-price').value);

        // Check if product with same ID already exists
        if (products.some(product => product.id === id)) {
            alert('A product with this ID already exists.');
            return;
        }

        const newProduct = { id, name, quantity, price };
        products.push(newProduct);
        saveProducts();
        renderInventoryTable();
        updateDashboardStats();
        productForm.reset();
        alert('Product added successfully!');
    }

    // Render inventory table
    function renderInventoryTable(filteredProducts = null) {
        inventoryTable.innerHTML = '';
        const productsToRender = filteredProducts || products;

        if (productsToRender.length === 0) {
            const row = inventoryTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = 'No products found';
            cell.style.textAlign = 'center';
            return;
        }

        productsToRender.forEach(product => {
            const row = inventoryTable.insertRow();
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td class="action-btns">
                    <button class="btn btn-primary edit-btn" data-id="${product.id}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-id="${product.id}">Delete</button>
                </td>
            `;
        });

        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openEditModal(parseInt(this.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteProduct(parseInt(this.getAttribute('data-id')));
            });
        });
    }

    // Open edit modal with product data
    function openEditModal(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-quantity').value = product.quantity;
        document.getElementById('edit-product-price').value = product.price;
        editModal.style.display = 'block';
    }

    // Update product
    function updateProduct() {
        const id = parseInt(document.getElementById('edit-product-id').value);
        const name = document.getElementById('edit-product-name').value;
        const quantity = parseInt(document.getElementById('edit-product-quantity').value);
        const price = parseFloat(document.getElementById('edit-product-price').value);

        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) return;

        products[productIndex] = { id, name, quantity, price };
        saveProducts();
        renderInventoryTable();
        updateDashboardStats();
        editModal.style.display = 'none';
        alert('Product updated successfully!');
    }

    // Delete product
    function deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            products = products.filter(p => p.id !== productId);
            saveProducts();
            renderInventoryTable();
            updateDashboardStats();
            alert('Product deleted successfully!');
        }
    }

    // Search products
    function searchProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) {
            renderInventoryTable();
            return;
        }

        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.id.toString().includes(searchTerm)
        );
        renderInventoryTable(filteredProducts);
    }

    // Add product to cart
    function addToCart() {
        const productId = parseInt(saleProductId.value);
        const quantity = parseInt(saleQuantity.value);

        if (!productId || !quantity || quantity <= 0) {
            alert('Please enter valid product ID and quantity');
            return;
        }

        const product = products.find(p => p.id === productId);
        if (!product) {
            alert('Product not found');
            return;
        }

        if (product.quantity < quantity) {
            alert(`Insufficient stock. Only ${product.quantity} available.`);
            return;
        }

        // Check if product already in cart
        const existingItem = currentCart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentCart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: quantity
            });
        }

        renderCart();
        saleProductId.value = '';
        saleQuantity.value = '1';
    }

    // Render cart
    function renderCart() {
        cartTable.innerHTML = '';
        let total = 0;

        currentCart.forEach(item => {
            const row = cartTable.insertRow();
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${itemTotal.toFixed(2)}</td>
                <td><button class="btn btn-danger remove-item" data-id="${item.id}">Remove</button></td>
            `;
        });

        cartTotalAmount.textContent = `$${total.toFixed(2)}`;

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                removeFromCart(parseInt(this.getAttribute('data-id')));
            });
        });
    }

    // Remove item from cart
    function removeFromCart(productId) {
        currentCart = currentCart.filter(item => item.id !== productId);
        renderCart();
    }

    // Complete sale
    function completeSale() {
        if (currentCart.length === 0) {
            alert('Cart is empty');
            return;
        }

        // Update inventory and record sale
        const saleItems = [];
        let saleTotal = 0;

        currentCart.forEach(cartItem => {
            const productIndex = products.findIndex(p => p.id === cartItem.id);
            if (productIndex !== -1) {
                products[productIndex].quantity -= cartItem.quantity;
                saleItems.push({
                    productId: cartItem.id,
                    productName: cartItem.name,
                    quantity: cartItem.quantity,
                    price: cartItem.price,
                    total: cartItem.price * cartItem.quantity
                });
                saleTotal += cartItem.price * cartItem.quantity;
            }
        });

        // Record the sale
        const sale = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: saleItems,
            total: saleTotal
        };
        sales.push(sale);
        localStorage.setItem('sales', JSON.stringify(sales));

        // Save updated products
        saveProducts();

        // Reset cart and update UI
        currentCart = [];
        renderCart();
        renderInventoryTable();
        updateDashboardStats();

        alert(`Sale completed successfully! Total: $${saleTotal.toFixed(2)}`);
    }

    // Generate inventory report
    function generateInventoryReport() {
        let reportHTML = '<div class="report-card">';
        reportHTML += '<h3>Inventory Report</h3>';
        
        // Low stock items (quantity < 10)
        const lowStockItems = products.filter(p => p.quantity < 10);
        reportHTML += `<h4>Low Stock Items (${lowStockItems.length})</h4>`;
        
        if (lowStockItems.length > 0) {
            reportHTML += '<table class="report-table"><thead><tr><th>ID</th><th>Name</th><th>Quantity</th></tr></thead><tbody>';
            lowStockItems.forEach(item => {
                reportHTML += `<tr><td>${item.id}</td><td>${item.name}</td><td class="${item.quantity < 5 ? 'text-danger' : ''}">${item.quantity}</td></tr>`;
            });
            reportHTML += '</tbody></table>';
        } else {
            reportHTML += '<p>No low stock items</p>';
        }
        
        // Full inventory
        reportHTML += '<h4>Full Inventory</h4>';
        reportHTML += '<table class="report-table"><thead><tr><th>ID</th><th>Name</th><th>Quantity</th><th>Price</th><th>Value</th></tr></thead><tbody>';
        
        let totalValue = 0;
        products.forEach(item => {
            const value = item.quantity * item.price;
            totalValue += value;
            reportHTML += `<tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${value.toFixed(2)}</td>
            </tr>`;
        });
        
        reportHTML += '</tbody></table>';
        reportHTML += `<p class="report-total">Total Inventory Value: $${totalValue.toFixed(2)}</p>`;
        reportHTML += '</div>';
        
        reportResults.innerHTML = reportHTML;
    }

    // Generate sales report
    function generateSalesReport() {
        if (sales.length === 0) {
            reportResults.innerHTML = '<p>No sales recorded yet</p>';
            return;
        }

        let reportHTML = '<div class="report-card">';
        reportHTML += '<h3>Sales Report</h3>';
        
        // Summary
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);
        
        reportHTML += `<div class="sales-summary">
            <p>Total Sales: $${totalSales.toFixed(2)}</p>
            <p>Number of Transactions: ${sales.length}</p>
            <p>Items Sold: ${totalItems}</p>
        </div>`;
        
        // Recent sales
        reportHTML += '<h4>Recent Sales</h4>';
        reportHTML += '<table class="report-table"><thead><tr><th>Date</th><th>Items</th><th>Total</th></tr></thead><tbody>';
        
        // Show last 10 sales
        const recentSales = sales.slice(-10).reverse();
        recentSales.forEach(sale => {
            const date = new Date(sale.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            reportHTML += `<tr>
                <td>${dateStr}</td>
                <td>
                    <ul class="sale-items">`;
            
            sale.items.forEach(item => {
                reportHTML += `<li>${item.productName} (${item.quantity} @ $${item.price.toFixed(2)})</li>`;
            });
            
            reportHTML += `</ul>
                </td>
                <td>$${sale.total.toFixed(2)}</td>
            </tr>`;
        });
        
        reportHTML += '</tbody></table>';
        reportHTML += '</div>';
        
        reportResults.innerHTML = reportHTML;
    }

    // Update dashboard statistics
    function updateDashboardStats() {
        totalProductsEl.textContent = products.length;
        
        const lowStockCount = products.filter(p => p.quantity < 10).length;
        lowStockEl.textContent = lowStockCount;
        
        const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
        inventoryValueEl.textContent = `$${totalValue.toFixed(2)}`;
    }

    // Save products to localStorage
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Initialize the app
    init();
});