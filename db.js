const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = this.getDatabasePath();
        this.initDatabase();
    }

    getDatabasePath() {
        // Verificar si estamos en desarrollo o producción
        const isDev = process.env.NODE_ENV === 'development' ||
                     !process.resourcesPath ||
                     !process.resourcesPath.includes('app.asar');

        if (isDev) {
            // Desarrollo: usar directorio del proyecto
            return path.join(__dirname, 'facturas.db');
        } else {
            // Producción: usar directorio de datos del usuario
            try {
                const { app } = require('electron');
                const userDataPath = app.getPath('userData');
                return path.join(userDataPath, 'facturas.db');
            } catch (error) {
                // Fallback si no se puede acceder a electron
                const os = require('os');
                const homeDir = os.homedir();
                return path.join(homeDir, 'FacturaPro', 'facturas.db');
            }
        }
    }

    initDatabase() {
        try {
            // Asegurar que el directorio existe
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log('Directorio creado:', dir);
            }

            // Verificar si existe una base de datos template en recursos
            const templateDbPath = this.getTemplateDatabasePath();
            const dbExists = fs.existsSync(this.dbPath);

            console.log('Ruta de base de datos:', this.dbPath);
            console.log('¿Base de datos existe?', dbExists);

            if (!dbExists && templateDbPath && fs.existsSync(templateDbPath)) {
                console.log('Copiando base de datos template...');
                fs.copyFileSync(templateDbPath, this.dbPath);
                console.log('Base de datos template copiada exitosamente');
            }

            // Abrir/crear base de datos
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error al abrir base de datos:', err.message);
                    console.error('Ruta intentada:', this.dbPath);
                } else {
                    console.log('Base de datos conectada correctamente en:', this.dbPath);
                    this.createTables();
                }
            });

        } catch (error) {
            console.error('Error inicializando base de datos:', error);
            console.error('Ruta intentada:', this.dbPath);
        }
    }

    getTemplateDatabasePath() {
        // Solo en producción, buscar template en recursos
        if (process.resourcesPath && process.resourcesPath.includes('app.asar')) {
            return path.join(process.resourcesPath, 'facturas.db');
        }
        return null;
    }

    createTables() {
        // Las tablas se crean en el código existente más abajo
        console.log('Base de datos inicializada correctamente');
    }

    getConnection() {
        return this.db;
    }
}

// Crear instancia del administrador de base de datos
const dbManager = new DatabaseManager();
const db = dbManager.getConnection();

// Inicializar tablas
db.serialize(() => {
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

    // Verificar y agregar columnas faltantes si la tabla ya existe
    global.setTimeout(() => {
        db.all('PRAGMA table_info(productos)', [], (err, columns) => {
            if (!err && columns) {
                const columnNames = columns.map(col => col.name);

                const columnsToAdd = [
                    { name: 'precio_venta', type: 'REAL DEFAULT 0' },
                    { name: 'precio_compra', type: 'REAL DEFAULT 0' },
                    { name: 'stock', type: 'INTEGER DEFAULT 0' },
                    { name: 'stock_minimo', type: 'INTEGER DEFAULT 0' },
                    { name: 'categoria', type: 'TEXT' },
                    { name: 'proveedor', type: 'TEXT' },
                    { name: 'ubicacion', type: 'TEXT' },
                    { name: 'fecha_actualizacion', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' }
                ];

                columnsToAdd.forEach(col => {
                    if (!columnNames.includes(col.name)) {
                        db.run(`ALTER TABLE productos ADD COLUMN ${col.name} ${col.type}`, (err) => {
                            if (err) {
                                console.log(`Error agregando columna ${col.name}:`, err.message);
                            } else {
                                console.log(`Columna ${col.name} agregada exitosamente`);
                            }
                        });
                    }
                });
            }
        });
    }, 100);

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
    tipo TEXT NOT NULL, -- 'entrada', 'salida', 'ajuste'
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER,
    stock_nuevo INTEGER,
    referencia TEXT, -- ID de factura, entrada, etc.
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
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'completada', 'cancelada'
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
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'parcial', 'pagada', 'vencida'
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
    rol TEXT DEFAULT 'usuario', -- 'admin', 'usuario', 'soporte'
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
    global.setTimeout(() => {
        db.get('SELECT COUNT(*) as count FROM usuarios WHERE username = \'soporte\'', [], (err, row) => {
            if (!err && row.count === 0) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('@Teamo1110a', 10);
                db.run('INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
                    ['soporte', hashedPassword, 'Usuario de Soporte', 'admin']);
            }
        });
    }, 200);

    // Insertar permisos por defecto
    global.setTimeout(() => {
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
        }, 300);
    }, 100);
});

