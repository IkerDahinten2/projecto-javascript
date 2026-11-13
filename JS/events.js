/**
 * Catálogo de eventos: carga, filtros y tarjetas.
 */

const currentUser = Store.requireAuth();
let allEvents = [];

const searchInput = document.getElementById('searchInput');
const cityFilter = document.getElementById('cityFilter');
const categoryFilter = document.getElementById('categoryFilter');

function renderHeader() {
    document.getElementById('userName').textContent = currentUser.name || 'Usuario';

    if (currentUser.role === 'admin') {
        document.getElementById('userBadge').innerHTML = '<span class="badge badge-purple">★ Admin</span>';
        document.getElementById('adminBtn').classList.remove('hidden');
    }
    document.getElementById('cartCount').textContent = Store.cartCount(currentUser.id);
}

function fillSelect(select, label, options) {
    select.innerHTML = [`<option value="${Store.ALL}">${label}</option>`]
        .concat(options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`))
        .join('');
}

function populateFilterOptions() {
    fillSelect(cityFilter, 'Todas las ciudades', Store.getCities());
    fillSelect(categoryFilter, 'Todas las categorías', Store.getCategories());
}

function filterEvents() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCity = cityFilter.value;
    const selectedCategory = categoryFilter.value;

    const filtered = allEvents.filter(event => {
        // Los eventos suspendidos solo los ve el administrador
        if (event.suspended && currentUser.role !== 'admin') return false;

        const text = `${event.name} ${event.description || ''}`.toLowerCase();
        return text.includes(searchTerm)
            && (selectedCity === Store.ALL || event.city === selectedCity)
            && (selectedCategory === Store.ALL || event.category === selectedCategory);
    });

    displayEvents(filtered);
}

function eventCardTemplate(event) {
    const soldOut = event.availableTickets <= 0;
    return `
    <article class="card event-card">
      <div class="image-badges">
        <img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.name)}" class="event-image" loading="lazy" data-fallback>
        <div class="badge-overlay badge-left">
          <span class="badge badge-purple">${escapeHtml(event.category)}</span>
        </div>
        ${event.suspended ? '<div class="badge-overlay badge-right"><span class="badge badge-red">Suspendido</span></div>' : ''}
        ${soldOut && !event.suspended ? '<div class="badge-overlay badge-right"><span class="badge badge-red">Agotado</span></div>' : ''}
      </div>
      <div class="event-content">
        <h3 class="event-title">${escapeHtml(event.name)}</h3>
        <p class="event-description">${escapeHtml(event.description || 'Sin descripción')}</p>
        <div class="event-details">
          <div class="event-detail-item"><span>${formatDate(event.date)} - ${escapeHtml(event.time || '19:00')}</span></div>
          <div class="event-detail-item"><span>${escapeHtml(event.city)}</span></div>
          <div class="event-detail-item"><span>${Number(event.availableTickets)} disponibles</span></div>
        </div>
        <div class="event-price">${formatCurrency(event.price)}</div>
      </div>
      <div class="event-footer">
        <a class="btn btn-primary btn-full" href="event-detail.html?id=${encodeURIComponent(event.id)}">Ver Detalles</a>
      </div>
    </article>`;
}

function displayEvents(events) {
    const grid = document.getElementById('eventsGrid');
    const noEvents = document.getElementById('noEvents');

    document.getElementById('eventCount').textContent = `${events.length} evento(s) encontrado(s)`;
    noEvents.classList.toggle('hidden', events.length > 0);
    grid.innerHTML = events.map(eventCardTemplate).join('');
    attachImageFallback(grid);
}

function handleLogout() {
    Store.clearSession();
    window.location.href = 'index.html';
}

async function init() {
    if (!currentUser) return;
    renderHeader();
    try {
        await Store.init();
        allEvents = Store.getEvents();
        populateFilterOptions();
        filterEvents();
    } catch (error) {
        console.error('Error al cargar los eventos:', error);
        document.getElementById('eventsGrid').innerHTML = '<p>Error al cargar los eventos. Intenta recargar la página.</p>';
    }
}

searchInput.addEventListener('input', filterEvents);
cityFilter.addEventListener('change', filterEvents);
categoryFilter.addEventListener('change', filterEvents);
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

init();
