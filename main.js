const path = require('path');
// const { autoUpdater } = require('electron-updater'); // Mover dentro de createWindow
// const log = require('electron-log'); // Mover dentro de createWindow
const {
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
} = require('./db');

// Importar sqlite3 para la función auxiliar
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'facturas.db');
const db = new sqlite3.Database(dbPath);
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Funcionalidad de impresoras (usando sistema operativo)
const { exec } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: false, // No fullscreen automático
        frame: true, // Mostrar botones de ventana (minimizar, maximizar, cerrar)
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('login.html');

    // Ocultar la barra de menú pero mantener los botones de ventana
    win.setMenuBarVisibility(false);

    // Permitir alternar fullscreen con F11
    win.on('enter-full-screen', () => {
        win.setMenuBarVisibility(false);
    });

    win.on('leave-full-screen', () => {
        win.setMenuBarVisibility(false);
    });

    // ==================== CONFIGURACIÓN DE AUTO-UPDATER ====================
    // Solo configurar después de que la ventana esté lista
    win.webContents.on('did-finish-load', () => {
        try {
            const { autoUpdater } = require('electron-updater');
            const log = require('electron-log');

            // Configurar logging
            log.transports.file.level = 'info';
            autoUpdater.logger = log;

            // Configurar auto-updater
            autoUpdater.checkForUpdatesAndNotify();

            // Event listeners para actualizaciones
            autoUpdater.on('checking-for-update', () => {
                log.info('Checking for update...');
            });

            autoUpdater.on('update-available', (info) => {
                log.info('Update available.', info);
                // Notificar al renderer process
                win.webContents.send('update-available', info);
            });

            autoUpdater.on('update-not-available', (info) => {
                log.info('Update not available.', info);
            });

            autoUpdater.on('error', (err) => {
                log.error('Error in auto-updater. ' + err);
            });

            autoUpdater.on('download-progress', (progressObj) => {
                let log_message = "Download speed: " + progressObj.bytesPerSecond;
                log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
                log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
                log.info(log_message);

                // Enviar progreso al renderer
                win.webContents.send('download-progress', progressObj);
            });

            autoUpdater.on('update-downloaded', (info) => {
                log.info('Update downloaded', info);

                // Notificar que la actualización está lista para instalar
                win.webContents.send('update-downloaded', info);
            });

        } catch (error) {
            console.error('Error configurando auto-updater:', error);
        }
    });
}

const { app, BrowserWindow, ipcMain, dialog } = require('electron');

if (app) {
    app.on('ready', createWindow);
} else {
    console.error('Electron app is not available');
}

if (app) {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
}

// ==================== SISTEMA DE ACTUALIZACIONES AUTOMÁTICAS ====================
// (Configurado dentro de createWindow después de que la ventana esté lista)

