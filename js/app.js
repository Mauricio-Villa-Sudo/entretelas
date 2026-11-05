/* Interfaz de EntreTelas: rutas por hash (#inicio, #explorar, #publicar, #seguimiento) sobre una sola página. */
(function () {
    'use strict';
    const S = window.EntreTelasStore;
    const CLAVE = 'entretelas:v1';
    const RUTAS = ['inicio', 'explorar', 'publicar', 'seguimiento'];
    const $ = (sel) => document.querySelector(sel);

    // --- Estado persistido ---
    function cargar() {
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE));
            if (guardado && Array.isArray(guardado.textiles) && Array.isArray(guardado.solicitudes)) return guardado;
        } catch (e) {
            console.warn('EntreTelas: datos guardados ilegibles, se usan los de ejemplo.', e);
        }
        return { textiles: S.SEMILLA.slice(), solicitudes: [] };
    }
    let estado = cargar();
    let filtros = { tipo: 'Todos', comuna: '', texto: '' };

    function guardar(nuevo) {
        estado = nuevo;
        try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
        catch (e) { avisar('No se pudo guardar en este navegador. Los cambios se perderán al recargar.'); }
        pintar();
    }

    const nuevoId = (prefijo) => prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // --- Utilidades de DOM (textContent siempre: los textos vienen del usuario) ---
    function el(tag, props = {}, hijos = []) {
        const n = document.createElement(tag);
        Object.entries(props).forEach(([k, v]) => {
            if (k === 'class') n.className = v;
            else if (k === 'text') n.textContent = v;
            else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
            else n.setAttribute(k, v);
        });
        hijos.forEach((h) => h && n.append(h));
        return n;
    }
    const opcion = (valor) => el('option', { value: valor, text: valor });
    const claseTipo = (tipo) => 'tipo-' + tipo.toLowerCase().replace(/\s+/g, '-');

    let temporizadorAviso;
    function avisar(texto) {
        const a = $('#aviso');
        a.textContent = texto;
        a.hidden = false;
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => { a.hidden = true; }, 3200);
    }

    // --- Rutas ---
    function rutaActual() {
        const r = location.hash.replace('#', '');
        return RUTAS.includes(r) ? r : 'inicio';
    }
    function mostrarRuta() {
        const ruta = rutaActual();
        document.querySelectorAll('.vista').forEach((v) => { v.hidden = v.dataset.vista !== ruta; });
        document.querySelectorAll('.et-nav a').forEach((a) => {
            if (a.dataset.ruta === ruta) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        if (location.hash) { $('#contenido').focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }

    // --- Pintado ---
    function pintarCifras() {
        const enCurso = estado.solicitudes.filter((s) => s.paso < S.PASOS.length - 1).length;
        $('#cifra-textiles').textContent = estado.textiles.length;
        $('#cifra-comunas').textContent = new Set(estado.textiles.map((t) => t.comuna)).size;
        $('#cifra-solicitudes').textContent = enCurso;
        const c = $('#contador');
        c.textContent = enCurso;
        c.hidden = enCurso === 0;
    }

    function pintarChips() {
        const cont = $('#chips');
        cont.replaceChildren(...['Todos', ...S.TIPOS].map((tipo) => el('button', {
            type: 'button',
            class: 'chip',
            'aria-pressed': String(filtros.tipo === tipo),
            text: tipo,
            onclick: () => { filtros = { ...filtros, tipo }; pintar(); }
        })));
    }

    function tarjeta(t) {
        const pedido = estado.solicitudes.some((s) => s.textilId === t.id);
        const propio = t.publicadoPor === 'Tú';
        const boton = propio
            ? el('span', { class: 'tarjeta__nota', text: 'Publicado por ti' })
            : el('button', {
                type: 'button',
                class: 'et-boton et-boton--chico',
                text: pedido ? 'Solicitado ✓' : 'Me interesa',
                ...(pedido ? { disabled: '' } : {}),
                onclick: () => pedir(t)
            });
        return el('li', { class: 'tarjeta' }, [
            el('div', { class: 'tarjeta__tela ' + claseTipo(t.tipo), 'aria-hidden': 'true' }),
            el('div', { class: 'tarjeta__cuerpo' }, [
                el('div', { class: 'tarjeta__etiquetas' }, [
                    el('span', { class: 'etiqueta ' + claseTipo(t.tipo), text: t.tipo }),
                    el('span', { class: 'etiqueta etiqueta--neutra', text: t.estado })
                ]),
                el('h3', { text: t.nombre }),
                t.detalle ? el('p', { class: 'tarjeta__detalle', text: t.detalle }) : null,
                el('p', { class: 'tarjeta__meta', text: `${t.comuna} · ${t.publicadoPor}` }),
                boton
            ])
        ]);
    }

    function pintarCatalogo() {
        const lista = S.filtrar(estado.textiles, filtros);
        $('#resultado').textContent = lista.length === 1 ? '1 textil encontrado' : `${lista.length} textiles encontrados`;
        const cat = $('#catalogo');
        if (!lista.length) {
            cat.replaceChildren(el('li', { class: 'vacio' }, [
                el('p', { text: 'No hay textiles con esos filtros.' }),
                el('a', { class: 'et-boton et-boton--borde et-boton--chico', href: '#publicar', text: 'Publica el primero' })
            ]));
            return;
        }
        cat.replaceChildren(...lista.map(tarjeta));
    }

    function pintarSolicitudes() {
        const cont = $('#solicitudes');
        if (!estado.solicitudes.length) {
            cont.replaceChildren(el('li', { class: 'vacio' }, [
                el('p', { text: 'Aún no pides ningún textil.' }),
                el('a', { class: 'et-boton et-boton--chico', href: '#explorar', text: 'Explorar textiles' })
            ]));
            return;
        }
        cont.replaceChildren(...estado.solicitudes.slice().reverse().map((sol) => {
            const terminada = sol.paso === S.PASOS.length - 1;
            const pasos = el('ol', { class: 'linea', 'aria-label': 'Pasos de la solicitud' }, S.PASOS.map((nombre, i) => {
                const reg = sol.historial.find((h) => h.paso === i);
                const clase = i < sol.paso ? 'hecho' : i === sol.paso ? 'actual' : '';
                return el('li', { class: 'linea__paso ' + clase, ...(i === sol.paso ? { 'aria-current': 'step' } : {}) }, [
                    el('span', { class: 'linea__punto', 'aria-hidden': 'true' }),
                    el('span', { class: 'linea__nombre', text: nombre }),
                    reg ? el('time', { class: 'linea__hora', datetime: new Date(reg.fecha).toISOString(), text: new Date(reg.fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) }) : null
                ]);
            }));
            return el('li', { class: 'solicitud' }, [
                el('div', { class: 'solicitud__cabeza' }, [
                    el('div', {}, [el('h3', { text: sol.nombre }), el('p', { class: 'tarjeta__meta', text: sol.comuna })]),
                    el('span', { class: 'etiqueta ' + (terminada ? 'etiqueta--ok' : 'etiqueta--neutra'), text: S.PASOS[sol.paso] })
                ]),
                pasos,
                terminada ? null : el('button', {
                    type: 'button',
                    class: 'et-enlace',
                    text: 'Simular respuesta de quien publicó',
                    onclick: () => {
                        guardar({ ...estado, solicitudes: estado.solicitudes.map((s) => s.id === sol.id ? S.avanzar(s, Date.now()) : s) });
                    }
                })
            ]);
        }));
    }

    function pintar() {
        pintarCifras();
        pintarChips();
        pintarCatalogo();
        pintarSolicitudes();
    }

    // --- Acciones ---
    function pedir(textil) {
        if (estado.solicitudes.some((s) => s.textilId === textil.id)) return;
        guardar({ ...estado, solicitudes: [...estado.solicitudes, S.crearSolicitud(textil, nuevoId('r'), Date.now())] });
        avisar('Solicitud enviada. Síguela en Seguimiento.');
    }

    function prepararFormulario() {
        const form = $('#form-publicar');
        $('#opciones-tipo').replaceChildren(...S.TIPOS.map((tipo) => el('label', { class: 'opcion' }, [
            el('input', { type: 'radio', name: 'tipo', value: tipo }),
            el('span', { text: tipo })
        ])));
        $('#sel-estado').append(...S.ESTADOS_PRENDA.map(opcion));
        $('#sel-comuna').append(...S.COMUNAS.map(opcion));
        $('#filtro-comuna').append(...S.COMUNAS.map(opcion));

        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const datos = Object.fromEntries(new FormData(form));
            const { ok, errores } = S.validarTextil(datos);
            form.querySelectorAll('[data-error]').forEach((n) => { n.textContent = errores[n.dataset.error] || ''; });
            if (!ok) {
                const primero = form.querySelector(`[name="${Object.keys(errores)[0]}"]`);
                if (primero) primero.focus();
                return;
            }
            // Filtros limpios antes de guardar, para que el textil nuevo quede a la vista en Explorar.
            filtros = { tipo: 'Todos', comuna: '', texto: '' };
            $('#filtro-comuna').value = '';
            $('#filtro-texto').value = '';
            guardar({ ...estado, textiles: [S.crearTextil(datos, nuevoId('t')), ...estado.textiles] });
            form.reset();
            avisar('¡Publicado! Ya aparece en Explorar.');
            location.hash = '#explorar';
        });
    }

    function prepararFiltros() {
        $('#filtro-comuna').addEventListener('change', (e) => { filtros = { ...filtros, comuna: e.target.value }; pintarCatalogo(); });
        $('#filtro-texto').addEventListener('input', (e) => { filtros = { ...filtros, texto: e.target.value }; pintarCatalogo(); });
    }

    $('#reiniciar').addEventListener('click', () => {
        if (!confirm('Se borran tus publicaciones y solicitudes de este navegador. ¿Seguir?')) return;
        localStorage.removeItem(CLAVE);
        estado = { textiles: S.SEMILLA.slice(), solicitudes: [] };
        pintar();
        avisar('Datos de ejemplo restablecidos.');
    });

    prepararFormulario();
    prepararFiltros();
    window.addEventListener('hashchange', mostrarRuta);
    pintar();
    mostrarRuta();
})();
