#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🚀 Inicializando base de datos template...\n');

// Crear base de datos template
const dbPath = path.join(__dirname, '..', 'facturas.db');
const db = new sqlite3.Database(dbPath);

console.log('📍 Ruta de base de datos:', dbPath);

db.serialize(() => {
    console.log('📋 Creando tablas...');

    // Tabla de clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        rnc TEXT,
        telefono TEXT,
        email TEXT,
        direccion TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de productos con inventario avanzado
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio_venta REAL NOT NULL DEFAULT 0,
        precio_compra REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 0,
        categoria TEXT,
        proveedor TEXT,
        ubicacion TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de facturas
    db.run(`CREATE TABLE IF NOT EXISTS facturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        cliente_nombre TEXT,
        cliente_rnc TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL,
        itbis_porcentaje REAL,
        itbis_monto REAL,
        total REAL,
        estado TEXT DEFAULT 'pendiente',
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )`);

    // Tabla de productos en factura
    db.run(`CREATE TABLE IF NOT EXISTS productos_factura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER,
        producto_id INTEGER,
        nombre TEXT,
        cantidad REAL,
        precio REAL,
        subtotal REAL,
        FOREIGN KEY (factura_id) REFERENCES facturas(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    )`);

    // Tabla de entradas de productos
    db.run(`CREATE TABLE IF NOT EXISTS entradas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER,
        cantidad INTEGER NOT NULL,
        precio_compra REAL NOT NULL,
        precio_venta REAL,
        proveedor TEXT,
        numero_factura TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        notas TEXT,
        usuario TEXT DEFAULT 'admin',
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    )`);

    // Tabla de movimientos de inventario
    db.run(`CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER,
        tipo TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        stock_anterior INTEGER,
        stock_nuevo INTEGER,
        referencia TEXT,
        motivo TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        usuario TEXT DEFAULT 'admin',
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    )`);

    // Tabla de liquidaciones
    db.run(`CREATE TABLE IF NOT EXISTS liquidaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        total_ventas REAL DEFAULT 0,
        total_costos REAL DEFAULT 0,
        total_ganancias REAL DEFAULT 0,
        total_itbis REAL DEFAULT 0,
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        usuario TEXT DEFAULT 'admin'
    )`);

    // Tabla de detalle de liquidaciones
    db.run(`CREATE TABLE IF NOT EXISTS liquidaciones_detalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        liquidacion_id INTEGER,
        factura_id INTEGER,
        monto REAL,
        costo REAL,
        ganancia REAL,
        FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones(id),
        FOREIGN KEY (factura_id) REFERENCES facturas(id)
    )`);

    // Tabla de cuentas por cobrar
    db.run(`CREATE TABLE IF NOT EXISTS cuentas_cobrar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER,
        cliente_id INTEGER,
        monto_total REAL,
        monto_pagado REAL DEFAULT 0,
        monto_pendiente REAL,
        fecha_vencimiento TEXT,
        estado TEXT DEFAULT 'pendiente',
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )`);

    // Tabla de devoluciones
    db.run(`CREATE TABLE IF NOT EXISTS devoluciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER,
        producto_id INTEGER,
        cantidad INTEGER,
        motivo TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    )`);

    // Tabla de usuarios para autenticación
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        email TEXT,
        rol TEXT DEFAULT 'usuario',
        activo INTEGER DEFAULT 1,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso TEXT
    )`);

    // Tabla de permisos
    db.run(`CREATE TABLE IF NOT EXISTS permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        descripcion TEXT
    )`);

    // Tabla de permisos por rol
    db.run(`CREATE TABLE IF NOT EXISTS permisos_rol (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rol TEXT NOT NULL,
        permiso_id INTEGER,
        FOREIGN KEY (permiso_id) REFERENCES permisos(id)
    )`);

    // Tabla de sesiones activas
    db.run(`CREATE TABLE IF NOT EXISTS sesiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        token TEXT UNIQUE,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        fecha_expiracion TEXT,
        activo INTEGER DEFAULT 1,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`);

    // Insertar usuario de soporte por defecto
    setTimeout(() => {
        db.get('SELECT COUNT(*) as count FROM usuarios WHERE username = \'soporte\'', [], (err, row) => {
            if (!err && row.count === 0) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('@Teamo1110a', 10);
                db.run('INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
                       ['soporte', hashedPassword, 'Usuario de Soporte', 'admin']);
                console.log('✅ Usuario de soporte creado');
            }
        });
    }, 200);

    // Insertar permisos por defecto
    setTimeout(() => {
        const permisosDefault = [
            { nombre: 'dashboard', descripcion: 'Acceso al dashboard' },
            { nombre: 'facturacion', descripcion: 'Módulo de facturación' },
            { nombre: 'clientes', descripcion: 'Gestión de clientes' },
            { nombre: 'productos', descripcion: 'Gestión de productos' },
            { nombre: 'entradas', descripcion: 'Entradas de productos' },
            { nombre: 'devoluciones', descripcion: 'Módulo de devoluciones' },
            { nombre: 'liquidaciones', descripcion: 'Liquidaciones' },
            { nombre: 'cuentas-cobrar', descripcion: 'Cuentas por cobrar' },
            { nombre: 'contabilidad', descripcion: 'Contabilidad' },
            { nombre: 'reportes', descripcion: 'Reportes' },
            { nombre: 'soporte', descripcion: 'Módulo de soporte' },
            { nombre: 'admin', descripcion: 'Administración completa' }
        ];

        permisosDefault.forEach(permiso => {
            db.run('INSERT OR IGNORE INTO permisos (nombre, descripcion) VALUES (?, ?)',
                   [permiso.nombre, permiso.descripcion]);
        });

        // Asignar permisos al rol admin
        setTimeout(() => {
            permisosDefault.forEach(permiso => {
                db.run(`INSERT OR IGNORE INTO permisos_rol (rol, permiso_id)
                        SELECT 'admin', id FROM permisos WHERE nombre = ?`, [permiso.nombre]);
            });
            console.log('✅ Permisos configurados');
        }, 300);
    }, 100);

    console.log('✅ Base de datos template creada exitosamente');
    console.log('📍 Ubicación:', dbPath);

    // Cerrar la conexión después de un tiempo
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('❌ Error cerrando base de datos:', err.message);
            } else {
                console.log('✅ Base de datos cerrada correctamente');
                console.log('\n🎉 ¡Base de datos template lista para empaquetado!');
                console.log('💡 Esta base de datos se incluirá en el instalador');
            }
        });
    }, 1000);
});