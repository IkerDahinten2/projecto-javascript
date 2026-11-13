class NeonEventCard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const id = this.getAttribute('id') || '';
        const name = this.getAttribute('name') || 'Evento Sin Nombre';
        const priceRaw = this.getAttribute('price') || '0';
        const image = this.getAttribute('image') || 'https://via.placeholder.com/300';
        const city = this.getAttribute('city') || 'Guatemala';
        const category = this.getAttribute('category') || 'General';

        const price = Number(priceRaw);
        const safePrice = isNaN(price) ? 0 : price;

        this.innerHTML = `
            <div class="event-card">
                <div class="event-image-wrapper" style="position: relative; overflow: hidden; height: 200px;">
                    <img src="${image}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>

                <div class="event-info">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <span class="badge badge-blue">${category}</span>
                        <span style="color: #9ca3af; font-size: 0.875rem;">${city}</span>
                    </div>

                    <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; color: white;">
                        ${name}
                    </h3>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--neon-yellow); font-size: 1.5rem; font-weight: 900;">
                            Q${safePrice.toFixed(2)}
                        </span>

                        <button class="btn btn-primary"
                            onclick="${id ? `window.location.href='event-detail.html?id=${id}'` : `alert('Evento inválido')`}">
                            Tickets
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('neon-event-card', NeonEventCard);



class NeonNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header class="header">
                <div class="container header-content">
                    
                    <div class="logo" onclick="window.location.href='events.html'" style="cursor:pointer">
                        <h1 class="logo-text">Neon<span>Stage</span> GT</h1>
                    </div>

                    <div class="header-actions">
                        <button class="btn btn-secondary" onclick="window.location.href='cart.html'">
                             Carrito
                        </button>

                        <button class="btn btn-danger" onclick="logoutSafe()">
                            Salir
                        </button>
                    </div>

                </div>
            </header>
        `;
    }
}

customElements.define('neon-navbar', NeonNavbar);



function logoutSafe() {
    if (typeof handleLogout === 'function') {
        handleLogout();
    } else {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}