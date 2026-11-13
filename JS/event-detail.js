let currentUser = null;
let currentEvent = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadEventDetail();
});

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(user);
}

async function loadEventDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
        window.location.href = 'events.html';
        return;
    }

    let events = JSON.parse(localStorage.getItem('events') || '[]');

    if (events.length === 0) {
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            events = data.defaultEvents;
            localStorage.setItem('events', JSON.stringify(events));
        } catch (error) {
            console.error(error);
        }
    }

    const event = events.find(e => e.id == eventId);

    if (!event) {
        showErrorState(eventId);
        return;
    }

    currentEvent = event;
    displayEventDetail(event);
}

function displayEventDetail(event) {
    const container = document.getElementById('eventDetail');
    const isSuspended = event.suspended === true;
    const noStock = event.availableTickets <= 0;

    container.innerHTML = `
        <div class="detail-grid">
            <div class="image-section">
                <img src="${event.imageUrl}" alt="${event.name}" 
                     class="detail-image" 
                     style="${isSuspended ? 'filter: grayscale(1); opacity: 0.7;' : ''}">
            </div>
            
            <div class="info-section">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <span class="badge badge-purple">${event.category}</span>
                    ${isSuspended ? '<span class="badge badge-red">🚫 Suspendido</span>' : ''}
                    ${noStock && !isSuspended ? '<span class="badge badge-red">Agotado</span>' : ''}
                </div>
                
                <h1 class="event-title">${event.name}</h1>
                
                <div class="detail-list">
                    <p> <strong>Fecha:</strong> ${event.date}</p>
                    <p> <strong>Hora:</strong> ${event.time || '19:00'}</p>
                    <p> <strong>Ubicación:</strong> ${event.city}</p>
                    <p> <strong>Disponibles:</strong> ${event.availableTickets} tickets</p>
                </div>

                <p class="event-description-full">${event.description || ''}</p>

                <div class="pricing-card" style="${isSuspended ? 'background: #f3f4f6; border-color: #d1d5db;' : ''}">
                    <p class="price-large">Q${Number(event.price).toFixed(2)}</p>
                    
                    <div class="purchase-controls">
                        <input type="number" id="purchaseQty" value="1" min="1" 
                               max="${event.availableTickets}" 
                               class="input" style="width: 80px" 
                               ${(isSuspended || noStock) ? 'disabled' : ''}>
                        
                        <button class="btn ${isSuspended ? 'btn-secondary' : 'btn-primary'}" 
                                onclick="addToCart()" 
                                ${(isSuspended || noStock) ? 'disabled' : ''}>
                            ${isSuspended ? 'No Disponible' : (noStock ? 'Agotado' : 'Agregar al Carrito')}
                        </button>
                    </div>
                    
                    ${isSuspended ? 
                        '<p style="color: #ef4444; font-size: 0.85rem; margin-top: 12px; font-weight: 600;">Este evento ha sido pausado por la administración.</p>' 
                        : ''}
                </div>
            </div>
        </div>
    `;
}

function addToCart() {
    if (currentEvent.suspended) {
        alert("Operación no permitida: El evento se encuentra suspendido.");
        return;
    }

    const qtyInput = document.getElementById('purchaseQty');
    const qty = parseInt(qtyInput.value);
    
    if (isNaN(qty) || qty <= 0) {
        alert("Ingresa una cantidad válida.");
        return;
    }

    if (qty > currentEvent.availableTickets) {
        alert("No puedes comprar más tickets de los disponibles.");
        return;
    }

    let cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    const existingIndex = cart.findIndex(item => item.eventId === currentEvent.id);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += qty;
    } else {
        cart.push({
            eventId: currentEvent.id,
            quantity: qty
        });
    }

    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    alert("Tickets agregados.");
    window.location.href = 'cart.html';
}

function showErrorState(id) {
    document.getElementById('eventDetail').innerHTML = `
        <div class="card" style="padding: 3rem; text-align: center;">
            <h2>Evento no encontrado</h2>
            <p>El ID "${id}" no existe.</p>
            <button class="btn btn-primary" onclick="window.location.href='events.html'">Volver</button>
        </div>`;
}