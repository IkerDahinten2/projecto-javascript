
let allEvents = [];
let currentUser = null;


function checkAuth() {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = JSON.parse(user);
  

  document.getElementById('userName').textContent = currentUser.name || "Usuario";
  
  if (currentUser.role === 'admin') {
    const badge = document.getElementById('userBadge');
    badge.innerHTML = '<span class="badge badge-purple">★ Admin</span>';
    document.getElementById('adminBtn').classList.remove('hidden');
  }
  
  updateCartCount();
}


async function loadEvents() {
  try {

    let storedEvents = JSON.parse(localStorage.getItem('events'));


    if (!storedEvents || storedEvents.length === 0) {
      console.log("Iniciando carga inicial desde data.json...");
      const response = await fetch('data.json');
      const data = await response.json();
      

      storedEvents = data.defaultEvents;
      localStorage.setItem('events', JSON.stringify(data.defaultEvents));
      localStorage.setItem('cities', JSON.stringify(data.cities));
      localStorage.setItem('categories', JSON.stringify(data.categories));
    }

    allEvents = storedEvents;
    

    populateFilterOptions();
    

    filterEvents();

  } catch (error) {
    console.error("Error al cargar los eventos:", error);
    const grid = document.getElementById('eventsGrid');
    if (grid) grid.innerHTML = "<p>Error al conectar con la base de datos de eventos.</p>";
  }
}


function populateFilterOptions() {
  const cities = JSON.parse(localStorage.getItem('cities')) || ["Todas"];
  const categories = JSON.parse(localStorage.getItem('categories')) || ["Todas"];
  
  const cityFilter = document.getElementById('cityFilter');
  const catFilter = document.getElementById('categoryFilter');

  if (cityFilter) {
    cityFilter.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  if (catFilter) {
    catFilter.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

function filterEvents() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedCity = document.getElementById('cityFilter').value;
  const selectedCategory = document.getElementById('categoryFilter').value;
  
  const filtered = allEvents.filter(event => {

    if (event.suspended && currentUser.role !== 'admin') return false;
    
    const matchesSearch = event.name.toLowerCase().includes(searchTerm) || 
                         (event.description && event.description.toLowerCase().includes(searchTerm));
    const matchesCity = selectedCity === 'Todas' || event.city === selectedCity;
    const matchesCategory = selectedCategory === 'Todas' || event.category === selectedCategory;
    
    return matchesSearch && matchesCity && matchesCategory;
  });
  
  displayEvents(filtered);
}


function displayEvents(eventsToDisplay) {
  const grid = document.getElementById('eventsGrid');
  const noEvents = document.getElementById('noEvents');
  const eventCount = document.getElementById('eventCount');
  
  if (!grid) return;

  eventCount.textContent = `${eventsToDisplay.length} evento(s) encontrado(s)`;
  
  if (eventsToDisplay.length === 0) {
    grid.innerHTML = '';
    noEvents.classList.remove('hidden');
    return;
  }
  
  noEvents.classList.add('hidden');
  
  grid.innerHTML = eventsToDisplay.map(event => `
    <div class="card event-card">
      <div class="image-badges">
        <img src="${event.imageUrl}" alt="${event.name}" class="event-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        <div class="badge-overlay badge-left">
          <span class="badge badge-purple">${event.category}</span>
        </div>
        ${event.suspended ? '<div class="badge-overlay badge-right"><span class="badge badge-red">Suspendido</span></div>' : ''}
      </div>
      <div class="event-content">
        <h3 class="event-title">${event.name}</h3>
        <p class="event-description">${event.description || 'Sin descripción'}</p>
        <div class="event-details">
          <div class="event-detail-item">
            <span> ${formatDate(event.date)} - ${event.time || '19:00'}</span>
          </div>
          <div class="event-detail-item">
            <span> ${event.city}</span>
          </div>
          <div class="event-detail-item">
            <span> ${event.availableTickets} disponibles</span>
          </div>
        </div>
        <div class="event-price">Q${Number(event.price).toFixed(2)}</div>
      </div>
      <div class="event-footer">
        <button class="btn btn-primary btn-full" onclick="viewEvent('${event.id}')">
          Ver Detalles
        </button>
      </div>
    </div>
  `).join('');
}


function formatDate(dateStr) {
  if (!dateStr) return "Fecha pendiente";
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
}

function viewEvent(id) {
  window.location.href = `event-detail.html?id=${id}`;
}

function updateCartCount() {
  if (!currentUser) return;
  const cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = totalItems;
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}


window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadEvents();
});