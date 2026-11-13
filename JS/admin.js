/**
 * Panel administrativo: eventos, ventas y parámetros del sistema.
 */

const currentUser = Store.requireAuth('admin');

const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');

// ---------- Eventos ----------
function displayEvents() {
    const tbody = document.getElementById('eventsTableBody');
    const events = Store.getEvents();

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay eventos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(e => `
        <tr>
            <td><strong>${escapeHtml(e.name)}</strong></td>
            <td>${formatDate(e.date)} ${escapeHtml(e.time || '')}</td>
            <td>${escapeHtml(e.city)}</td>
            <td>${formatCurrency(e.price)}</td>
            <td>${Number(e.availableTickets)}</td>
            <td>
                <span class="badge ${e.suspended ? 'badge-red' : 'badge-green'}">
                    ${e.suspended ? 'Suspendido' : 'Activo'}
                </span>
            </td>
            <td class="table-actions">
                <button type="button" class="btn btn-secondary" data-action="edit" data-id="${escapeHtml(e.id)}">Editar</button>
                <button type="button" class="btn btn-secondary" data-action="toggle" data-id="${escapeHtml(e.id)}">
                    ${e.suspended ? 'Activar' : 'Suspender'}
                </button>
            </td>
        </tr>
    `).join('');
}

function fillSelect(select, options, selected) {
    select.innerHTML = options
        .map(o => `<option value="${escapeHtml(o)}" ${o === selected ? 'selected' : ''}>${escapeHtml(o)}</option>`)
        .join('');
}

function openEventModal(event = null) {
    eventForm.reset();
    document.getElementById('eventFormError').classList.add('hidden');
    document.getElementById('eventModalTitle').textContent = event ? 'Editar Evento' : 'Nuevo Evento';

    fillSelect(document.getElementById('eventCity'), Store.getCities(), event?.city);
    fillSelect(document.getElementById('eventCategory'), Store.getCategories(), event?.category);

    document.getElementById('eventId').value = event?.id || '';
    if (event) {
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventPrice').value = event.price;
        document.getElementById('eventTickets').value = event.availableTickets;
        document.getElementById('eventImageUrl').value = event.imageUrl;
    }

    eventModal.classList.remove('hidden');
    document.getElementById('eventName').focus();
}

function closeEventModal() {
    eventModal.classList.add('hidden');
}

function readEventForm() {
    const value = id => document.getElementById(id).value.trim();
    const data = {
        name: value('eventName'),
        description: value('eventDescription'),
        city: value('eventCity'),
        category: value('eventCategory'),
        date: value('eventDate'),
        time: value('eventTime'),
        price: Number.parseFloat(value('eventPrice')),
        availableTickets: Number(value('eventTickets')),
        imageUrl: value('eventImageUrl')
    };

    if (data.name.length < 3) return { error: 'El título debe tener al menos 3 caracteres.' };
    if (!data.city || !data.category) return { error: 'Agrega al menos una ciudad y una categoría en Configuración.' };
    if (!data.date || !data.time) return { error: 'Indica la fecha y la hora del evento.' };
    if (!Number.isFinite(data.price) || data.price <= 0) return { error: 'El precio debe ser mayor a 0.' };
    if (!Number.isInteger(data.availableTickets) || data.availableTickets < 0) {
        return { error: 'Los tickets deben ser un número entero mayor o igual a 0.' };
    }
    try {
        const url = new URL(data.imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
        return { error: 'La URL de la imagen debe comenzar con http:// o https://.' };
    }
    if (!data.description) data.description = `Evento organizado en ${data.city}`;
    return { data };
}

function handleSaveEvent(e) {
    e.preventDefault();
    const { data, error } = readEventForm();
    const errorBox = document.getElementById('eventFormError');
    if (error) {
        errorBox.textContent = error;
        errorBox.classList.remove('hidden');
        return;
    }

    const id = document.getElementById('eventId').value;
    const events = Store.getEvents();
    if (id) {
        const index = events.findIndex(ev => String(ev.id) === id);
        events[index] = { ...events[index], ...data };
    } else {
        events.push({ id: crypto.randomUUID(), ...data, suspended: false });
    }
    Store.saveEvents(events);

    closeEventModal();
    refreshUI();
    notify(id ? 'Evento actualizado.' : 'Evento creado.', 'success');
}

function toggleEventStatus(id) {
    const events = Store.getEvents().map(e => String(e.id) === id ? { ...e, suspended: !e.suspended } : e);
    Store.saveEvents(events);
    refreshUI();
}

// ---------- Ventas ----------
/** Usa el precio guardado al momento de la compra; si no existe (ventas antiguas), el actual. */
function saleTotal(sale) {
    return sale.items.reduce((acc, item) => {
        const price = item.unitPrice ?? Number(Store.findEvent(item.eventId)?.price || 0);
        return acc + price * item.quantity;
    }, 0);
}

function displaySales() {
    const sales = Store.getSales();
    const totalAmount = sales.reduce((sum, s) => sum + saleTotal(s), 0);
    const totalTickets = sales.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0);

    document.getElementById('totalSalesAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('totalTicketsSold').textContent = totalTickets;

    const tbody = document.getElementById('salesTableBody');
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Aún no hay ventas registradas.</td></tr>';
        return;
    }
    tbody.innerHTML = sales.slice().reverse().map(sale => {
        const date = new Date(sale.date);
        const detail = sale.items
            .map(i => `${escapeHtml(i.eventName || Store.findEvent(i.eventId)?.name || 'Evento eliminado')} × ${i.quantity}`)
            .join('<br>');
        return `
            <tr>
                <td>${Number.isNaN(date.getTime()) ? escapeHtml(sale.date) : date.toLocaleString('es-GT')}</td>
                <td>${escapeHtml(sale.user || 'Desconocido')}</td>
                <td>${detail}</td>
                <td>${formatCurrency(saleTotal(sale))}</td>
            </tr>`;
    }).join('');
}

