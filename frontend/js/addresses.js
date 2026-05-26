// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Open addresses modal
async function openAddresses() {
    console.log('Opening addresses...');
    closeProfile();
    const addressesOverlay = document.getElementById('addressesOverlay');
    const addressesModal = document.getElementById('addressesModal');
    
    if (!addressesOverlay || !addressesModal) {
        console.error('Addresses modal elements not found');
        showNotification('Error loading addresses');
        return;
    }
    
    addressesOverlay.classList.add('show');
    addressesModal.classList.add('open');
    await loadAddresses();
}

// Close addresses modal
function closeAddresses() {
    const addressesOverlay = document.getElementById('addressesOverlay');
    const addressesModal = document.getElementById('addressesModal');
    
    if (addressesOverlay) addressesOverlay.classList.remove('show');
    if (addressesModal) addressesModal.classList.remove('open');
}

// Load and display addresses
async function loadAddresses() {
    try {
        const userId = localStorage.getItem('userId') || 'user123';
        console.log('Loading addresses for user:', userId);
        
        const response = await fetch(`${API_URL}/addresses/${userId}`);
        const data = await response.json();
        
        const addressesList = document.getElementById('addressesList');
        const addAddressBtn = document.getElementById('addAddressBtn');
        
        if (!addressesList) {
            console.error('addressesList element not found');
            return;
        }
        
        if (data.success && data.addresses && data.addresses.length > 0) {
            console.log('Addresses found:', data.addresses);
            addressesList.innerHTML = data.addresses.map(addr => `
                <div class="address-item">
                    <h4>${addr.name}</h4>
                    <p><strong>Phone:</strong> ${addr.phone}</p>
                    <p><strong>Address:</strong> ${addr.buildingNumber}, ${addr.address}</p>
                    <p><strong>Pincode:</strong> ${addr.pincode}</p>
                    <button class="delete-address-btn" onclick="deleteAddress('${addr._id}')">Delete</button>
                </div>
            `).join('');
            if (addAddressBtn) addAddressBtn.style.display = 'block';
        } else {
            console.log('No addresses found');
            addressesList.innerHTML = `
                <div class="no-addresses">
                    <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <p>No saved addresses yet</p>
                    <button class="add-address-btn" onclick="showAddAddressForm()">Add Address</button>
                </div>
            `;
            if (addAddressBtn) addAddressBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        showNotification('Failed to load addresses');
    }
}

// Show add address form
function showAddAddressForm() {
    closeAddresses();
    const addAddressOverlay = document.getElementById('addAddressOverlay');
    const addAddressModal = document.getElementById('addAddressModal');
    
    if (!addAddressOverlay || !addAddressModal) {
        console.error('Add address modal elements not found');
        return;
    }
    
    addAddressOverlay.classList.add('show');
    addAddressModal.classList.add('open');
}

// Close add address form
function closeAddAddressForm() {
    const addAddressOverlay = document.getElementById('addAddressOverlay');
    const addAddressModal = document.getElementById('addAddressModal');
    const addressForm = document.getElementById('addressForm');
    
    if (addAddressOverlay) addAddressOverlay.classList.remove('show');
    if (addAddressModal) addAddressModal.classList.remove('open');
    if (addressForm) addressForm.reset();
}

// Handle address form submission
async function handleAddressSubmit(e) {
    e.preventDefault();
    
    const formData = {
        userId: localStorage.getItem('userId') || 'user123',
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        buildingNumber: document.getElementById('buildingNumber').value,
        pincode: document.getElementById('pincode').value,
        address: document.getElementById('address').value,
    };

    try {
        console.log('Submitting address:', formData);
        const response = await fetch(`${API_URL}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success) {
            showNotification('Address added successfully!');
            closeAddAddressForm();
            await sleep(500);
            openAddresses();
        } else {
            showNotification('Failed to add address');
        }
    } catch (error) {
        console.error('Error adding address:', error);
        showNotification('Failed to add address');
    }
}

// Delete address
async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
        const response = await fetch(`${API_URL}/addresses/${addressId}`, {
            method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Address deleted successfully!');
            await loadAddresses();
        } else {
            showNotification('Failed to delete address');
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        showNotification('Failed to delete address');
    }
}

// Helper function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose all functions to window object
window.openAddresses = openAddresses;
window.closeAddresses = closeAddresses;
window.loadAddresses = loadAddresses;
window.showAddAddressForm = showAddAddressForm;
window.closeAddAddressForm = closeAddAddressForm;
window.handleAddressSubmit = handleAddressSubmit;
window.deleteAddress = deleteAddress;

// Initialize form submission when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing address form');
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressSubmit);
        console.log('Address form listener attached');
    } else {
        console.error('Address form not found on page load');
    }
});

// Also try to attach on script load immediately
const addressForm = document.getElementById('addressForm');
if (addressForm) {
    addressForm.addEventListener('submit', handleAddressSubmit);
    console.log('Address form listener attached immediately');
}
