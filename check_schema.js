const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'facturas.db');
const db = new sqlite3.Database(dbPath);

console.log('Verificando esquema de la tabla productos...\n');

db.all('PRAGMA table_info(productos)', [], (err, columns) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Columnas de la tabla productos:');
    columns.forEach(col => {
        console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
    });

    db.close();
});
