/**
 * Utilidades compartidas por todas las vistas.
 * Se cargan antes que el script de cada página.
 */

/**
 * Escapa texto antes de insertarlo con innerHTML para evitar XSS.
 * Usar SIEMPRE con datos que vienen del usuario, de localStorage o de la URL.
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Convierte "YYYY-MM-DD" en una fecha LOCAL.
 * new Date("2026-04-15") se interpreta en UTC y en Guatemala (UTC-6) mostraría el día 14.
 */
function parseLocalDate(dateStr) {
    const [year, month, day] = String(dateStr).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function formatDate(dateStr) {
    const date = parseLocalDate(dateStr);
    if (!date) return 'Fecha pendiente';
    return date.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
}

const currencyFormatter = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

function formatCurrency(amount) {
    return currencyFormatter.format(Number(amount) || 0);
}

/** Imagen local de respaldo (no depende de servicios externos). */
const FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">' +
    '<rect width="400" height="250" fill="#e5e7eb"/>' +
    '<text x="50%" y="50%" fill="#6b7280" font-family="sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle">Imagen no disponible</text>' +
    '</svg>'
);

/** Reemplaza las imágenes rotas por la imagen de respaldo. */
function attachImageFallback(root = document) {
    root.querySelectorAll('img[data-fallback]').forEach(img => {
        img.addEventListener('error', () => { img.src = FALLBACK_IMAGE; }, { once: true });
    });
}

/**
 * Muestra un aviso temporal en pantalla (reemplaza a alert()).
 * type: 'success' | 'error' | 'info'
 */
function notify(message, type = 'info') {
    let region = document.getElementById('notifications');
    if (!region) {
        region = document.createElement('div');
        region.id = 'notifications';
        region.className = 'notifications';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        document.body.appendChild(region);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/** Calcula el hash SHA-256 (hex) de un texto. Requiere localhost o HTTPS. */
async function sha256(text) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
