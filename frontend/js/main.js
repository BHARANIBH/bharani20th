// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Global variables
let cart = JSON.parse(localStorage.getItem('pureDesiCart')) || [];
let products = [];

// Fetch products from backend
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/admin/products`);
        const data = await response.json();
        if (data.success) {
            products = data.products;
            renderSliders();
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        // Use fallback products if API fails
        products = fallbackProducts;
        renderSliders();
    }
}

// Fallback products
const fallbackProducts = [
    { id: 1, name: "Chicken Curry Cut - Small Pieces", weight: "500 g | 12-18 Pieces", price: 169, originalPrice: 201, discount: 16, image: "https://cdn.pixabay.com/photo/2016/03/05/19/02/chicken-1238328_640.jpg", delivery: "Delivery in 30 mins", isHit: true },
    { id: 2, name: "Loaded Chicken Wings", weight: "200 g | 8 Pieces", price: 169, originalPrice: 199, discount: 15, image: "https://cdn.pixabay.com/photo/2015/09/17/17/22/chicken-944769_640.jpg", delivery: "Delivery in 30 mins", isHit: true },
    { id: 3, name: "Whole Pure Desi Chicken", weight: "800 g - 1 kg", price: 450, originalPrice: 520, discount: 13, image: "https://cdn.pixabay.com/photo/2019/02/26/20/03/chicken-4023256_640.jpg", delivery: "Delivery in 35 mins", isHit: false }
];

// Rest of the functions (addToCart, updateCartQuantity, etc.) - same as previous HTML
// ... (include all JavaScript functions from the previous HTML)
