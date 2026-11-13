# Sistema de Gestión de Eventos y Taquilla Digital

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/Persistencia-LocalStorage-6c5ce7?style=flat)

Plataforma web para la **administración, visualización y compra de boletos** de eventos culturales y de entretenimiento en Guatemala. Tiene dos frentes: una interfaz para el usuario final, enfocada en la experiencia de compra, y un panel administrativo para el inventario, el estado de los eventos y el reporte de ventas.

---

## Funcionalidades

### Módulo de usuario
- **Inicio de sesión y registro** con validación de datos. Las contraseñas se guardan como hash SHA-256.
- **Catálogo dinámico** con búsqueda y filtros por ciudad y categoría. Los eventos suspendidos solo los ve el administrador.
- **Detalle de evento** con fecha, hora, ubicación y stock. No permite agregar más boletos de los disponibles, contando también los que ya están en el carrito.
- **Carrito personal**: cada usuario tiene el suyo y se conserva entre sesiones.
- **Checkout simulado**: valida la tarjeta (algoritmo de Luhn), el vencimiento, el CVV, el DPI/NIT, el teléfono y el correo. **Los datos de la tarjeta nunca se guardan.**

### Módulo administrativo
- **Gestión de eventos**: creación, edición y suspensión/activación, con validación de precio, stock, fecha, hora y URL de imagen.
- **Parámetros del sistema**: alta y baja de ciudades y categorías. No se puede eliminar una opción que usa algún evento.
- **Reporte de ventas**: ingresos totales, boletos vendidos y detalle de cada venta. Los ingresos se calculan con el precio vigente al momento de la compra.
- **Acceso restringido**: solo los usuarios con rol `admin` pueden abrir el panel.

## Arquitectura técnica

| Capa | Tecnología |
|------|------------|
| Estructura | HTML5 semántico y accesible (etiquetas, roles ARIA, foco visible) |
| Estilos | CSS3: Flexbox, Grid, gradientes y `backdrop-filter`; estilos comunes en `common.css` |
| Lógica | JavaScript (ES6+) sin handlers en línea: eventos con `addEventListener` y delegación |
| Datos | `store.js`: una sola capa de acceso a `localStorage`, con carga inicial desde `data.json` |
| Seguridad | Escape de HTML contra XSS, contraseñas con hash y revalidación de compras |

## Estructura del proyecto

```
projecto-javascript/
├── index.html          # Inicio de sesión y registro
├── events.html         # Catálogo de eventos
├── event-detail.html   # Detalle de un evento
├── cart.html           # Carrito y checkout
├── admin.html          # Panel administrativo
├── data.json           # Datos semilla (usuarios, eventos, ciudades y categorías)
├── CSS/
│   ├── common.css      # Utilidades compartidas (insignias, avisos, accesibilidad)
│   └── *.css           # Una hoja de estilos por vista
└── JS/
    ├── utils.js        # escapeHtml, fechas, moneda, avisos y hash
    ├── store.js        # Capa de datos y sesión
    ├── auth.js         # Login y registro
    ├── events.js       # Catálogo y filtros
    ├── event-detail.js # Detalle y agregado al carrito
    ├── cart.js         # Carrito, validación de pago y registro de ventas
    └── admin.js        # Eventos, ventas y parámetros
```

## Cómo ejecutarlo

La carga inicial usa `fetch('data.json')` y el hash de contraseñas usa la Web Crypto API, así que el proyecto **debe servirse desde un servidor local** (`localhost`):

```bash
git clone https://github.com/IkerDahinten2/projecto-javascript.git
cd projecto-javascript
npx serve .
```

O abre `index.html` con la extensión *Live Server* de VS Code.

### Usuarios de demostración

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@eventos.gt` | `admin123` |
| Usuario | `usuario@eventos.gt` | `user123` |

Para el checkout puedes usar la tarjeta de prueba `4111 1111 1111 1111` con cualquier fecha de vencimiento futura.

> Para volver a los datos iniciales, borra el `localStorage` del sitio desde las herramientas del navegador.

## Consideraciones de seguridad

- Todo el contenido dinámico se escapa antes de insertarse en el HTML, incluido el parámetro `id` de la URL.
- Antes de confirmar el pago se vuelven a leer los datos actuales de cada evento: si un evento se suspendió o se quedó sin stock después de agregarlo al carrito, la compra se bloquea.
- **Limitación conocida:** la autenticación y los datos viven en el navegador con fines académicos. En un sistema real, la validación de usuarios, roles, stock y pagos debe hacerse en un servidor.

## Pruebas realizadas

Probado de punta a punta en el navegador:

| Caso | Resultado |
|------|-----------|
| Pestañas de login/registro, credenciales incorrectas, correo duplicado y contraseña corta | ✅ |
| Registro guarda el usuario con hash y crea una sesión con `id` | ✅ |
| Fechas mostradas en hora local (antes salían un día antes) | ✅ |
| Búsqueda y filtros por ciudad | ✅ |
| Nombre de evento con `<img onerror>` y `?id=` malicioso en la URL no ejecutan código | ✅ |
| No se pueden superar los boletos disponibles sumando agregados al carrito | ✅ |
| Evento suspendido con el modal de pago abierto: la compra se bloquea | ✅ |
| Tarjeta inválida o vencida rechazada; pago válido descuenta stock y registra la venta | ✅ |
| Admin que entra primero ve los eventos de ejemplo | ✅ |
| Crear y editar eventos, validar precio negativo y URL `javascript:` | ✅ |
| Cambiar el precio de un evento no altera los ingresos ya registrados | ✅ |
| No se puede borrar una ciudad en uso ni crear "Todas" | ✅ |
| Un usuario normal que abre `admin.html` es redirigido al catálogo | ✅ |

## Flujo de ramas

| Rama | Propósito |
|------|-----------|
| `main` | Versión estable |
| `dev` | Integración de cambios |
| `frontend` | Desarrollo de la interfaz y la lógica del cliente |

## Autor

**Iker Dahinten** — [@IkerDahinten2](https://github.com/IkerDahinten2)