// ---------- Parámetros (ciudades y categorías) ----------
const PARAMS = {
    categories: { get: Store.getCategories, save: Store.saveCategories, field: 'category', listId: 'categoriesList', label: 'categoría' },
    cities: { get: Store.getCities, save: Store.saveCities, field: 'city', listId: 'citiesList', label: 'ciudad' }
};

function displayParam(key) {
    const { get, listId } = PARAMS[key];
    document.getElementById(listId).innerHTML = get().map((value, i) => `
        <div>
            ${escapeHtml(value)}
            <button type="button" data-param="${key}" data-index="${i}" aria-label="Eliminar ${escapeHtml(value)}">×</button>
        </div>
    `).join('');
}

function addParam(key, input) {
    const { get, save, label } = PARAMS[key];
    const value = input.value.trim();
    const list = get();

    if (!value) return;
    if (value.toLowerCase() === Store.ALL.toLowerCase()) {
        notify(`"${Store.ALL}" es una opción reservada del filtro.`, 'error');
        return;
    }
    if (list.some(v => v.toLowerCase() === value.toLowerCase())) {
        notify(`Esa ${label} ya existe.`, 'error');
        return;
    }
    list.push(value);
    save(list);
    input.value = '';
    refreshUI();
}

function deleteParam(key, index) {
    const { get, save, field, label } = PARAMS[key];
    const list = get();
    const value = list[index];

    // No se permite borrar una opción que usan eventos existentes
    const inUse = Store.getEvents().filter(e => e[field] === value).length;
    if (inUse > 0) {
        notify(`No se puede eliminar "${value}": la usan ${inUse} evento(s).`, 'error');
        return;
    }
    list.splice(index, 1);
    save(list);
    refreshUI();
}

// ---------- General ----------
function refreshUI() {
    displayEvents();
    displaySales();
    displayParam('categories');
    displayParam('cities');
}

document.getElementById('eventsTableBody').addEventListener('click', e => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'edit') openEventModal(Store.findEvent(button.dataset.id));
    if (button.dataset.action === 'toggle') toggleEventStatus(button.dataset.id);
});

document.querySelectorAll('.config-input-group').forEach(form => {
    form.addEventListener('submit', e => {
        e.preventDefault();
        addParam(form.dataset.param, form.querySelector('input'));
    });
});

document.querySelectorAll('.config-list').forEach(list => {
    list.addEventListener('click', e => {
        const button = e.target.closest('button[data-param]');
        if (button) deleteParam(button.dataset.param, Number(button.dataset.index));
    });
});

document.getElementById('newEventBtn').addEventListener('click', () => openEventModal());
document.getElementById('cancelEventBtn').addEventListener('click', closeEventModal);
eventForm.addEventListener('submit', handleSaveEvent);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !eventModal.classList.contains('hidden')) closeEventModal();
});
document.getElementById('logoutBtn').addEventListener('click', () => {
    Store.clearSession();
    window.location.href = 'index.html';
});

(async () => {
    if (!currentUser) return;
    try {
        // Antes el panel no cargaba data.json: si el admin entraba primero, se perdían los eventos de ejemplo
        await Store.init();
    } catch (error) {
        console.error(error);
        notify('No se pudieron cargar los datos iniciales.', 'error');
    }
    refreshUI();
})();
