# Sistema de Gestión de Eventos y Taquilla Digital

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/Persistencia-LocalStorage-6c5ce7?style=flat)

Plataforma web para la **administración, visualización y compra de boletos** de eventos culturales y de entretenimiento en Guatemala. La solución tiene dos frentes: una interfaz para el usuario final enfocada en la experiencia de compra, y un panel administrativo para el control de inventario, estados de eventos y reportes de ventas.

---

## Funcionalidades

### Módulo de usuario
- **Autenticación** con inicio de sesión y registro, y redirección según el rol.
- **Catálogo dinámico** de eventos en rejilla adaptable, con filtros por ciudad y categoría.
- **Detalle de evento** con validación de existencias y estado (activo / suspendido).
- **Carrito de compras** con múltiples boletos y persistencia entre sesiones.
- **Pasarela de pago simulada** con validación de datos del formulario.

### Módulo administrativo
- **Control de inventario**: creación, edición y suspensión de eventos en tiempo real.
- **Parámetros globales**: gestión de ciudades y categorías disponibles.
- **Dashboard de ventas**: ingresos totales y métricas de boletos vendidos.
- **Control de acceso** a nivel de cliente que restringe el panel según el rol del usuario.

## Arquitectura técnica

| Capa | Tecnología |
|------|------------|
| Estructura | HTML5 semántico |
| Estilos | CSS3 — Flexbox, Grid, gradientes y `backdrop-filter` |
| Lógica | JavaScript (ES6+), manipulación dinámica del DOM, Web Components |
| Persistencia | `localStorage` (sesión, carritos, eventos y ventas) |
| Datos iniciales | `data.json` (usuarios, eventos, ciudades y categorías) |

## Estructura del proyecto

```
projecto-javascript/
├── index.html          # Inicio de sesión y registro
├── events.html         # Catálogo de eventos
├── event-detail.html   # Detalle de un evento
├── cart.html           # Carrito y checkout
├── admin.html          # Panel administrativo
├── data.json           # Datos semilla
├── CSS/                # Hojas de estilo por vista
└── JS/
    ├── auth.js         # Login, registro y roles
    ├── events.js       # Carga inicial, filtros y catálogo
    ├── event-detail.js # Vista de detalle y agregado al carrito
    ├── cart.js         # Carrito, checkout y registro de ventas
    ├── admin.js        # CRUD de eventos, ciudades, categorías y métricas
    └── components.js   # Web Component <neon-event-card>
```

## Cómo ejecutarlo

La carga inicial de datos usa `fetch('data.json')`, por lo que el proyecto **debe servirse desde un servidor local**:

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

> Son credenciales ficticias de prueba incluidas en `data.json`; la autenticación es solo del lado del cliente con fines académicos.

## Consideraciones de seguridad

El sistema valida en la lógica de negocio que no se puedan comprar boletos de eventos **suspendidos**, incluso si el usuario manipula el DOM o ejecuta funciones desde la consola del navegador.

## Flujo de ramas

| Rama | Propósito |
|------|-----------|
| `main` | Versión estable |
| `dev` | Integración de cambios |
| `frontend` | Desarrollo de la interfaz y la lógica del cliente |

## Autor

**Iker Dahinten** — [@IkerDahinten2](https://github.com/IkerDahinten2)
