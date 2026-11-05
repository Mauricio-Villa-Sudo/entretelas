/* Datos y reglas de EntreTelas. Sin DOM: se prueba con `node --test` (store.test.js).
   shortcut: guarda todo en localStorage del navegador; cambiar por la API de Supabase cuando el backend esté listo. */
(function (root) {
    'use strict';

    const TIPOS = ['Ropa', 'Retazos', 'Para reparar'];
    const ESTADOS_PRENDA = ['Como nueva', 'Buen estado', 'Con detalles'];
    const COMUNAS = ['Concepción', 'Talcahuano', 'Hualpén', 'San Pedro de la Paz', 'Chiguayante', 'Penco', 'Coronel'];
    // Pasos de una solicitud, en orden. El seguimiento avanza de uno en uno.
    const PASOS = ['Solicitada', 'Aceptada', 'Coordinando entrega', 'Entregada'];
    const LARGO_MAX_NOMBRE = 60;
    const LARGO_MAX_DETALLE = 240;

    const SEMILLA = [
        { id: 't1', nombre: 'Chaqueta de mezclilla talla M', tipo: 'Ropa', estado: 'Buen estado', comuna: 'Concepción', detalle: 'Le queda chica a mi hijo. Sin roturas.', publicadoPor: 'Verónica G.' },
        { id: 't2', nombre: 'Retazos de algodón estampado (2 kg)', tipo: 'Retazos', estado: 'Como nueva', comuna: 'Talcahuano', detalle: 'Sobrantes de taller de costura, piezas de 20 a 50 cm.', publicadoPor: 'Taller Doña Rosa' },
        { id: 't3', nombre: 'Pantalón de tela con cierre malo', tipo: 'Para reparar', estado: 'Con detalles', comuna: 'Hualpén', detalle: 'Solo hay que cambiar el cierre.', publicadoPor: 'Camila R.' },
        { id: 't4', nombre: 'Polerones escolares (3)', tipo: 'Ropa', estado: 'Buen estado', comuna: 'San Pedro de la Paz', detalle: 'Talla 12 y 14, color azul marino.', publicadoPor: 'Andrea P.' },
        { id: 't5', nombre: 'Retazos de lana para tejer', tipo: 'Retazos', estado: 'Buen estado', comuna: 'Chiguayante', detalle: 'Ovillos a medio usar, varios colores.', publicadoPor: 'Marta L.' },
        { id: 't6', nombre: 'Abrigo de paño con forro roto', tipo: 'Para reparar', estado: 'Con detalles', comuna: 'Concepción', detalle: 'El paño está bien, el forro se descosió.', publicadoPor: 'Jorge S.' }
    ];

    const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    /** Filtra por tipo ('Todos' o vacío = sin filtro), comuna y texto libre en nombre o detalle. */
    function filtrar(textiles, { tipo = 'Todos', comuna = '', texto = '' } = {}) {
        const buscado = normalizar(texto);
        return textiles.filter((t) =>
            (tipo === 'Todos' || !tipo || t.tipo === tipo) &&
            (!comuna || t.comuna === comuna) &&
            (!buscado || normalizar(t.nombre + ' ' + t.detalle).includes(buscado))
        );
    }

    /** Valida un textil nuevo. Devuelve { ok, errores } con un mensaje por campo. */
    function validarTextil(datos) {
        const errores = {};
        const nombre = String(datos.nombre || '').trim();
        if (!nombre) errores.nombre = 'Escribe un nombre para el textil.';
        else if (nombre.length > LARGO_MAX_NOMBRE) errores.nombre = `Máximo ${LARGO_MAX_NOMBRE} caracteres.`;
        if (!TIPOS.includes(datos.tipo)) errores.tipo = 'Elige un tipo.';
        if (!ESTADOS_PRENDA.includes(datos.estado)) errores.estado = 'Elige el estado.';
        if (!COMUNAS.includes(datos.comuna)) errores.comuna = 'Elige una comuna.';
        if (String(datos.detalle || '').length > LARGO_MAX_DETALLE) errores.detalle = `Máximo ${LARGO_MAX_DETALLE} caracteres.`;
        return { ok: Object.keys(errores).length === 0, errores };
    }

    function crearTextil(datos, id) {
        return {
            id,
            nombre: String(datos.nombre).trim(),
            tipo: datos.tipo,
            estado: datos.estado,
            comuna: datos.comuna,
            detalle: String(datos.detalle || '').trim(),
            publicadoPor: 'Tú'
        };
    }

    function crearSolicitud(textil, id, ahora) {
        return { id, textilId: textil.id, nombre: textil.nombre, comuna: textil.comuna, paso: 0, historial: [{ paso: 0, fecha: ahora }] };
    }

    /** Devuelve una solicitud nueva un paso más adelante; si ya está entregada, la devuelve igual. */
    function avanzar(solicitud, ahora) {
        if (solicitud.paso >= PASOS.length - 1) return solicitud;
        const paso = solicitud.paso + 1;
        return { ...solicitud, paso, historial: [...solicitud.historial, { paso, fecha: ahora }] };
    }

    const api = { TIPOS, ESTADOS_PRENDA, COMUNAS, PASOS, SEMILLA, filtrar, validarTextil, crearTextil, crearSolicitud, avanzar };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.EntreTelasStore = api;
})(this);