// Verificar que ipcMain esté disponible antes de usar handlers
if (ipcMain) {
    // IPC handlers para control de actualizaciones
    ipcMain.on('check-for-updates', () => {
    try {
        const { autoUpdater } = require('electron-updater');
        autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
});

ipcMain.on('install-update', () => {
    try {
        const { autoUpdater } = require('electron-updater');
        autoUpdater.quitAndInstall();
    } catch (error) {
        console.error('Error installing update:', error);
    }
});

ipcMain.on('get-app-version', (event) => {
    if (app) {
        event.reply('app-version', app.getVersion());
    } else {
        event.reply('app-version', '1.0.0');
    }
});

// IPC handlers
ipcMain.on('guardar-factura', (event, factura) => {
    guardarFactura(factura, (err, id) => {
        if (err) {
            console.error('Error guardando factura:', err);
            event.reply('factura-guardada', { success: false, error: err.message });
        } else {
            console.log('Factura guardada con ID:', id);
            event.reply('factura-guardada', { success: true, id });
        }
    });
});

ipcMain.on('generar-pdf', async (event, datos) => {
    try {
    // Mostrar diálogo para elegir ubicación
        const result = await dialog.showSaveDialog({
            title: 'Guardar Factura PDF',
            defaultPath: path.join(require('os').homedir(), 'Documents', `factura_${Date.now()}.pdf`),
            filters: [
                { name: 'Archivos PDF', extensions: ['pdf'] },
                { name: 'Todos los archivos', extensions: ['*'] }
            ]
        });

        if (result.canceled) {
            event.reply('pdf-generado', { success: false, message: 'Operación cancelada' });
            return;
        }

        const filePath = result.filePath;

        // Generar PDF
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Encabezado
        doc.fontSize(20).text('FACTURA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Información del cliente
        doc.fontSize(14).text('Información del Cliente:', { underline: true });
        doc.fontSize(12).text(`Nombre: ${datos.cliente.nombre}`);
        if (datos.cliente.rnc) {
            doc.text(`RNC: ${datos.cliente.rnc}`);
        }
        doc.moveDown();

        // Tabla de productos
        doc.fontSize(14).text('Productos:', { underline: true });
        doc.moveDown(0.5);

        // Encabezados de tabla
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text('Producto', 50, tableTop);
        doc.text('Cant.', 300, tableTop);
        doc.text('Precio', 350, tableTop);
        doc.text('Subtotal', 420, tableTop);

        // Línea separadora
        doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
        doc.moveDown(1);

        // Productos
        let yPosition = doc.y;
        datos.productos.forEach(producto => {
            doc.text(producto.nombre, 50, yPosition);
            doc.text(producto.cantidad.toString(), 300, yPosition);
            doc.text(`RD$${producto.precio.toFixed(2)}`, 350, yPosition);
            doc.text(`RD$${producto.subtotal.toFixed(2)}`, 420, yPosition);
            yPosition += 20;
        });

        doc.moveDown(2);

        // Totales
        const totalesY = doc.y;
        doc.fontSize(12);
        doc.text(`Subtotal: RD$${datos.subtotal.toFixed(2)}`, 350, totalesY);
        doc.text(`ITBIS (${datos.itbisPorcentaje}%): RD$${datos.itbisMonto.toFixed(2)}`, 350, totalesY + 20);
        doc.fontSize(14).text(`TOTAL: RD$${datos.total.toFixed(2)}`, 350, totalesY + 40, { bold: true });

        doc.end();

        // Esperar a que termine de escribir
        writeStream.on('finish', () => {
            event.reply('pdf-generado', { success: true, filePath });
        });

        writeStream.on('error', (error) => {
            event.reply('pdf-generado', { success: false, message: 'Error al guardar el archivo: ' + error.message });
        });

    } catch (error) {
        event.reply('pdf-generado', { success: false, message: 'Error al generar PDF: ' + error.message });
    }
});

// IPC handlers para clientes
ipcMain.on('crear-cliente', (event, cliente) => {
    crearCliente(cliente, (err, id) => {
        if (err) {
            event.reply('cliente-creado', { success: false, error: err.message });
        } else {
            event.reply('cliente-creado', { success: true, id });
        }
    });
});

ipcMain.on('obtener-clientes', (event) => {
    obtenerClientes((err, clientes) => {
        if (err) {
            event.reply('clientes-obtenidos', { success: false, error: err.message });
        } else {
            event.reply('clientes-obtenidos', { success: true, clientes });
        }
    });
});

ipcMain.on('buscar-clientes', (event, termino) => {
    buscarClientes(termino, (err, clientes) => {
        if (err) {
            event.reply('clientes-buscados', { success: false, error: err.message });
        } else {
            event.reply('clientes-buscados', { success: true, clientes });
        }
    });
});

ipcMain.on('actualizar-cliente', (event, { id, cliente }) => {
    actualizarCliente(id, cliente, (err) => {
        if (err) {
            event.reply('cliente-actualizado', { success: false, error: err.message });
        } else {
            event.reply('cliente-actualizado', { success: true });
        }
    });
});

ipcMain.on('eliminar-cliente', (event, id) => {
    eliminarCliente(id, (err) => {
        if (err) {
            event.reply('cliente-eliminado', { success: false, error: err.message });
        } else {
            event.reply('cliente-eliminado', { success: true });
        }
    });
});

// IPC handlers para productos
ipcMain.on('crear-producto', (event, producto) => {
    crearProducto(producto, (err, id) => {
        if (err) {
            event.reply('producto-creado', { success: false, error: err.message });
        } else {
            event.reply('producto-creado', { success: true, id });
        }
    });
});

ipcMain.on('obtener-productos', (event) => {
    obtenerProductos((err, productos) => {
        if (err) {
            event.reply('productos-obtenidos', { success: false, error: err.message });
        } else {
            event.reply('productos-obtenidos', { success: true, productos });
        }
    });
});

ipcMain.on('buscar-productos', (event, termino) => {
    buscarProductos(termino, (err, productos) => {
        if (err) {
            event.reply('productos-buscados', { success: false, error: err.message });
        } else {
            event.reply('productos-buscados', { success: true, productos });
        }
    });
});

ipcMain.on('actualizar-producto', (event, { id, producto }) => {
    actualizarProducto(id, producto, (err) => {
        if (err) {
            event.reply('producto-actualizado', { success: false, error: err.message });
        } else {
            event.reply('producto-actualizado', { success: true });
        }
    });
});

ipcMain.on('eliminar-producto', (event, id) => {
    eliminarProducto(id, (err) => {
        if (err) {
            event.reply('producto-eliminado', { success: false, error: err.message });
        } else {
            event.reply('producto-eliminado', { success: true });
        }
    });
});

// IPC handlers para movimientos de inventario
ipcMain.on('registrar-movimiento-inventario', (event, movimiento) => {
    registrarMovimientoInventario(movimiento, (err, id) => {
        if (err) {
            event.reply('movimiento-registrado', { success: false, error: err.message });
        } else {
            event.reply('movimiento-registrado', { success: true, id });
        }
    });
});

ipcMain.on('obtener-movimientos-inventario', (event) => {
    obtenerMovimientosInventario((err, movimientos) => {
        if (err) {
            event.reply('movimientos-obtenidos', { success: false, error: err.message });
        } else {
            event.reply('movimientos-obtenidos', { success: true, movimientos });
        }
    });
});

// IPC handlers para entradas
ipcMain.on('registrar-entrada', (event, entrada) => {
    registrarEntrada(entrada, (err, id) => {
        if (err) {
            event.reply('entrada-registrada', { success: false, error: err.message });
        } else {
            event.reply('entrada-registrada', { success: true, id });
        }
    });
});

ipcMain.on('obtener-entradas', (event) => {
    obtenerEntradas((err, entradas) => {
        if (err) {
            event.reply('entradas-obtenidas', { success: false, error: err.message });
        } else {
            event.reply('entradas-obtenidas', { success: true, entradas });
        }
    });
});

// IPC handlers para liquidaciones
ipcMain.on('crear-liquidacion', (event, liquidacion) => {
    crearLiquidacion(liquidacion, (err, id) => {
        if (err) {
            event.reply('liquidacion-creada', { success: false, error: err.message });
        } else {
            event.reply('liquidacion-creada', { success: true, id });
        }
    });
});

ipcMain.on('obtener-liquidaciones', (event) => {
    obtenerLiquidaciones((err, liquidaciones) => {
        if (err) {
            event.reply('liquidaciones-obtenidas', { success: false, error: err.message });
        } else {
            event.reply('liquidaciones-obtenidas', { success: true, liquidaciones });
        }
    });
});

// IPC handlers para KPIs
ipcMain.on('obtener-kpis', (event) => {
    obtenerKPIs((kpis) => {
        event.reply('kpis-obtenidos', { success: true, kpis });
    });
});

// IPC handlers para autenticación
ipcMain.on('login', (event, { username, password }) => {
    autenticarUsuario(username, password, (err, result) => {
        if (err) {
            event.reply('login-response', { success: false, message: err.message });
            return;
        }

        if (result.success) {
            // Crear sesión
            crearSesion(result.usuario.id, (err, token) => {
                if (err) {
                    event.reply('login-response', { success: false, message: 'Error al crear sesión' });
                    return;
                }

                event.reply('login-response', {
                    success: true,
                    usuario: result.usuario,
                    permisos: result.permisos,
                    token: token
                });
            });
        } else {
            event.reply('login-response', { success: false, message: result.message });
        }
    });
});

ipcMain.on('logout', (event, token) => {
    cerrarSesion(token, (err) => {
        if (err) {
            event.reply('logout-response', { success: false, message: err.message });
        } else {
            event.reply('logout-response', { success: true });
        }
    });
});

ipcMain.on('validar-sesion', (event, token) => {
    validarToken(token, (err, result) => {
        if (err) {
            event.reply('sesion-validada', { valido: false });
            return;
        }
        event.reply('sesion-validada', result);
    });
});

ipcMain.on('obtener-usuario-token', (event, token) => {
    obtenerUsuarioPorToken(token, (err, result) => {
        if (err) {
            event.reply('usuario-token-obtenido', { success: false });
            return;
        }
        event.reply('usuario-token-obtenido', result);
    });
});

// IPC handlers para gestión de usuarios
ipcMain.on('crear-usuario', (event, usuario) => {
    crearUsuario(usuario, (err, id) => {
        if (err) {
            event.reply('usuario-creado', { success: false, error: err.message });
        } else {
            event.reply('usuario-creado', { success: true, id });
        }
    });
});

ipcMain.on('obtener-usuarios', (event) => {
    obtenerUsuarios((err, usuarios) => {
        if (err) {
            event.reply('usuarios-obtenidos', { success: false, error: err.message });
        } else {
            event.reply('usuarios-obtenidos', { success: true, usuarios });
        }
    });
});

ipcMain.on('actualizar-usuario', (event, { id, usuario }) => {
    actualizarUsuario(id, usuario, (err) => {
        if (err) {
            event.reply('usuario-actualizado', { success: false, error: err.message });
        } else {
            event.reply('usuario-actualizado', { success: true });
        }
    });
});

ipcMain.on('eliminar-usuario', (event, id) => {
    eliminarUsuario(id, (err) => {
        if (err) {
            event.reply('usuario-eliminado', { success: false, error: err.message });
        } else {
            event.reply('usuario-eliminado', { success: true });
        }
    });
});

ipcMain.on('cambiar-password', (event, { id, nuevaPassword }) => {
    cambiarPassword(id, nuevaPassword, (err) => {
        if (err) {
            event.reply('password-cambiado', { success: false, error: err.message });
        } else {
            event.reply('password-cambiado', { success: true });
        }
    });
});

ipcMain.on('obtener-permisos-usuario', (event, usuarioId) => {
    obtenerPermisosUsuario(usuarioId, (err, permisos) => {
        if (err) {
            event.reply('permisos-usuario-obtenidos', { success: false, error: err.message });
        } else {
            event.reply('permisos-usuario-obtenidos', { success: true, permisos });
        }
    });
});

// IPC handlers para nuevas funcionalidades
ipcMain.on('obtener-productos-stock', (event) => {
    obtenerProductosConStock((err, productos) => {
        if (err) {
            event.reply('productos-stock-obtenidos', { success: false, error: err.message });
        } else {
            event.reply('productos-stock-obtenidos', { success: true, productos });
        }
    });
});

ipcMain.on('limpiar-datos-prueba', (event) => {
    limpiarDatosPrueba((err) => {
        if (err) {
            event.reply('datos-prueba-limpios', { success: false, error: err.message });
        } else {
            event.reply('datos-prueba-limpios', { success: true });
        }
    });
});

// IPC handler para calcular precio promedio
ipcMain.on('calcular-precio-promedio', (event, { producto_id, precio_compra, cantidad }) => {
    obtenerProductoPorId(producto_id, (err, producto) => {
        if (err) {
            event.reply('precio-promedio-calculado', { success: false, error: err.message });
            return;
        }

        if (producto) {
            // Calcular precio promedio
            const precioActual = producto.precio_venta || 0;
            const stockActual = producto.stock || 0;
            const nuevoPrecio = precio_compra;

            // Fórmula: ((precio_actual * stock_actual) + (precio_nuevo * cantidad)) / (stock_actual + cantidad)
            const precioPromedio = ((precioActual * stockActual) + (nuevoPrecio * cantidad)) / (stockActual + cantidad);

            event.reply('precio-promedio-calculado', {
                success: true,
                precio_promedio: precioPromedio
            });
        } else {
            event.reply('precio-promedio-calculado', {
                success: false,
                error: 'Producto no encontrado'
            });
        }
    });
});

// Función auxiliar para obtener producto por ID
function obtenerProductoPorId(id, callback) {
    db.get('SELECT * FROM productos WHERE id = ?', [id], callback);
}

// IPC handler para obtener impresoras
ipcMain.on('obtener-impresoras', (event) => {
    try {
    // Usar comando del sistema para obtener impresoras
        const command = process.platform === 'win32' ?
            'wmic printer get name,default /value' :
            'lpstat -p | awk \'{print $2}\'';

        exec(command, (error, stdout) => {
            if (error) {
                // Fallback si el comando falla
                event.reply('impresoras-obtenidas', {
                    success: true,
                    impresoras: [{
                        name: 'Impresora Predeterminada',
                        description: 'Impresora del sistema',
                        status: 'disponible',
                        isDefault: true
                    }]
                });
                return;
            }

            const impresoras = [];
            const lines = stdout.split('\n').filter(line => line.trim());

            if (process.platform === 'win32') {
                let currentPrinter = null;
                lines.forEach(line => {
                    if (line.startsWith('Name=')) {
                        currentPrinter = { name: line.substring(5), isDefault: false };
                    } else if (line.startsWith('Default=')) {
                        if (currentPrinter) {
                            currentPrinter.isDefault = line.substring(8) === 'TRUE';
                            impresoras.push({
                                name: currentPrinter.name,
                                description: currentPrinter.name,
                                status: 'disponible',
                                isDefault: currentPrinter.isDefault
                            });
                        }
                    }
                });
            } else {
                // Para Linux/Mac
                lines.forEach(line => {
                    impresoras.push({
                        name: line.trim(),
                        description: line.trim(),
                        status: 'disponible',
                        isDefault: impresoras.length === 0 // Primera impresora como predeterminada
                    });
                });
            }

            // Si no se encontraron impresoras, usar fallback
            if (impresoras.length === 0) {
                impresoras.push({
                    name: 'Impresora Predeterminada',
                    description: 'Impresora del sistema',
                    status: 'disponible',
                    isDefault: true
                });
            }

            event.reply('impresoras-obtenidas', {
                success: true,
                impresoras: impresoras
            });
        });
    } catch (error) {
        event.reply('impresoras-obtenidas', {
            success: false,
            error: error.message,
            impresoras: []
        });
    }
});
} else {
    console.error('ipcMain is not available');
}
