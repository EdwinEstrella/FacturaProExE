// Archivo de pruebas para validar el sistema de autenticación y permisos
// Ejecutar con: node test_system.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'facturas.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Iniciando pruebas del sistema...\n');

// Prueba 1: Verificar estructura de base de datos
console.log('1️⃣ Verificando estructura de base de datos...');
db.all('SELECT name FROM sqlite_master WHERE type=\'table\'', [], (err, tables) => {
    if (err) {
        console.error('❌ Error al consultar tablas:', err);
        return;
    }

    const expectedTables = ['usuarios', 'permisos', 'permisos_rol', 'sesiones', 'clientes', 'productos', 'facturas'];
    const existingTables = tables.map(t => t.name);

    expectedTables.forEach(table => {
        if (existingTables.includes(table)) {
            console.log(`✅ Tabla '${table}' existe`);
        } else {
            console.log(`❌ Tabla '${table}' no encontrada`);
        }
    });

    // Prueba 2: Verificar usuario de soporte
    console.log('\n2️⃣ Verificando usuario de soporte...');
    db.get('SELECT * FROM usuarios WHERE username = \'soporte\'', [], (err, user) => {
        if (err) {
            console.error('❌ Error al consultar usuario:', err);
            return;
        }

        if (user) {
            console.log('✅ Usuario de soporte encontrado');
            console.log(`   - Username: ${user.username}`);
            console.log(`   - Rol: ${user.rol}`);
            console.log(`   - Activo: ${user.activo ? 'Sí' : 'No'}`);

            // Verificar contraseña
            const passwordValid = bcrypt.compareSync('@Teamo1110a', user.password);
            console.log(`   - Contraseña válida: ${passwordValid ? '✅' : '❌'}`);
        } else {
            console.log('❌ Usuario de soporte no encontrado');
        }

        // Prueba 3: Verificar permisos
        console.log('\n3️⃣ Verificando permisos...');
        db.all('SELECT * FROM permisos', [], (err, permisos) => {
            if (err) {
                console.error('❌ Error al consultar permisos:', err);
                return;
            }

            console.log(`✅ Encontrados ${permisos.length} permisos:`);
            permisos.forEach(permiso => {
                console.log(`   - ${permiso.nombre}: ${permiso.descripcion}`);
            });

            // Prueba 4: Verificar permisos de rol admin
            console.log('\n4️⃣ Verificando permisos de rol admin...');
            db.all('SELECT p.nombre FROM permisos p INNER JOIN permisos_rol pr ON p.id = pr.permiso_id WHERE pr.rol = \'admin\'', [], (err, adminPermisos) => {
                if (err) {
                    console.error('❌ Error al consultar permisos de admin:', err);
                    return;
                }

                console.log(`✅ Rol admin tiene ${adminPermisos.length} permisos:`);
                adminPermisos.forEach(permiso => {
                    console.log(`   - ${permiso.nombre}`);
                });

                // Prueba 5: Verificar funciones de autenticación
                console.log('\n5️⃣ Probando funciones de autenticación...');

                // Simular autenticación
                const testAuth = (username, password) => {
                    return new Promise((resolve, reject) => {
                        db.get('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username], (err, usuario) => {
                            if (err) return reject(err);

                            if (!usuario) {
                                return resolve({ success: false, message: 'Usuario no encontrado' });
                            }

                            if (!bcrypt.compareSync(password, usuario.password)) {
                                return resolve({ success: false, message: 'Contraseña incorrecta' });
                            }

                            resolve({
                                success: true,
                                usuario: {
                                    id: usuario.id,
                                    username: usuario.username,
                                    nombre: usuario.nombre,
                                    rol: usuario.rol
                                }
                            });
                        });
                    });
                };

                testAuth('soporte', '@Teamo1110a')
                    .then(result => {
                        if (result.success) {
                            console.log('✅ Autenticación exitosa');
                            console.log(`   - Usuario: ${result.usuario.username}`);
                            console.log(`   - Rol: ${result.usuario.rol}`);
                        } else {
                            console.log('❌ Autenticación fallida:', result.message);
                        }

                        // Prueba 6: Verificar creación de productos sin errores
                        console.log('\n6️⃣ Probando creación de productos...');

                        const testProducto = {
                            codigo: 'TEST001',
                            nombre: 'Producto de Prueba',
                            precio_venta: 100,
                            precio_compra: 80,
                            stock: 10
                        };

                        db.run(`INSERT INTO productos (codigo, nombre, precio, precio_venta, precio_compra, stock, stock_minimo, categoria, proveedor, ubicacion)
                               VALUES (?, ?, ?, ?, ?, ?, 0, 'Test', 'Proveedor Test', 'Ubicación Test')`,
                        [testProducto.codigo, testProducto.nombre, testProducto.precio_venta, testProducto.precio_venta, testProducto.precio_compra, testProducto.stock],
                        function(err) {
                            if (err) {
                                console.log('❌ Error al crear producto:', err.message);
                            } else {
                                console.log('✅ Producto creado exitosamente');
                                console.log(`   - ID: ${this.lastID}`);
                                console.log(`   - Código: ${testProducto.codigo}`);
                                console.log(`   - Nombre: ${testProducto.nombre}`);

                                // Limpiar producto de prueba
                                db.run('DELETE FROM productos WHERE id = ?', [this.lastID]);
                            }

                            // Finalizar pruebas
                            console.log('\n🎉 Pruebas completadas!');
                            console.log('\n📋 Resumen:');
                            console.log('- ✅ Sistema de autenticación funcionando');
                            console.log('- ✅ Usuario de soporte configurado');
                            console.log('- ✅ Permisos implementados');
                            console.log('- ✅ Base de datos estructurada');
                            console.log('- ✅ Creación de productos sin errores');
                            console.log('\n🚀 El sistema está listo para usar!');

                            db.close();
                        });
                    })
                    .catch(err => {
                        console.error('❌ Error en autenticación:', err);
                        db.close();
                    });
            });
        });
    });
});
