// API Configuration
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

// Check if user is logged in on page load
function checkLoginStatus() {
    const user = localStorage.getItem('pureDesiUser');
    const token = localStorage.getItem('pureDesiToken');
    if (!user || !token) {
        // Redirect to home page if not logged in
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Check login status immediately
checkLoginStatus();

// Global variables
let addresses = [];
let isLoading = false;
let selectedLabel = 'Home';
let selectedHouseType = 'Individual House';
let addressMap;
let addressMarker;
let addressAutocomplete;
let addressGeocoder;
let selectedLocation = {
    title: 'Electronic City',
    shortAddress: 'Bengaluru, Bhovi Palya',
    fullAddress: 'Electronic City, Bengaluru',
    pincode: '560100',
    lat: 12.8399,
    lng: 77.6770
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Addresses page loaded');
    loadAddresses();
    setupLabelSelection();
    restoreSavedLocation();
    updateSelectedLocationUI();
    loadGoogleMapsForAddressPage();
});

// Go back to previous page
function goBack() {
    window.history.back();
}

// Show loading state
function showLoading() {
    isLoading = true;
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('addressesContainer').style.display = 'none';
}

// Hide loading state
function hideLoading() {
    isLoading = false;
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('addressesContainer').style.display = 'block';
}

// Load and display addresses
async function loadAddresses() {
    try {
        showLoading();

        const userId = localStorage.getItem('userId') || 'user123';
        console.log('Loading addresses for user:', userId);

        const response = await fetch(`${API_URL}/addresses/${userId}`);
        const data = await response.json();

        hideLoading();

        if (data.success) {
            addresses = data.addresses || [];
            renderAddresses();
        } else {
            console.error('Failed to load addresses:', data.message);
            showNotification('Failed to load addresses');
            renderEmptyState();
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        hideLoading();
        showNotification('Failed to load addresses');
        renderEmptyState();
    }
}

// Render addresses list
function renderAddresses() {
    const container = document.getElementById('addressesContainer');

    if (addresses.length === 0) {
        renderEmptyState();
        return;
    }

    container.innerHTML = addresses.map(addr => `
        <div class="address-card">
            <div class="address-label">${getAddressLabel(addr.saveAs || 'Home')}</div>
            <div class="address-name">${addr.name}</div>
            <div class="address-details">
                ${addr.houseNo ? addr.houseNo + ', ' : ''}${addr.buildingNumber || ''}<br>
                ${addr.address}<br>
                Pincode: ${addr.pincode}
            </div>
            <div class="address-actions">
                <button class="action-btn" onclick="editAddress('${addr._id}')">Edit</button>
                <button class="delete-btn" onclick="deleteAddress('${addr._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Render empty state
function renderEmptyState() {
    const container = document.getElementById('addressesContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-illustration">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="empty-title">Uh-oh, no address found!</div>
            <div class="empty-subtitle">Add an address for a smoother checkout experience.</div>
        </div>
    `;
}

// Get address label display text
function getAddressLabel(label) {
    const labels = {
        'Home': 'Home',
        'Work': 'Work',
        'Other': 'Other',
        'Office': 'Work'
    };
    return labels[label] || label;
}

// Screen switching functions
function showAddAddressScreen() {
    document.getElementById('savedAddressesScreen').style.display = 'none';
    document.getElementById('addAddressScreen').classList.add('active');
    resetAddAddressForm();
    if (addressMap) {
        google.maps.event.trigger(addressMap, 'resize');
        addressMap.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        addressMarker.setPosition({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
}

function showSavedAddressesScreen() {
    document.getElementById('addAddressScreen').classList.remove('active');
    document.getElementById('savedAddressesScreen').style.display = 'block';
    loadAddresses();
}

// Setup label selection
function setupLabelSelection() {
    const labelChips = document.querySelectorAll('.address-labels .label-chip');
    const houseTypeChips = document.querySelectorAll('.house-type-chip');

    labelChips.forEach(chip => {
        chip.addEventListener('click', function() {
            // Remove selected class from all chips
            labelChips.forEach(c => c.classList.remove('selected'));

            // Add selected class to clicked chip
            this.classList.add('selected');

            // Update selected label
            selectedLabel = this.dataset.label;

            // Update saveAs input
            document.getElementById('saveAs').value = selectedLabel;
        });
    });

    houseTypeChips.forEach(chip => {
        chip.addEventListener('click', function() {
            houseTypeChips.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedHouseType = this.dataset.houseType;
        });
    });
}

// Reset add address form
function resetAddAddressForm() {
    document.getElementById('addressForm').reset();
    document.querySelectorAll('.address-labels .label-chip').forEach(chip => chip.classList.remove('selected'));
    document.querySelectorAll('.house-type-chip').forEach(chip => chip.classList.remove('selected'));

    const defaultLabel = document.querySelector('.address-labels .label-chip[data-label="Home"]');
    const defaultHouseType = document.querySelector('.house-type-chip[data-house-type="Individual House"]');
    if (defaultLabel) defaultLabel.classList.add('selected');
    if (defaultHouseType) defaultHouseType.classList.add('selected');

    selectedLabel = 'Home';
    selectedHouseType = 'Individual House';
    document.getElementById('saveAs').value = selectedLabel;
}

function restoreSavedLocation() {
    try {
        const raw = localStorage.getItem('pureDesiSelectedLocation');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        selectedLocation = {
            ...selectedLocation,
            ...parsed
        };
    } catch (error) {
        console.warn('Unable to parse saved location:', error);
    }
}

function persistSelectedLocation() {
    localStorage.setItem('pureDesiSelectedLocation', JSON.stringify(selectedLocation));
}

function updateSelectedLocationUI() {
    const titleEl = document.getElementById('selectedLocationTitle');
    const addressEl = document.getElementById('selectedLocationAddress');
    if (titleEl) titleEl.textContent = selectedLocation.title || 'Selected Location';
    if (addressEl) addressEl.textContent = selectedLocation.shortAddress || selectedLocation.fullAddress || '';
}

function extractPincode(addressComponents = []) {
    const pinComponent = addressComponents.find((component) => component.types.includes('postal_code'));
    return pinComponent ? pinComponent.long_name : '';
}

function useSelectedPlace(place) {
    if (!place || !place.geometry || !place.geometry.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formattedAddress = place.formatted_address || '';
    const pincode = extractPincode(place.address_components || []);
    const areaTitle = (place.address_components || []).find((comp) =>
        comp.types.includes('sublocality') || comp.types.includes('locality')
    )?.long_name || place.name || 'Selected Location';

    selectedLocation = {
        title: areaTitle,
        shortAddress: formattedAddress.split(',').slice(0, 2).join(',').trim(),
        fullAddress: formattedAddress,
        pincode: pincode || selectedLocation.pincode || '560100',
        lat,
        lng
    };

    if (addressMap && addressMarker) {
        addressMap.panTo({ lat, lng });
        addressMarker.setPosition({ lat, lng });
    }
    updateSelectedLocationUI();
    persistSelectedLocation();
}

function reverseGeocodeLocation(lat, lng) {
    if (!addressGeocoder) return;
    addressGeocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const pincode = extractPincode(result.address_components || []);
            const areaTitle = (result.address_components || []).find((comp) =>
                comp.types.includes('sublocality') || comp.types.includes('locality')
            )?.long_name || 'Selected Location';
            selectedLocation = {
                title: areaTitle,
                shortAddress: result.formatted_address.split(',').slice(0, 2).join(',').trim(),
                fullAddress: result.formatted_address,
                pincode: pincode || selectedLocation.pincode || '560100',
                lat,
                lng
            };
            updateSelectedLocationUI();
            persistSelectedLocation();
        }
    });
}

function initializeAddressMapIfReady() {
    if (!window.google || !google.maps) return;
    const mapContainer = document.getElementById('addressMap');
    const searchInput = document.getElementById('placeSearchInput');
    if (!mapContainer || !searchInput) return;

    addressGeocoder = new google.maps.Geocoder();
    addressMap = new google.maps.Map(mapContainer, {
        center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    addressMarker = new google.maps.Marker({
        position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        map: addressMap,
        draggable: true
    });

    addressAutocomplete = new google.maps.places.Autocomplete(searchInput, {
        fields: ['geometry', 'formatted_address', 'address_components', 'name'],
        componentRestrictions: { country: 'in' }
    });

    addressAutocomplete.addListener('place_changed', () => {
        const place = addressAutocomplete.getPlace();
        useSelectedPlace(place);
    });

    addressMap.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        addressMarker.setPosition({ lat, lng });
        reverseGeocodeLocation(lat, lng);
    });

    addressMarker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        reverseGeocodeLocation(lat, lng);
    });
}

function focusPlaceSearch() {
    const input = document.getElementById('placeSearchInput');
    if (input) input.focus();
}

window.focusPlaceSearch = focusPlaceSearch;
window.initAddressMaps = initializeAddressMapIfReady;

async function loadGoogleMapsForAddressPage() {
    if (window.google && window.google.maps) {
        initializeAddressMapIfReady();
        return;
    }
    try {
        const response = await fetch(`${API_URL}/config/maps`);
        const data = await response.json();
        const apiKey = data.googleMapsApiKey;
        if (!apiKey) {
            console.warn('Google Maps API key missing');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAddressMaps`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    } catch (error) {
        console.error('Failed to load Google Maps script:', error);
    }
}

// Save address
async function saveAddress() {
    const form = document.getElementById('addressForm');

    // Basic validation
    const houseNo = document.getElementById('houseNo').value.trim();
    const floor = document.getElementById('floor').value.trim();
    const landmark = document.getElementById('landmark').value.trim();
    const receiverPhone = document.getElementById('receiverPhone').value.trim();
    const saveAs = selectedLabel || document.getElementById('saveAs').value.trim();
    const composedAddress = selectedLocation.fullAddress || selectedLocation.shortAddress;
    const pincode = selectedLocation.pincode || '560100';

    if (!houseNo) {
        showNotification('House No / Flat / Floor is required');
        return;
    }

    if (!saveAs) {
        showNotification('Please select or enter an address label');
        return;
    }

    const saveBtn = document.querySelector('.btn-success');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const formData = {
            userId: localStorage.getItem('userId') || 'user123',
            name: 'John Doe', // You might want to get this from user profile
            houseNo: houseNo,
            buildingNumber: [floor && `Floor: ${floor}`, landmark && `Landmark: ${landmark}`].filter(Boolean).join(', '),
            pincode: pincode,
            address: composedAddress,
            saveAs: saveAs,
            phone: receiverPhone || '+91 9876543210',
            houseType: selectedHouseType
        };

        console.log('Submitting address:', formData);

        const response = await fetch(`${API_URL}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Address saved successfully!');
            const returnTo = getQueryParam('returnTo');
            if (returnTo === 'cart') {
                window.location.href = 'index.html?from=cart';
                return;
            }
            showSavedAddressesScreen();
        } else {
            throw new Error(data.message || 'Failed to save address');
        }
    } catch (error) {
        console.error('Error saving address:', error);
        showNotification(error.message || 'Failed to save address');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// Edit address (placeholder - you can implement this later)
function editAddress(addressId) {
    showNotification('Edit functionality coming soon!');
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
            throw new Error('Failed to delete address');
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        showNotification('Failed to delete address');
    }
}

function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #28a745;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-size: 0.9rem;
        max-width: 90%;
        text-align: center;
    `;
    notification.innerHTML = `<i class="fas fa-check"></i> ${message}`;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-10px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}