function guardarFactura(factura, callback) {
    const { cliente_id, cliente, productos, itbisPorcentaje, subtotal, itbisMonto, total } = factura;

    db.run(`INSERT INTO facturas (cliente_id, cliente_nombre, cliente_rnc, subtotal, itbis_porcentaje, itbis_monto, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cliente_id, cliente.nombre, cliente.rnc, subtotal, itbisPorcentaje, itbisMonto, total],
    function(err) {
        if (err) {
            callback(err);
            return;
        }
        const facturaId = this.lastID;

        // Insertar productos y actualizar stock
        const stmt = db.prepare(`INSERT INTO productos_factura (factura_id, producto_id, nombre, cantidad, precio, subtotal)
                                     VALUES (?, ?, ?, ?, ?, ?)`);

        productos.forEach(producto => {
            // Obtener nombre del producto
            db.get('SELECT nombre FROM productos WHERE id = ?', [producto.id], (err, prod) => {
                if (err) {
                    console.error('Error obteniendo producto:', err);
                    return;
                }

                const nombreProducto = prod ? prod.nombre : 'Producto';

                stmt.run([facturaId, producto.id, nombreProducto, producto.cantidad, producto.precio, producto.cantidad * producto.precio]);

                // Actualizar stock del producto
                db.run('UPDATE productos SET stock = stock - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
                    [producto.cantidad, producto.id]);

                // Registrar movimiento de inventario
                registrarMovimientoInventario({
                    producto_id: producto.id,
                    tipo: 'salida',
                    cantidad: producto.cantidad,
                    referencia: `Factura-${facturaId}`,
                    motivo: 'Venta por factura'
                }, (err) => {
                    if (err) console.error('Error registrando movimiento:', err);
                });
            });
        });

        stmt.finalize();
        callback(null, facturaId);
    });
}

// Funciones CRUD para clientes
function crearCliente(cliente, callback) {
    const { nombre, rnc, telefono, email, direccion } = cliente;
    db.run(`INSERT INTO clientes (nombre, rnc, telefono, email, direccion)
          VALUES (?, ?, ?, ?, ?)`,
    [nombre, rnc, telefono, email, direccion], function(err) {
        callback(err, this.lastID);
    });
}

function obtenerClientes(callback) {
    db.all('SELECT * FROM clientes ORDER BY nombre', callback);
}

function buscarClientes(termino, callback) {
    const query = `%${termino}%`;
    db.all(`SELECT * FROM clientes WHERE nombre LIKE ? OR rnc LIKE ? OR email LIKE ?
          ORDER BY nombre`, [query, query, query], callback);
}

function actualizarCliente(id, cliente, callback) {
    const { nombre, rnc, telefono, email, direccion } = cliente;
    db.run(`UPDATE clientes SET nombre = ?, rnc = ?, telefono = ?, email = ?, direccion = ?
          WHERE id = ?`,
    [nombre, rnc, telefono, email, direccion, id], callback);
}

function eliminarCliente(id, callback) {
    db.run('DELETE FROM clientes WHERE id = ?', [id], callback);
}

// Funciones CRUD para productos
function crearProducto(producto, callback) {
    const { codigo, nombre, descripcion, precio_venta, precio_compra, stock, stock_minimo, categoria, proveedor, ubicacion } = producto;

    // Validar campos obligatorios
    if (!nombre || nombre.trim() === '') {
        callback(new Error('El nombre del producto es obligatorio'));
        return;
    }

    // Asegurar valores numéricos válidos
    const precioVenta = parseFloat(precio_venta) || 0;
    const precioCompra = parseFloat(precio_compra) || 0;
    const stockInicial = parseInt(stock) || 0;
    const stockMin = parseInt(stock_minimo) || 0;

    // Validar que el precio de venta no sea negativo
    if (precioVenta < 0) {
        callback(new Error('El precio de venta no puede ser negativo'));
        return;
    }

    db.run(`INSERT INTO productos (codigo, nombre, descripcion, precio_venta, precio_compra, stock, stock_minimo, categoria, proveedor, ubicacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [codigo || null, nombre.trim(), descripcion || null, precioVenta, precioCompra, stockInicial, stockMin, categoria || null, proveedor || null, ubicacion || null], function(err) {
        callback(err, this.lastID);
    });
}

function obtenerProductos(callback) {
    db.all('SELECT * FROM productos ORDER BY nombre', callback);
}

function buscarProductos(termino, callback) {
    const query = `%${termino}%`;
    db.all(`SELECT * FROM productos WHERE nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?
          ORDER BY nombre`, [query, query, query], callback);
}

function actualizarProducto(id, producto, callback) {
    const { codigo, nombre, descripcion, precio_venta, precio_compra, stock, stock_minimo, categoria, proveedor, ubicacion } = producto;
    db.run(`UPDATE productos SET codigo = ?, nombre = ?, descripcion = ?, precio_venta = ?, precio_compra = ?,
          stock = ?, stock_minimo = ?, categoria = ?, proveedor = ?, ubicacion = ?, fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ?`,
    [codigo, nombre, descripcion, precio_venta, precio_compra, stock, stock_minimo, categoria, proveedor, ubicacion, id], callback);
}

function eliminarProducto(id, callback) {
    db.run('DELETE FROM productos WHERE id = ?', [id], callback);
}

// Funciones para movimientos de inventario
function registrarMovimientoInventario(movimiento, callback) {
    const { producto_id, tipo, cantidad, referencia, motivo, usuario } = movimiento;

    // Obtener stock actual
    db.get('SELECT stock FROM productos WHERE id = ?', [producto_id], (err, producto) => {
        if (err) return callback(err);

        const stock_anterior = producto.stock;
        let stock_nuevo = stock_anterior;

        if (tipo === 'entrada') {
            stock_nuevo += cantidad;
        } else if (tipo === 'salida') {
            stock_nuevo -= cantidad;
        }

        // Actualizar stock del producto
        db.run('UPDATE productos SET stock = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
            [stock_nuevo, producto_id], (err) => {
                if (err) return callback(err);

                // Registrar movimiento
                db.run(`INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia, motivo, usuario)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia, motivo, usuario || 'admin'],
                function(err) {
                    callback(err, this.lastID);
                });
            });
    });
}

function obtenerMovimientosInventario(callback) {
    db.all(`SELECT m.*, p.nombre as producto_nombre, p.codigo as producto_codigo
          FROM movimientos_inventario m
          LEFT JOIN productos p ON m.producto_id = p.id
          ORDER BY m.fecha DESC`, callback);
}

// Funciones para entradas de productos
function registrarEntrada(entrada, callback) {
    const { producto_id, cantidad, precio_compra, precio_venta, proveedor, numero_factura, notas } = entrada;

    db.run(`INSERT INTO entradas (producto_id, cantidad, precio_compra, precio_venta, proveedor, numero_factura, notas)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [producto_id, cantidad, precio_compra, precio_venta, proveedor, numero_factura, notas],
    function(err) {
        if (err) return callback(err);

        // Registrar movimiento de inventario
        registrarMovimientoInventario({
            producto_id,
            tipo: 'entrada',
            cantidad,
            referencia: `Entrada-${this.lastID}`,
            motivo: `Entrada de productos - Factura: ${numero_factura}`
        }, callback);
    });
}

function obtenerEntradas(callback) {
    db.all(`SELECT e.*, p.nombre as producto_nombre, p.codigo as producto_codigo
          FROM entradas e
          LEFT JOIN productos p ON e.producto_id = p.id
          ORDER BY e.fecha DESC`, callback);
}

// Funciones para liquidaciones
function crearLiquidacion(liquidacion, callback) {
    const { fecha_inicio, fecha_fin, notas } = liquidacion;

    // Calcular totales de ventas en el período
    const query = `
    SELECT
      SUM(f.total) as total_ventas,
      SUM(f.itbis_monto) as total_itbis
    FROM facturas f
    WHERE f.fecha BETWEEN ? AND ?
    AND f.estado = 'pagada'
  `;

    db.get(query, [fecha_inicio, fecha_fin], (err, ventas) => {
        if (err) return callback(err);

        const total_ventas = ventas.total_ventas || 0;
        const total_itbis = ventas.total_itbis || 0;

        // Calcular costos (basado en productos vendidos)
        const costoQuery = `
      SELECT SUM(p.precio_compra * fp.cantidad) as total_costos
      FROM productos_factura fp
      LEFT JOIN productos p ON fp.producto_id = p.id
      LEFT JOIN facturas f ON fp.factura_id = f.id
      WHERE f.fecha BETWEEN ? AND ?
      AND f.estado = 'pagada'
    `;

        db.get(costoQuery, [fecha_inicio, fecha_fin], (err, costos) => {
            if (err) return callback(err);

            const total_costos = costos.total_costos || 0;
            const total_ganancias = total_ventas - total_costos - total_itbis;

            db.run(`INSERT INTO liquidaciones (fecha_inicio, fecha_fin, total_ventas, total_costos, total_ganancias, total_itbis, notas)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fecha_inicio, fecha_fin, total_ventas, total_costos, total_ganancias, total_itbis, notas],
            function(err) {
                callback(err, this.lastID);
            });
        });
    });
}

function obtenerLiquidaciones(callback) {
    db.all('SELECT * FROM liquidaciones ORDER BY fecha_creacion DESC', callback);
}

// Funciones para KPIs y métricas
function obtenerKPIs(callback) {
    const queries = {
        total_ventas_hoy: `
      SELECT SUM(total) as valor
      FROM facturas
      WHERE DATE(fecha) = DATE('now')
      AND estado = 'pagada'
    `,
        total_clientes: 'SELECT COUNT(*) as valor FROM clientes',
        productos_bajo_stock: `
      SELECT COUNT(*) as valor
      FROM productos
      WHERE stock <= stock_minimo
    `,
        cuentas_por_cobrar: `
      SELECT SUM(monto_pendiente) as valor
      FROM cuentas_cobrar
      WHERE estado != 'pagada'
    `,
        margen_ganancia_promedio: `
      SELECT AVG((f.total - f.itbis_monto - COALESCE(SUM(p.precio_compra * fp.cantidad), 0)) / f.total * 100) as valor
      FROM facturas f
      LEFT JOIN productos_factura fp ON f.id = fp.factura_id
      LEFT JOIN productos p ON fp.producto_id = p.id
      WHERE f.fecha >= date('now', '-30 days')
      AND f.estado = 'pagada'
    `
    };

    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.get(query, [], (err, row) => {
            if (err) {
                results[key] = 0;
            } else {
                results[key] = row.valor || 0;
            }
            completed++;
            if (completed === total) {
                callback(results);
            }
        });
    });
}

// Funciones de autenticación y gestión de usuarios
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function autenticarUsuario(username, password, callback) {
    db.get('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username], (err, usuario) => {
        if (err) return callback(err);

        if (!usuario) {
            return callback(null, { success: false, message: 'Usuario no encontrado' });
        }

        if (!bcrypt.compareSync(password, usuario.password)) {
            return callback(null, { success: false, message: 'Contraseña incorrecta' });
        }

        // Actualizar último acceso
        db.run('UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

        // Obtener permisos del usuario
        obtenerPermisosUsuario(usuario.id, (err, permisos) => {
            if (err) return callback(err);

            callback(null, {
                success: true,
                usuario: {
                    id: usuario.id,
                    username: usuario.username,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol
                },
                permisos: permisos
            });
        });
    });
}

function crearUsuario(usuario, callback) {
    const { username, password, nombre, email, rol } = usuario;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO usuarios (username, password, nombre, email, rol)
          VALUES (?, ?, ?, ?, ?)`,
    [username, hashedPassword, nombre, email, rol || 'usuario'], function(err) {
        callback(err, this.lastID);
    });
}

function obtenerUsuarios(callback) {
    db.all(`SELECT id, username, nombre, email, rol, activo, fecha_creacion, ultimo_acceso
          FROM usuarios ORDER BY nombre`, callback);
}

function actualizarUsuario(id, usuario, callback) {
    const { username, nombre, email, rol, activo } = usuario;
    db.run(`UPDATE usuarios SET username = ?, nombre = ?, email = ?, rol = ?, activo = ?
          WHERE id = ?`,
    [username, nombre, email, rol, activo, id], callback);
}

function eliminarUsuario(id, callback) {
    db.run('UPDATE usuarios SET activo = 0 WHERE id = ?', [id], callback);
}

function cambiarPassword(id, nuevaPassword, callback) {
    const hashedPassword = bcrypt.hashSync(nuevaPassword, 10);
    db.run('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, id], callback);
}

function obtenerPermisosUsuario(usuarioId, callback) {
    db.get('SELECT rol FROM usuarios WHERE id = ?', [usuarioId], (err, usuario) => {
        if (err) return callback(err);

        if (!usuario) return callback(null, []);

        db.all(`SELECT p.nombre, p.descripcion
            FROM permisos p
            INNER JOIN permisos_rol pr ON p.id = pr.permiso_id
            WHERE pr.rol = ?`, [usuario.rol], (err, permisos) => {
            if (err) return callback(err);
            callback(null, permisos.map(p => p.nombre));
        });
    });
}

function crearSesion(usuarioId, callback) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

    db.run(`INSERT INTO sesiones (usuario_id, token, fecha_expiracion)
          VALUES (?, ?, ?)`,
    [usuarioId, token, expiracion], function(err) {
        if (err) return callback(err);
        callback(null, token);
    });
}

function validarToken(token, callback) {
    db.get(`SELECT s.*, u.username, u.nombre, u.rol
          FROM sesiones s
          INNER JOIN usuarios u ON s.usuario_id = u.id
          WHERE s.token = ? AND s.activo = 1 AND s.fecha_expiracion > CURRENT_TIMESTAMP`,
    [token], (err, sesion) => {
        if (err) return callback(err);

        if (!sesion) {
            return callback(null, { valido: false });
        }

        obtenerPermisosUsuario(sesion.usuario_id, (err, permisos) => {
            if (err) return callback(err);

            callback(null, {
                valido: true,
                usuario: {
                    id: sesion.usuario_id,
                    username: sesion.username,
                    nombre: sesion.nombre,
                    rol: sesion.rol
                },
                permisos: permisos
            });
        });
    });
}

function cerrarSesion(token, callback) {
    db.run('UPDATE sesiones SET activo = 0 WHERE token = ?', [token], callback);
}

function obtenerUsuarioPorToken(token, callback) {
    validarToken(token, callback);
}

// Función para obtener productos con stock disponible
function obtenerProductosConStock(callback) {
    db.all('SELECT * FROM productos WHERE stock > 0 ORDER BY nombre', callback);
}

// Función para limpiar datos de prueba
function limpiarDatosPrueba(callback) {
    const tablasALimpiar = [
        'productos_factura',
        'productos',
        'clientes',
        'facturas',
        'entradas',
        'movimientos_inventario',
        'liquidaciones',
        'liquidaciones_detalle',
        'cuentas_cobrar',
        'devoluciones'
    ];

    let operacionesCompletadas = 0;
    const totalOperaciones = tablasALimpiar.length;

    tablasALimpiar.forEach(tabla => {
        db.run(`DELETE FROM ${tabla}`, [], (err) => {
            if (err) {
                console.error(`Error limpiando tabla ${tabla}:`, err);
            } else {
                console.log(`Tabla ${tabla} limpiada`);
            }

            operacionesCompletadas++;
            if (operacionesCompletadas === totalOperaciones) {
                // Reiniciar secuencias de ID
                db.run('DELETE FROM sqlite_sequence', [], (err) => {
                    if (err) {
                        console.error('Error reiniciando secuencias:', err);
                    }
                    callback(null, true);
                });
            }
        });
    });
}

module.exports = {
    guardarFactura,
    crearCliente,
    obtenerClientes,
    buscarClientes,
    actualizarCliente,
    eliminarCliente,
    crearProducto,
    obtenerProductos,
    buscarProductos,
    actualizarProducto,
    eliminarProducto,
    registrarMovimientoInventario,
    obtenerMovimientosInventario,
    registrarEntrada,
    obtenerEntradas,
    crearLiquidacion,
    obtenerLiquidaciones,
    obtenerKPIs,
    // Nuevas funciones de autenticación
    autenticarUsuario,
    crearUsuario,
    obtenerUsuarios,
    actualizarUsuario,
    eliminarUsuario,
    cambiarPassword,
    obtenerPermisosUsuario,
    validarToken,
    crearSesion,
    cerrarSesion,
    obtenerUsuarioPorToken,
    // Nuevas funciones adicionales
    obtenerProductosConStock,
    limpiarDatosPrueba
};
