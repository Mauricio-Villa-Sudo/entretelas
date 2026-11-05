const test = require('node:test');
const assert = require('node:assert');
const s = require('./store.js');

test('filtra por tipo, comuna y texto sin importar tildes', () => {
    assert.strictEqual(s.filtrar(s.SEMILLA, { tipo: 'Retazos' }).length, 2);
    assert.strictEqual(s.filtrar(s.SEMILLA, { tipo: 'Todos', comuna: 'Concepción' }).length, 2);
    assert.deepStrictEqual(s.filtrar(s.SEMILLA, { texto: 'ALGODON' }).map((t) => t.id), ['t2']);
    assert.strictEqual(s.filtrar(s.SEMILLA, {}).length, s.SEMILLA.length);
});

test('rechaza un textil sin nombre o con valores fuera de las listas', () => {
    const r = s.validarTextil({ nombre: '  ', tipo: 'Zapatos', estado: 'Nuevo', comuna: 'Santiago' });
    assert.strictEqual(r.ok, false);
    assert.deepStrictEqual(Object.keys(r.errores).sort(), ['comuna', 'estado', 'nombre', 'tipo']);
    assert.strictEqual(s.validarTextil({ nombre: 'Polera', tipo: 'Ropa', estado: 'Buen estado', comuna: 'Penco' }).ok, true);
});

test('la solicitud avanza un paso a la vez y se detiene en Entregada', () => {
    let sol = s.crearSolicitud(s.SEMILLA[0], 'r1', 1);
    for (let i = 0; i < 10; i++) sol = s.avanzar(sol, i + 2);
    assert.strictEqual(s.PASOS[sol.paso], 'Entregada');
    assert.strictEqual(sol.historial.length, s.PASOS.length);
});

test('avanzar no modifica la solicitud original', () => {
    const sol = s.crearSolicitud(s.SEMILLA[0], 'r1', 1);
    s.avanzar(sol, 2);
    assert.strictEqual(sol.paso, 0);
});
