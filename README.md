# EntreTelas

Prototipo web para el Taller de Innovación y Emprendimiento. Conecta a quienes tienen ropa o retazos en desuso con
quienes los pueden reutilizar o reparar, en Concepción y alrededores.

Pantallas:

- **Inicio**: qué es y cómo funciona.
- **Explorar**: catálogo con filtros por tipo (Ropa, Retazos, Para reparar), comuna y texto.
- **Publicar**: formulario con nombre, tipo, estado, comuna y detalle.
- **Seguimiento**: el paso en que va cada solicitud (Solicitada, Aceptada, Coordinando entrega, Entregada).

## Cómo abrirlo

Es HTML, CSS y JavaScript sin compilación. Abre `index.html` en el navegador, o sírvelo con:

```bash
python -m http.server 5178
```

Los datos son de ejemplo y se guardan en el navegador (`localStorage`). El botón «Simular respuesta» del seguimiento
hace avanzar una solicitud, porque todavía no hay backend.

## Pruebas

```bash
node --test js/store.test.js
```
