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

function formatDate(value) {
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

let allOrders = [];
let activeFilter = 'all';

const FILTERS = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Ongoing' },
    { id: 'paid', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
];

function renderEmptyState() {
    return `
        <div class="empty-state">
            <div class="illustration">
                <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="48" cy="48" r="48" fill="#E8F4E8" />
                    <path d="M42 22H54C55.1046 22 56 22.8954 56 24V29H68C69.1046 29 70 29.8954 70 31V62C70 63.1046 69.1046 64 68 64H28C26.8954 64 26 63.1046 26 62V31C26 29.8954 26.8954 29 28 29H40V24C40 22.8954 40.8954 22 42 22Z" fill="#FFFFFF" stroke="#CCE6D0" stroke-width="2"/>
                    <path d="M42 29V24C42 23.4477 42.4477 23 43 23H53C53.5523 23 54 23.4477 54 24V29" stroke="#A7D3A2" stroke-width="1.5"/>
                    <path d="M32 45H64" stroke="#A7D3A2" stroke-width="2" stroke-linecap="round"/>
                    <path d="M36 52H60" stroke="#A7D3A2" stroke-width="2" stroke-linecap="round"/>
                    <path d="M37 39H46" stroke="#A7D3A2" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <h2>No orders to display</h2>
            <p>Browse our fresh catalog and place your first order with ease.</p>
            <a class="cta" href="index.html">Start Shopping</a>
        </div>
    `;
}

function renderOrderItem(item) {
    return `
        <tr>
            <td class="item-image-cell">
                <img src="${item.image || 'https://via.placeholder.com/48x48?text=🍗'}" alt="${item.name}" class="item-image">
            </td>
            <td>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-meta">
                        <span class="item-quantity">Qty: ${item.quantity}</span>
                    </div>
                </div>
            </td>
            <td class="item-price">₹${item.price}</td>
            <td class="item-total">₹${item.total}</td>
        </tr>
    `;
}

function renderOrderCard(order) {
    const statusText = order.status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());

    const itemsToShow = order.items.slice(0, 2);
    const extraItems = order.items.length - itemsToShow.length;

    const statusClass = (order.status || '').toLowerCase();

    return `
        <div class="order-card">
            <div class="order-card-header">
                <div>
                    <div class="order-number">Order ID • ${order.orderId}</div>
                    <div class="order-date">Placed on ${formatDate(order.createdAt)}</div>
                </div>
                <span class="status-pill ${statusClass}">${statusText}</span>
            </div>

            <div class="order-summary">
                <div class="summary-chip">
                    <strong>₹${order.totalPrice}</strong>
                    <span>Order total</span>
                </div>
                <div class="summary-chip">
                    <strong>${order.quantity}</strong>
                    <span>Total items</span>
                </div>
                <div class="summary-chip">
                    <strong>${order.paymentMethod || 'COD'}</strong>
                    <span>Payment</span>
                </div>
            </div>

            <div class="order-items">
                <table class="order-items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Details</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(renderOrderItem).join('')}
                        <tr class="order-total-row">
                            <td colspan="3" class="order-total-label">Order Total</td>
                            <td class="order-total-amount">₹${order.totalPrice}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="order-details">
                <div class="order-details-row">
                    <span><strong>Delivery</strong></span>
                    <span>${order.address || 'Address not available'}</span>
                </div>
                <div class="order-details-row">
                    <span><strong>Delivery slot</strong></span>
                    <span>${order.deliverySlot || 'TBD'}</span>
                </div>
                <div class="order-details-row">
                    <span><strong>Status</strong></span>
                    <span>${statusText}</span>
                </div>
            </div>

            <div class="order-actions">
                <button class="primary" onclick="reorderItems('${order.orderId}')">Reorder</button>
                <button onclick="trackOrder('${order.orderId}')">Track</button>
                <button onclick="getOrderHelp('${order.orderId}')">Help</button>
            </div>
        </div>
    `;
}

function renderInsights(orders) {
    const insightsEl = document.getElementById('ordersInsights');
    if (!insightsEl) return;

    const completed = orders.filter((o) => String(o.status || '').toLowerCase() === 'paid').length;
    const ongoing = orders.filter((o) => String(o.status || '').toLowerCase() === 'pending').length;
    const totalSpend = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    insightsEl.innerHTML = `
        <div class="insight-card"><strong>${orders.length}</strong><span>Total orders</span></div>
        <div class="insight-card"><strong>${ongoing}</strong><span>Active now</span></div>
        <div class="insight-card"><strong>₹${totalSpend}</strong><span>All time spend</span></div>
    `;
}

function renderFilters() {
    const filtersEl = document.getElementById('ordersFilters');
    if (!filtersEl) return;

    filtersEl.innerHTML = FILTERS.map((filter) => `
        <button class="filter-chip ${activeFilter === filter.id ? 'active' : ''}" onclick="setOrderFilter('${filter.id}')">
            ${filter.label}
        </button>
    `).join('');
}

function getFilteredOrders() {
    if (activeFilter === 'all') return allOrders;
    return allOrders.filter((order) => String(order.status || '').toLowerCase() === activeFilter);
}

function renderOrdersList() {
    const ordersContainer = document.getElementById('ordersContainer');
    const orders = getFilteredOrders();

    if (!orders.length) {
        ordersContainer.innerHTML = renderEmptyState();
        return;
    }

    ordersContainer.innerHTML = orders.map(renderOrderCard).join('');
}

function setOrderFilter(filterId) {
    activeFilter = filterId;
    renderFilters();
    renderOrdersList();
}

function reorderItems(orderId) {
    const order = allOrders.find((o) => o.orderId === orderId);
    if (!order || !Array.isArray(order.items)) {
        alert('Order details unavailable');
        return;
    }
    const cart = order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.price,
        quantity: item.quantity,
        image: item.image || 'https://placehold.co/200x200/f2f2f2/555?text=Item'
    }));
    localStorage.setItem('pureDesiCart', JSON.stringify(cart));
    window.location.href = 'index.html?from=cart';
}

function trackOrder(orderId) {
    alert(`Tracking for order ${orderId} will be available soon.`);
}

function getOrderHelp(orderId) {
    alert(`Support request raised for order ${orderId}.`);
}

function loadOrders() {
    allOrders = JSON.parse(localStorage.getItem('pureDesiOrders') || '[]');
    renderInsights(allOrders);
    renderFilters();
    renderOrdersList();
}

window.setOrderFilter = setOrderFilter;
window.reorderItems = reorderItems;
window.trackOrder = trackOrder;
window.getOrderHelp = getOrderHelp;
window.addEventListener('DOMContentLoaded', loadOrders);
