
let currentUser = null;
let events = [];
let sales = [];
let cities = [];
let categories = [];


function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(user);
    if (currentUser.role !== 'admin') {
        window.location.href = 'events.html';
    }
}


async function loadData() {

    categories = JSON.parse(localStorage.getItem('categories')) || ["Rock", "Pop", "Jazz", "Electrónica", "Tradicional"];
    cities = JSON.parse(localStorage.getItem('cities')) || ["Ciudad de Guatemala", "Antigua Guatemala", "Quetzaltenango"];
    events = JSON.parse(localStorage.getItem('events')) || [];
    sales = JSON.parse(localStorage.getItem('sales')) || [];


    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('cities', JSON.stringify(cities));

    refreshUI();
}


function refreshUI() {
    displayEvents();
    displayCategories();
    displayCities();
    populateSelects();
    updateStats();
}


function displayEvents() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay eventos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(e => `
        <tr>
            <td><strong>${e.name}</strong></td>
            <td>${e.city}</td>
            <td>Q${Number(e.price).toFixed(2)}</td>
            <td>${e.availableTickets}</td>
            <td>
                <span class="badge ${e.suspended ? 'badge-red' : 'badge-green'}">
                    ${e.suspended ? 'Suspendido' : 'Activo'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary" onclick="toggleEventStatus('${e.id}')">
                    ${e.suspended ? 'Activar' : 'Suspender'}
                </button>
            </td>
        </tr>
    `).join('');
}

function handleAddEvent(e) {
    e.preventDefault();
    const newEvent = {
        id: Date.now().toString(),
        name: document.getElementById('addName').value,
        city: document.getElementById('addCity').value,
        category: document.getElementById('addCategory').value,
        price: parseFloat(document.getElementById('addPrice').value),
        availableTickets: parseInt(document.getElementById('addTickets').value),
        imageUrl: document.getElementById('addImageUrl').value,
        description: "Evento organizado en " + document.getElementById('addCity').value,
        suspended: false
    };

    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    closeAddModal();
    refreshUI();
    e.target.reset();
}

function toggleEventStatus(id) {
    events = events.map(e => e.id === id ? { ...e, suspended: !e.suspended } : e);
    localStorage.setItem('events', JSON.stringify(events));
    refreshUI();
}


function openAddModal() { document.getElementById('addModal').style.display = 'flex'; }
function closeAddModal() { document.getElementById('addModal').style.display = 'none'; }


function populateSelects() {
    const catSelect = document.getElementById('addCategory'); 
    const citySelect = document.getElementById('addCity'); 
    
    if (catSelect) {
        catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    if (citySelect) {
        citySelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}


function updateStats() {
    const totalQ = sales.reduce((sum, s) => {
        const subtotal = s.items.reduce((acc, item) => {
            const eventInfo = events.find(e => e.id === item.eventId);
            return acc + (eventInfo ? eventInfo.price * item.quantity : 0);
        }, 0);
        return sum + subtotal;
    }, 0);

    const totalT = sales.reduce((sum, s) => {
        const qty = s.items.reduce((acc, item) => acc + item.quantity, 0);
        return sum + qty;
    }, 0);
    
    const salesEl = document.getElementById('totalSalesAmount');
    const ticketsEl = document.getElementById('totalTicketsSold');
    
    if (salesEl) salesEl.textContent = `Q${totalQ.toFixed(2)}`;
    if (ticketsEl) ticketsEl.textContent = totalT;
}


function displayCategories() {
    const list = document.getElementById('categoriesList');
    if (!list) return;
    list.innerHTML = categories.map((cat, i) => `
        <div>
            ${cat} 
            <button onclick="deleteCategory(${i})">x</button>
        </div>
    `).join('');
}

function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const val = input.value.trim();
    if(val && !categories.includes(val)) { 
        categories.push(val); 
        localStorage.setItem('categories', JSON.stringify(categories)); 
        input.value = '';
        refreshUI(); 
    }
}

function deleteCategory(index) {
    categories.splice(index, 1);
    localStorage.setItem('categories', JSON.stringify(categories));
    refreshUI();
}


function displayCities() {
    const list = document.getElementById('citiesList');
    if (!list) return;
    list.innerHTML = cities.map((city, i) => `
        <div>
            ${city} 
            <button onclick="deleteCity(${i})">x</button>
        </div>
    `).join('');
}

function addCity() {
    const input = document.getElementById('newCityInput');
    const val = input.value.trim();
    if(val && !cities.includes(val)) { 
        cities.push(val); 
        localStorage.setItem('cities', JSON.stringify(cities)); 
        input.value = '';
        refreshUI(); 
    }
}

function deleteCity(index) {
    cities.splice(index, 1);
    localStorage.setItem('cities', JSON.stringify(cities));
    refreshUI();
}


document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadData();
});