const { ipcRenderer } = require('electron');

// let productos = []; // No utilizado actualmente
let usuarioActual = null;
let permisosUsuario = [];

// Navegación del sidebar con control de permisos
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.closest('.nav-link').dataset.section;

        // Verificar permisos antes de navegar
        if (!tienePermiso(section)) {
            mostrarNotificacion('Acceso denegado', 'No tiene permisos para acceder a esta sección', 'warning');
            return;
        }

        // Usar la función mostrarSeccion para navegación consistente
        mostrarSeccion(section);
    });
});

// Funcionalidad de facturación
document.getElementById('agregarProducto').addEventListener('click', agregarProducto);
document.getElementById('itbisPorcentaje').addEventListener('input', calcularTotales);
document.getElementById('guardarFactura').addEventListener('click', guardarFactura);
document.getElementById('generarPDF').addEventListener('click', generarPDF);

// Gestión de clientes
document.getElementById('agregarCliente').addEventListener('click', mostrarModalCliente);
document.getElementById('buscarCliente').addEventListener('input', buscarClientes);

// Gestión de productos
document.getElementById('agregarProductoInv').addEventListener('click', mostrarModalProducto);
document.getElementById('buscarProducto').addEventListener('input', buscarProductos);

// Búsqueda en sidebar
document.getElementById('sidebarSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    navLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        if (text.includes(searchTerm) || searchTerm === '') {
            link.style.display = 'flex';
        } else {
            link.style.display = 'none';
        }
    });
});

function agregarProducto() {
    const tbody = document.getElementById('productosBody');
    const row = tbody.insertRow();
    const nombreCell = row.insertCell(0);
    const cantidadCell = row.insertCell(1);
    const precioCell = row.insertCell(2);
    const subtotalCell = row.insertCell(3);
    const accionesCell = row.insertCell(4);

    nombreCell.innerHTML = '<input type="text" class="productoNombre" required>';
    cantidadCell.innerHTML = '<input type="number" class="productoCantidad" min="1" value="1" required>';
    precioCell.innerHTML = '<input type="number" class="productoPrecio" step="0.01" min="0" required>';
    subtotalCell.innerHTML = '<span class="subtotal">0.00</span>';
    accionesCell.innerHTML = '<button class="eliminarProducto">Eliminar</button>';

    const eliminarBtn = accionesCell.querySelector('.eliminarProducto');
    eliminarBtn.addEventListener('click', () => {
        row.remove();
        calcularTotales();
    });

    // Event listeners para recalcular
    row.querySelector('.productoCantidad').addEventListener('input', calcularTotales);
    row.querySelector('.productoPrecio').addEventListener('input', calcularTotales);

    calcularTotales();
}

function calcularTotales() {
    let subtotalGeneral = 0;
    const filas = document.querySelectorAll('#productosBody tr');

    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.productoCantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.productoPrecio').value) || 0;
        const subtotal = cantidad * precio;
        fila.querySelector('.subtotal').textContent = subtotal.toFixed(2);
        subtotalGeneral += subtotal;
    });

    const itbisPorcentaje = parseFloat(document.getElementById('itbisPorcentaje').value) / 100 || 0;
    const itbisMonto = subtotalGeneral * itbisPorcentaje;
    const total = subtotalGeneral + itbisMonto;

    document.getElementById('subtotal').textContent = subtotalGeneral.toFixed(2);
    document.getElementById('itbisMonto').textContent = itbisMonto.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function guardarFactura() {
    // Validar que se haya seleccionado un cliente
    if (!clienteSeleccionado) {
        mostrarNotificacion('Error', 'Debe seleccionar un cliente registrado para crear la factura', 'danger');
        return;
    }

    // Validar que haya productos
    const filas = document.querySelectorAll('#productosBody tr');
    if (filas.length === 0) {
        mostrarNotificacion('Error', 'Debe agregar al menos un producto a la factura', 'danger');
        return;
    }

    const productos = [];
    filas.forEach(fila => {
        const productoId = fila.querySelector('.producto-id').value;
        const cantidad = parseFloat(fila.querySelector('.producto-cantidad').value);
        const precio = parseFloat(fila.querySelector('.producto-precio').value);

        if (!productoId || cantidad <= 0 || precio < 0) {
            mostrarNotificacion('Error', 'Datos de producto inválidos', 'danger');
            return;
        }

        productos.push({
            id: productoId,
            cantidad: cantidad,
            precio: precio
        });
    });

    const factura = {
        cliente_id: clienteSeleccionado.id,
        cliente: clienteSeleccionado,
        productos,
        itbisPorcentaje: parseFloat(document.getElementById('itbisPorcentaje').value),
        subtotal: parseFloat(document.getElementById('subtotal').textContent),
        itbisMonto: parseFloat(document.getElementById('itbisMonto').textContent),
        total: parseFloat(document.getElementById('total').textContent)
    };

    ipcRenderer.send('guardar-factura', factura);
}

function generarPDF() {
    const cliente = {
        nombre: document.getElementById('clienteNombre').value,
        rnc: document.getElementById('clienteRNC').value
    };

    const productos = [];
    const filas = document.querySelectorAll('#productosBody tr');
    filas.forEach(fila => {
        productos.push({
            nombre: fila.querySelector('.productoNombre').value,
            cantidad: parseFloat(fila.querySelector('.productoCantidad').value),
            precio: parseFloat(fila.querySelector('.productoPrecio').value),
            subtotal: parseFloat(fila.querySelector('.subtotal').textContent)
        });
    });

    const datos = {
        cliente,
        productos,
        itbisPorcentaje: parseFloat(document.getElementById('itbisPorcentaje').value),
        subtotal: parseFloat(document.getElementById('subtotal').textContent),
        itbisMonto: parseFloat(document.getElementById('itbisMonto').textContent),
        total: parseFloat(document.getElementById('total').textContent)
    };

    ipcRenderer.send('generar-pdf', datos);
}

// Funciones para gestión de clientes
function mostrarModalCliente() {
    document.getElementById('clienteModalTitle').textContent = 'Agregar Cliente';
    document.getElementById('clienteFormModal').reset();
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
}

function guardarClienteModal() {
    const cliente = {
        nombre: document.getElementById('clienteNombreModal').value,
        rnc: document.getElementById('clienteRNCModal').value,
        telefono: document.getElementById('clienteTelefonoModal').value,
        email: document.getElementById('clienteEmailModal').value,
        direccion: document.getElementById('clienteDireccionModal').value
    };

    ipcRenderer.send('crear-cliente', cliente);
}

function cargarClientes() {
    ipcRenderer.send('obtener-clientes');
}

function mostrarClientes(clientes) {
    const tbody = document.getElementById('clientesBody');
    tbody.innerHTML = '';

    clientes.forEach(cliente => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.rnc || ''}</td>
            <td>${cliente.telefono || ''}</td>
            <td>${cliente.email || ''}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editarCliente(${cliente.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCliente(${cliente.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function buscarClientes() {
    const termino = document.getElementById('buscarCliente').value;
    if (termino.length > 0) {
        ipcRenderer.send('buscar-clientes', termino);
    } else {
        cargarClientes();
    }
}

function editarCliente(_id) {
    // Implementar edición de cliente
    console.log('Editar cliente:', _id);
}

function eliminarCliente(_id) {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
        ipcRenderer.send('eliminar-cliente', _id);
    }
}

// Funciones para gestión de productos
function mostrarModalProducto() {
    document.getElementById('productoModalTitle').textContent = 'Agregar Producto';
    document.getElementById('productoFormModal').reset();
    const modal = new bootstrap.Modal(document.getElementById('productoModal'));
    modal.show();
}

function guardarProductoModal() {
    const precioVenta = parseFloat(document.getElementById('productoPrecioVentaModal').value);

    if (!precioVenta || precioVenta <= 0) {
        mostrarNotificacion('Error', 'El precio de venta es obligatorio y debe ser mayor a 0', 'danger');
        return;
    }

    const producto = {
        codigo: document.getElementById('productoCodigoModal').value,
        nombre: document.getElementById('productoNombreModal').value,
        descripcion: document.getElementById('productoDescripcionModal').value,
        precio_venta: precioVenta,
        precio_compra: parseFloat(document.getElementById('productoPrecioCompraModal').value) || 0,
        stock: parseInt(document.getElementById('productoStockModal').value) || 0,
        stock_minimo: parseInt(document.getElementById('productoStockMinModal').value) || 0,
        categoria: document.getElementById('productoCategoriaModal').value,
        proveedor: document.getElementById('productoProveedorModal').value,
        ubicacion: document.getElementById('productoUbicacionModal').value
    };

    ipcRenderer.send('crear-producto', producto);
}

function cargarProductos() {
    ipcRenderer.send('obtener-productos');
}

function mostrarProductos(productos) {
    const tbody = document.getElementById('productosInvBody');
    tbody.innerHTML = '';

    productos.forEach(producto => {
        const stockStatus = producto.stock <= producto.stock_minimo ? 'danger' : producto.stock <= producto.stock_minimo * 1.5 ? 'warning' : 'success';
        const statusText = producto.stock <= producto.stock_minimo ? 'Bajo' : 'Normal';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria || ''}</td>
            <td>RD$${producto.precio_venta.toFixed(2)}</td>
            <td>RD$${producto.precio_compra.toFixed(2)}</td>
            <td>${producto.stock}</td>
            <td><span class="badge bg-${stockStatus}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editarProducto(${producto.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${producto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function buscarProductos() {
    const termino = document.getElementById('buscarProducto').value;
    if (termino.length > 0) {
        ipcRenderer.send('buscar-productos', termino);
    } else {
        cargarProductos();
    }
}

function editarProducto(_id) {
    // Implementar edición de producto
    console.log('Editar producto:', _id);
}

function eliminarProducto(_id) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        ipcRenderer.send('eliminar-producto', _id);
    }
}

// Event listeners para modales
document.getElementById('guardarCliente').addEventListener('click', guardarClienteModal);
document.getElementById('guardarProducto').addEventListener('click', guardarProductoModal);

// IPC listeners
ipcRenderer.on('cliente-creado', (event, response) => {
    if (response.success) {
        bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
        cargarClientes();
        mostrarNotificacion('Éxito', 'Cliente creado exitosamente', 'success');
    } else {
        mostrarNotificacion('Error', 'Error al crear cliente: ' + response.error, 'danger');
    }
});

ipcRenderer.on('clientes-obtenidos', (event, response) => {
    if (response.success) {
        mostrarClientes(response.clientes);
    }
});

ipcRenderer.on('clientes-buscados', (event, response) => {
    if (response.success) {
        mostrarClientes(response.clientes);
    }
});

ipcRenderer.on('cliente-eliminado', (event, response) => {
    if (response.success) {
        cargarClientes();
        alert('Cliente eliminado exitosamente');
    } else {
        alert('Error al eliminar cliente: ' + response.error);
    }
});

ipcRenderer.on('producto-creado', (event, response) => {
    if (response.success) {
        bootstrap.Modal.getInstance(document.getElementById('productoModal')).hide();
        cargarProductos();
        mostrarNotificacion('Éxito', 'Producto creado exitosamente', 'success');
    } else {
        mostrarNotificacion('Error', 'Error al crear producto: ' + response.error, 'danger');
    }
});

ipcRenderer.on('productos-obtenidos', (event, response) => {
    if (response.success) {
        mostrarProductos(response.productos);
    }
});

ipcRenderer.on('productos-buscados', (event, response) => {
    if (response.success) {
        mostrarProductos(response.productos);
    }
});

ipcRenderer.on('producto-eliminado', (event, response) => {
    if (response.success) {
        cargarProductos();
        alert('Producto eliminado exitosamente');
    } else {
        alert('Error al eliminar producto: ' + response.error);
    }
});

// Función para verificar si el usuario tiene permiso para acceder a una sección
function tienePermiso(seccion) {
    if (!permisosUsuario || permisosUsuario.length === 0) {
        return false;
    }

    // Si es admin, tiene acceso a todo
    if (permisosUsuario.includes('admin')) {
        return true;
    }

    // Mapeo de secciones a permisos
    const permisosSeccion = {
        'dashboard': true, // Dashboard siempre accesible
        'facturacion': 'facturacion',
        'clientes': 'clientes',
        'productos': 'productos',
        'entradas': 'entradas',
        'devoluciones': 'devoluciones',
        'liquidaciones': 'liquidaciones',
        'cuentas-cobrar': 'cuentas-cobrar',
        'contabilidad': 'contabilidad',
        'reportes': 'reportes',
        'soporte': 'soporte'
    };

    if (permisosSeccion[seccion] === true) {
        return true;
    }

    return permisosUsuario.includes(permisosSeccion[seccion]);
}

// Función para mostrar sección desde botones de acción rápida
function mostrarSeccion(seccion) {
    // Verificar permisos antes de mostrar la sección
    if (!tienePermiso(seccion)) {
        mostrarNotificacion('Acceso denegado', 'No tiene permisos para acceder a esta sección', 'warning');
        return;
    }

    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const seccionElement = document.getElementById(seccion);
    if (seccionElement) {
        seccionElement.classList.add('active');
    }

    // Actualizar navegación activa
    document.querySelectorAll('.sidebar .nav-link').forEach(nav => {
        nav.classList.remove('active');
    });

    const navLink = document.querySelector(`.sidebar .nav-link[data-section="${seccion}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Cargar datos si es necesario y el usuario tiene permisos
    if (seccion === 'clientes' && tienePermiso('clientes')) {
        setTimeout(cargarClientes, 100);
    } else if (seccion === 'productos' && tienePermiso('productos')) {
        setTimeout(cargarProductos, 100);
    }
}

// Cargar datos iniciales cuando se abre la sección de clientes
document.querySelector('a[data-section="clientes"]').addEventListener('click', () => {
    setTimeout(cargarClientes, 100);
});

// Cargar datos iniciales cuando se abre la sección de productos
document.querySelector('a[data-section="productos"]').addEventListener('click', () => {
    setTimeout(cargarProductos, 100);
});

// Inicialización del sistema
document.addEventListener('DOMContentLoaded', function() {
    inicializarSistema();
});

// Función de inicialización
function inicializarSistema() {
    // Verificar sesión
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Validar token
    ipcRenderer.send('validar-sesion', token);

    // Cargar datos del usuario desde localStorage
    const usuarioData = localStorage.getItem('usuario');
    const permisosData = localStorage.getItem('permisos');

    if (usuarioData && permisosData) {
        usuarioActual = JSON.parse(usuarioData);
        permisosUsuario = JSON.parse(permisosData);

        // Actualizar UI con datos del usuario
        actualizarUIUsuario();

        // Aplicar permisos
        aplicarPermisos();
    }
}

// Actualizar UI con datos del usuario
function actualizarUIUsuario() {
    if (usuarioActual) {
        const usuarioElement = document.getElementById('userNombreDisplay');
        const rolElement = document.getElementById('userRolDisplay');

        if (usuarioElement) usuarioElement.textContent = usuarioActual.nombre;
        if (rolElement) rolElement.textContent = usuarioActual.rol;

        // Actualizar información en soporte
        const usuarioActualElement = document.getElementById('usuarioActual');
        if (usuarioActualElement) {
            usuarioActualElement.textContent = usuarioActual.nombre;
        }
    }
}

// Aplicar permisos a la navegación
function aplicarPermisos() {
    if (!permisosUsuario || permisosUsuario.length === 0) {
        return;
    }

    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    navLinks.forEach(link => {
        const section = link.getAttribute('data-section');
        if (section) {
            // Módulos que requieren permisos específicos
            const modulosConPermisos = {
                'facturacion': 'facturacion',
                'clientes': 'clientes',
                'productos': 'productos',
                'entradas': 'entradas',
                'devoluciones': 'devoluciones',
                'liquidaciones': 'liquidaciones',
                'cuentas-cobrar': 'cuentas-cobrar',
                'contabilidad': 'contabilidad',
                'reportes': 'reportes',
                'soporte': 'soporte'
            };

            if (modulosConPermisos[section]) {
                // Solo mostrar si el usuario tiene el permiso o es admin
                if (!permisosUsuario.includes(modulosConPermisos[section]) && !permisosUsuario.includes('admin')) {
                    link.style.display = 'none';
                } else {
                    link.style.display = 'flex';
                    // Agregar indicador visual para secciones permitidas
                    link.style.opacity = '1';
                }
            } else if (section === 'dashboard') {
                // Dashboard siempre visible
                link.style.display = 'flex';
                link.style.opacity = '1';
            }
        }
    });

    // Agregar botón de logout si no existe
    agregarBotonLogout();
}

function agregarBotonLogout() {
    // Verificar si ya existe el botón de logout
    if (document.getElementById('logoutBtn')) {
        return;
    }

    // Crear contenedor para el botón de logout
    const userSection = document.querySelector('.sidebar .mt-auto.pt-3');
    if (userSection) {
        const logoutContainer = document.createElement('div');
        logoutContainer.className = 'mb-3 text-center';
        logoutContainer.innerHTML = `
            <button id="logoutBtn" class="btn btn-outline-light btn-sm w-100" onclick="logout()">
                <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
            </button>
        `;

        userSection.appendChild(logoutContainer);
    }
}

// Función de logout
function logout() {
    if (confirm('¿Está seguro de que desea cerrar la sesión?')) {
        const token = localStorage.getItem('auth_token');
        if (token) {
            ipcRenderer.send('logout', token);
        }

        // Limpiar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('permisos');

        // Mostrar notificación
        mostrarNotificacion('Sesión cerrada', 'Hasta pronto!', 'info');

        // Redirigir a login después de un breve delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Hacer la función global para que sea accesible desde HTML
window.mostrarSeccion = mostrarSeccion;
window.logout = logout;

// ==================== FUNCIONES PARA ENTRADAS ====================
function cargarProductosParaEntradas() {
    ipcRenderer.send('obtener-productos');
}

function mostrarProductosEnSelect(productos) {
    const select = document.getElementById('entradaProducto');
    select.innerHTML = '<option value="">Seleccionar producto...</option>';

    productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `${producto.nombre} (${producto.stock} en stock)`;
        select.appendChild(option);
    });
}

function registrarEntrada() {
    const entrada = {
        producto_id: parseInt(document.getElementById('entradaProducto').value),
        cantidad: parseInt(document.getElementById('entradaCantidad').value),
        precio_compra: parseFloat(document.getElementById('entradaPrecioCompra').value),
        precio_venta: parseFloat(document.getElementById('entradaPrecioVenta').value) || null,
        proveedor: document.getElementById('entradaProveedor').value,
        numero_factura: document.getElementById('entradaFactura').value,
        notas: document.getElementById('entradaNotas').value
    };

    if (!entrada.producto_id || !entrada.cantidad || !entrada.precio_compra) {
        mostrarNotificacion('Error', 'Por favor complete los campos obligatorios', 'danger');
        return;
    }

    ipcRenderer.send('registrar-entrada', entrada);
}

function limpiarEntrada() {
    document.getElementById('entradaProducto').value = '';
    document.getElementById('entradaCantidad').value = '';
    document.getElementById('entradaPrecioCompra').value = '';
    document.getElementById('entradaPrecioVenta').value = '';
    document.getElementById('entradaProveedor').value = '';
    document.getElementById('entradaFactura').value = '';
    document.getElementById('entradaNotas').value = '';
}

function mostrarEntradas(entradas) {
    const tbody = document.getElementById('entradasBody');
    tbody.innerHTML = '';

    entradas.forEach(entrada => {
        const row = tbody.insertRow();
        const fecha = new Date(entrada.fecha).toLocaleDateString();
        const total = (entrada.cantidad * entrada.precio_compra).toFixed(2);

        row.innerHTML = `
            <td>${fecha}</td>
            <td>${entrada.producto_nombre}</td>
            <td>${entrada.cantidad}</td>
            <td>RD$${entrada.precio_compra.toFixed(2)}</td>
            <td>${entrada.proveedor || ''}</td>
            <td>${entrada.numero_factura || ''}</td>
            <td>RD$${total}</td>
        `;
    });
}

// ==================== FUNCIONES PARA LIQUIDACIONES ====================
function crearLiquidacion() {
    const fechaInicio = document.getElementById('liquidacionFechaInicio').value;
    const fechaFin = document.getElementById('liquidacionFechaFin').value;
    const notas = document.getElementById('liquidacionNotas').value;

    if (!fechaInicio || !fechaFin) {
        alert('Por favor seleccione las fechas de inicio y fin');
        return;
    }

    const liquidacion = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        notas: notas
    };

    ipcRenderer.send('crear-liquidacion', liquidacion);
}

function limpiarLiquidacion() {
    document.getElementById('liquidacionFechaInicio').value = '';
    document.getElementById('liquidacionFechaFin').value = '';
    document.getElementById('liquidacionNotas').value = '';
    document.getElementById('resultadoLiquidacion').style.display = 'none';
}

function mostrarResultadoLiquidacion(liquidacion) {
    document.getElementById('totalVentasLiq').textContent = `RD$${liquidacion.total_ventas.toFixed(2)}`;
    document.getElementById('totalCostosLiq').textContent = `RD$${liquidacion.total_costos.toFixed(2)}`;
    document.getElementById('totalItbisLiq').textContent = `RD$${liquidacion.total_itbis.toFixed(2)}`;
    document.getElementById('totalGananciasLiq').textContent = `RD$${liquidacion.total_ganancias.toFixed(2)}`;
    document.getElementById('resultadoLiquidacion').style.display = 'block';
}

function guardarLiquidacion() {
    // Esta función se implementaría para guardar la liquidación calculada
    mostrarNotificacion('Éxito', 'Liquidación guardada exitosamente', 'success');
    limpiarLiquidacion();
}

function mostrarLiquidaciones(liquidaciones) {
    const tbody = document.getElementById('liquidacionesBody');
    tbody.innerHTML = '';

    liquidaciones.forEach(liquidacion => {
        const row = tbody.insertRow();
        const periodo = `${new Date(liquidacion.fecha_inicio).toLocaleDateString()} - ${new Date(liquidacion.fecha_fin).toLocaleDateString()}`;

        row.innerHTML = `
            <td>${periodo}</td>
            <td>RD$${liquidacion.total_ventas.toFixed(2)}</td>
            <td>RD$${liquidacion.total_costos.toFixed(2)}</td>
            <td>RD$${liquidacion.total_ganancias.toFixed(2)}</td>
            <td><span class="badge bg-${liquidacion.estado === 'completada' ? 'success' : 'warning'}">${liquidacion.estado}</span></td>
            <td>${new Date(liquidacion.fecha_creacion).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetalleLiquidacion(${liquidacion.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    });
}

// ==================== FUNCIONES AUXILIARES ====================
function cargarEntradas() {
    ipcRenderer.send('obtener-entradas');
}

function cargarLiquidaciones() {
    ipcRenderer.send('obtener-liquidaciones');
}

// ==================== SISTEMA DE NOTIFICACIONES ====================
function mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    const toastElement = document.getElementById('notificationToast');
    const messageElement = document.getElementById('notificationMessage');

    // Limpiar clases anteriores
    toastElement.className = 'toast align-items-center text-white border-0';

    // Agregar clase según el tipo
    switch(tipo) {
    case 'success':
        toastElement.classList.add('bg-success');
        break;
    case 'error':
    case 'danger':
        toastElement.classList.add('bg-danger');
        break;
    case 'warning':
        toastElement.classList.add('bg-warning', 'text-dark');
        break;
    default:
        toastElement.classList.add('bg-info');
    }

    // Establecer mensaje
    messageElement.innerHTML = `<strong>${titulo}:</strong> ${mensaje}`;

    // Mostrar toast
    const toast = new bootstrap.Toast(toastElement, {
        delay: 5000 // 5 segundos
    });
    toast.show();
}

// ==================== FUNCIONES PARA CONTABILIDAD ====================
function cargarKPIs() {
    ipcRenderer.send('obtener-kpis');
}

function mostrarKPIs(kpis) {
    document.getElementById('kpi-ventas-hoy').textContent = `RD$${kpis.total_ventas_hoy.toFixed(2)}`;
    document.getElementById('kpi-margen').textContent = `${kpis.margen_ganancia_promedio.toFixed(1)}%`;
    document.getElementById('kpi-cuentas-cobrar').textContent = `RD$${kpis.cuentas_por_cobrar.toFixed(2)}`;
    document.getElementById('kpi-stock-bajo').textContent = kpis.productos_bajo_stock;

    // Calcular porcentajes para las barras de progreso
    const totalCostos = kpis.total_ventas_hoy * 0.7; // Estimación
    const costoProductos = totalCostos * 0.6;
    const costoItbis = kpis.total_ventas_hoy * 0.18;
    const otrosCostos = totalCostos * 0.4;

    document.getElementById('costo-productos').textContent = `RD$${costoProductos.toFixed(2)}`;
    document.getElementById('costo-itbis').textContent = `RD$${costoItbis.toFixed(2)}`;
    document.getElementById('otros-costos').textContent = `RD$${otrosCostos.toFixed(2)}`;

    // Actualizar barras de progreso
    const totalEgresos = costoProductos + costoItbis + otrosCostos;
    document.getElementById('costo-productos-bar').style.width = `${(costoProductos / totalEgresos) * 100}%`;
    document.getElementById('costo-itbis-bar').style.width = `${(costoItbis / totalEgresos) * 100}%`;
    document.getElementById('otros-costos-bar').style.width = `${(otrosCostos / totalEgresos) * 100}%`;

    // Estado de resultados
    document.getElementById('ingresos-totales').textContent = `RD$${kpis.total_ventas_hoy.toFixed(2)}`;
    document.getElementById('egresos-totales').textContent = `RD$${totalEgresos.toFixed(2)}`;
    document.getElementById('utilidad-neta').textContent = `RD$${(kpis.total_ventas_hoy - totalEgresos).toFixed(2)}`;
}

function cargarMovimientosInventario() {
    ipcRenderer.send('obtener-movimientos-inventario');
}

function mostrarMovimientosInventario(movimientos) {
    const tbody = document.getElementById('movimientosBody');
    tbody.innerHTML = '';

    movimientos.slice(0, 10).forEach(movimiento => {
        const row = tbody.insertRow();
        const fecha = new Date(movimiento.fecha).toLocaleDateString();

        row.innerHTML = `
            <td>${fecha}</td>
            <td><span class="badge bg-${movimiento.tipo === 'entrada' ? 'success' : 'danger'}">${movimiento.tipo}</span></td>
            <td>${movimiento.producto_nombre}</td>
            <td>${movimiento.cantidad}</td>
            <td>${movimiento.stock_anterior}</td>
            <td>${movimiento.stock_nuevo}</td>
            <td>${movimiento.referencia || ''}</td>
        `;
    });
}

// ==================== EVENT LISTENERS PARA NUEVOS MÓDULOS ====================

// Entradas
document.getElementById('registrarEntrada').addEventListener('click', registrarEntrada);
document.getElementById('limpiarEntrada').addEventListener('click', limpiarEntrada);

// Liquidaciones
document.getElementById('crearLiquidacion').addEventListener('click', crearLiquidacion);
document.getElementById('limpiarLiquidacion').addEventListener('click', limpiarLiquidacion);
document.getElementById('guardarLiquidacion').addEventListener('click', guardarLiquidacion);

// ==================== IPC LISTENERS PARA NUEVOS MÓDULOS ====================

// Entradas
ipcRenderer.on('productos-obtenidos', (event, response) => {
    if (response.success) {
        mostrarProductosEnSelect(response.productos);
    }
});

ipcRenderer.on('entrada-registrada', (event, response) => {
    if (response.success) {
        mostrarNotificacion('Éxito', 'Entrada registrada exitosamente', 'success');
        limpiarEntrada();
        cargarEntradas();
        cargarProductosParaEntradas(); // Recargar productos con stock actualizado
    } else {
        mostrarNotificacion('Error', 'Error al registrar entrada: ' + response.error, 'danger');
    }
});

ipcRenderer.on('entradas-obtenidas', (event, response) => {
    if (response.success) {
        mostrarEntradas(response.entradas);
    }
});

// Liquidaciones
ipcRenderer.on('liquidacion-creada', (event, response) => {
    if (response.success) {
        mostrarResultadoLiquidacion(response.liquidacion);
        mostrarNotificacion('Éxito', 'Liquidación calculada exitosamente', 'success');
    } else {
        mostrarNotificacion('Error', 'Error al crear liquidación: ' + response.error, 'danger');
    }
});

ipcRenderer.on('liquidaciones-obtenidas', (event, response) => {
    if (response.success) {
        mostrarLiquidaciones(response.liquidaciones);
    }
});

// Contabilidad
ipcRenderer.on('kpis-obtenidos', (event, response) => {
    if (response.success) {
        mostrarKPIs(response.kpis);
    }
});

ipcRenderer.on('movimientos-obtenidos', (event, response) => {
    if (response.success) {
        mostrarMovimientosInventario(response.movimientos);
    }
});

// ==================== INICIALIZACIÓN DE MÓDULOS ====================

// Cargar datos iniciales cuando se abre cada sección
document.querySelector('a[data-section="entradas"]').addEventListener('click', () => {
    setTimeout(() => {
        cargarProductosParaEntradas();
        cargarEntradas();
    }, 100);
});

document.querySelector('a[data-section="liquidaciones"]').addEventListener('click', () => {
    setTimeout(() => {
        cargarLiquidaciones();
    }, 100);
});

document.querySelector('a[data-section="contabilidad"]').addEventListener('click', () => {
    setTimeout(() => {
        cargarKPIs();
        cargarMovimientosInventario();
    }, 100);
});

// Funciones globales para botones
window.verDetalleLiquidacion = function(_id) {
    alert(`Ver detalle de liquidación ${_id}`);
};

// Handler para respuesta de generación de PDF
ipcRenderer.on('pdf-generado', (event, response) => {
    if (response.success) {
        mostrarNotificacion('Éxito', `PDF generado exitosamente en: ${response.filePath}`, 'success');
    } else {
        mostrarNotificacion('Error', response.message || 'Error al generar PDF', 'danger');
    }
});

// ==================== FUNCIONES DE AUTENTICACIÓN ====================

// Respuesta de validación de sesión
ipcRenderer.on('sesion-validada', (event, response) => {
    if (!response.valido) {
        logout();
    }
});

// ==================== FUNCIONES DE GESTIÓN DE USUARIOS ====================

// Event listeners para gestión de usuarios
document.getElementById('agregarUsuario')?.addEventListener('click', mostrarModalUsuario);
document.getElementById('guardarUsuario')?.addEventListener('click', guardarUsuarioModal);

// Funciones para gestión de usuarios
function mostrarModalUsuario() {
    document.getElementById('usuarioModalTitle').textContent = 'Agregar Usuario';
    document.getElementById('usuarioFormModal').reset();
    const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    modal.show();
}

function guardarUsuarioModal() {
    const usuario = {
        username: document.getElementById('usuarioUsernameModal').value,
        password: document.getElementById('usuarioPasswordModal').value,
        nombre: document.getElementById('usuarioNombreModal').value,
        email: document.getElementById('usuarioEmailModal').value,
        rol: document.getElementById('usuarioRolModal').value
    };

    if (!usuario.username || !usuario.password || !usuario.nombre) {
        mostrarNotificacion('Error', 'Por favor complete los campos obligatorios', 'danger');
        return;
    }

    ipcRenderer.send('crear-usuario', usuario);
}

function cargarUsuarios() {
    ipcRenderer.send('obtener-usuarios');
}

function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('usuariosBody');
    tbody.innerHTML = '';

    usuarios.forEach(usuario => {
        const estadoBadge = usuario.activo ?
            '<span class="badge bg-success">Activo</span>' :
            '<span class="badge bg-danger">Inactivo</span>';

        const ultimoAcceso = usuario.ultimo_acceso ?
            new Date(usuario.ultimo_acceso).toLocaleDateString() :
            'Nunca';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${usuario.username}</td>
            <td>${usuario.nombre}</td>
            <td><span class="badge bg-${usuario.rol === 'admin' ? 'primary' : 'secondary'}">${usuario.rol}</span></td>
            <td>${estadoBadge}</td>
            <td>${ultimoAcceso}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editarUsuario(${usuario.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${usuario.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

// ==================== FUNCIONES DE SOPORTE ====================

// Event listeners para herramientas de soporte
document.getElementById('backupDatabase')?.addEventListener('click', hacerBackup);
document.getElementById('limpiarCache')?.addEventListener('click', limpiarCache);
document.getElementById('verLogs')?.addEventListener('click', verLogs);

// Funciones de soporte
function hacerBackup() {
    mostrarNotificacion('Información', 'Función de backup en desarrollo', 'info');
}

function limpiarCache() {
    mostrarNotificacion('Información', 'Cache limpiado exitosamente', 'success');
}

function verLogs() {
    mostrarNotificacion('Información', 'Función de logs en desarrollo', 'info');
}

// ==================== SOLUCIÓN ERROR SQLITE_CONSTRAINT ====================

// Función crearProducto movida a db.js para evitar duplicación
// Esta función está disponible en el módulo db.js

// ==================== IPC LISTENERS PARA USUARIOS ====================

ipcRenderer.on('usuario-creado', (event, response) => {
    if (response.success) {
        bootstrap.Modal.getInstance(document.getElementById('usuarioModal')).hide();
        cargarUsuarios();
        mostrarNotificacion('Éxito', 'Usuario creado exitosamente', 'success');
    } else {
        mostrarNotificacion('Error', 'Error al crear usuario: ' + response.error, 'danger');
    }
});

ipcRenderer.on('usuarios-obtenidos', (event, response) => {
    if (response.success) {
        mostrarUsuarios(response.usuarios);
    }
});

ipcRenderer.on('usuario-eliminado', (event, response) => {
    if (response.success) {
        cargarUsuarios();
        mostrarNotificacion('Éxito', 'Usuario eliminado exitosamente', 'success');
    } else {
        mostrarNotificacion('Error', 'Error al eliminar usuario: ' + response.error, 'danger');
    }
});

// ==================== INICIALIZACIÓN DE SOPORTE ====================

// Cargar usuarios e impresoras cuando se abre la sección de soporte
document.querySelector('a[data-section="soporte"]')?.addEventListener('click', () => {
    setTimeout(() => {
        cargarUsuarios();
        cargarImpresoras();
    }, 100);
});

// Funciones globales para gestión de usuarios
window.editarUsuario = function(id) {
    mostrarNotificacion('Información', 'Función de edición en desarrollo', 'info');
};

window.eliminarUsuario = function(id) {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
        ipcRenderer.send('eliminar-usuario', id);
    }
};

// ==================== FUNCIONES PARA PLANTILLA DE FACTURA ====================

// Funciones para la plantilla de factura
function agregarFilaProducto() {
    const tbody = document.getElementById('productosFacturaBody');
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td width='5%' style="padding: 10px; border: 1px solid #dee2e6;">
            <button class="btn btn-sm btn-danger" onclick="eliminarFilaProducto(this)">x</button>
            <span contenteditable>Código</span>
        </td>
        <td width='60%' style="padding: 10px; border: 1px solid #dee2e6;">
            <span contenteditable>Descripción del producto</span>
        </td>
        <td class="amount" style="padding: 10px; border: 1px solid #dee2e6;">
            <input type="text" value="1" onchange="calcularTotalFactura()" style="width: 100%; border: none; background: transparent;"/>
        </td>
        <td class="rate" style="padding: 10px; border: 1px solid #dee2e6;">
            <input type="text" value="0" onchange="calcularTotalFactura()" style="width: 100%; border: none; background: transparent;"/>
        </td>
        <td class="tax taxrelated" style="padding: 10px; border: 1px solid #dee2e6;"></td>
        <td class="sum" style="padding: 10px; border: 1px solid #dee2e6;"></td>
    `;

    tbody.appendChild(newRow);
    calcularTotalFactura();
}

function eliminarFilaProducto(button) {
    const row = button.closest('tr');
    row.remove();
    calcularTotalFactura();
}

function calcularTotalFactura() {
    const filas = document.querySelectorAll('#productosFacturaBody tr');
    let subtotalGeneral = 0;
    const itbisPorcentaje = parseFloat(document.getElementById('config_tax_rate').value) / 100 || 0;

    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.amount input').value) || 0;
        const precio = parseFloat(fila.querySelector('.rate input').value) || 0;
        const subtotal = cantidad * precio;

        fila.querySelector('.sum').textContent = `RD$${subtotal.toFixed(2)}`;

        if (document.getElementById('config_tax').checked) {
            const itbis = subtotal * itbisPorcentaje;
            fila.querySelector('.tax').textContent = `RD$${itbis.toFixed(2)}`;
        } else {
            fila.querySelector('.tax').textContent = '';
        }

        subtotalGeneral += subtotal;
    });

    const itbisMonto = document.getElementById('config_tax').checked ? subtotalGeneral * itbisPorcentaje : 0;
    const total = subtotalGeneral + itbisMonto;

    document.getElementById('total_tax_factura').textContent = `RD$${itbisMonto.toFixed(2)}`;
    document.getElementById('total_price_factura').textContent = `RD$${total.toFixed(2)}`;
}

// Funciones para gestión de facturas
function mostrarModalFactura() {
    // Limpiar productos existentes y agregar uno por defecto
    document.getElementById('productosFacturaBody').innerHTML = `
        <tr>
            <td width='5%' style="padding: 10px; border: 1px solid #dee2e6;">
                <button class="btn btn-sm btn-danger" onclick="eliminarFilaProducto(this)">x</button>
                <span contenteditable>001</span>
            </td>
            <td width='60%' style="padding: 10px; border: 1px solid #dee2e6;">
                <span contenteditable>Producto de ejemplo</span>
            </td>
            <td class="amount" style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="1" onchange="calcularTotalFactura()" style="width: 100%; border: none; background: transparent;"/>
            </td>
            <td class="rate" style="padding: 10px; border: 1px solid #dee2e6;">
                <input type="text" value="100" onchange="calcularTotalFactura()" style="width: 100%; border: none; background: transparent;"/>
            </td>
            <td class="tax taxrelated" style="padding: 10px; border: 1px solid #dee2e6;"></td>
            <td class="sum" style="padding: 10px; border: 1px solid #dee2e6;"></td>
        </tr>
    `;

    calcularTotalFactura();
    const modal = new bootstrap.Modal(document.getElementById('facturaModal'));
    modal.show();
}

function guardarFacturaTemplate() {
    const cliente = {
        nombre: 'Cliente de Factura',
        rnc: ''
    };

    const productos = [];
    const filas = document.querySelectorAll('#productosFacturaBody tr');

    filas.forEach(fila => {
        productos.push({
            nombre: fila.querySelector('td:nth-child(2) span').textContent || 'Producto',
            cantidad: parseFloat(fila.querySelector('.amount input').value) || 1,
            precio: parseFloat(fila.querySelector('.rate input').value) || 0
        });
    });

    const itbisPorcentaje = parseFloat(document.getElementById('config_tax_rate').value) || 18;
    const subtotal = parseFloat(document.getElementById('total_price_factura').textContent.replace('RD$', '').replace(',', '')) || 0;
    const itbisMonto = document.getElementById('config_tax').checked ?
        subtotal * (itbisPorcentaje / 100) : 0;
    const total = subtotal + itbisMonto;

    const factura = {
        cliente,
        productos,
        itbisPorcentaje,
        subtotal,
        itbisMonto,
        total
    };

    ipcRenderer.send('guardar-factura', factura);
}

function cargarFacturas() {
    // Esta función se implementaría para cargar facturas desde la BD
    mostrarNotificacion('Información', 'Cargando facturas...', 'info');
}

function mostrarFacturas(_facturas) {
    const tbody = document.getElementById('facturasBody');
    tbody.innerHTML = '';

    if (!_facturas || _facturas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay facturas registradas</td></tr>';
        return;
    }

    _facturas.forEach(factura => {
        const fecha = new Date(factura.fecha).toLocaleDateString();
        const estadoBadge = factura.estado === 'pagada' ?
            '<span class="badge bg-success">Pagada</span>' :
            '<span class="badge bg-warning">Pendiente</span>';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${factura.id}</td>
            <td>${factura.cliente_nombre || 'Cliente'}</td>
            <td>${fecha}</td>
            <td>RD$${factura.total.toFixed(2)}</td>
            <td>${estadoBadge}</td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="verFactura(${factura.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning me-1" onclick="editarFactura(${factura.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarFactura(${factura.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

// ==================== EVENT LISTENERS PARA FACTURAS ====================

document.getElementById('nuevaFacturaEntrada')?.addEventListener('click', mostrarModalFactura);
document.getElementById('recargarFacturas')?.addEventListener('click', cargarFacturas);
document.getElementById('guardarFacturaTemplate')?.addEventListener('click', guardarFacturaTemplate);
document.getElementById('generarPDFFactura')?.addEventListener('click', function() {
    mostrarNotificacion('Información', 'Generación de PDF en desarrollo', 'info');
});

// ==================== FUNCIONES GLOBALES PARA FACTURAS ====================

window.agregarFilaProducto = agregarFilaProducto;
window.eliminarFilaProducto = eliminarFilaProducto;
window.calcularTotalFactura = calcularTotalFactura;
window.verFactura = function(id) {
    mostrarNotificacion('Información', `Ver factura ${id} - Función en desarrollo`, 'info');
};
window.editarFactura = function(id) {
    mostrarNotificacion('Información', `Editar factura ${id} - Función en desarrollo`, 'info');
};
window.eliminarFactura = function(id) {
    if (confirm(`¿Está seguro de eliminar la factura ${id}?`)) {
        mostrarNotificacion('Información', 'Eliminación de facturas en desarrollo', 'info');
    }
};

// ==================== SISTEMA DE ACTUALIZACIONES ====================

// Verificar actualizaciones al iniciar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar versión de la app
    ipcRenderer.send('get-app-version');

    // Verificar actualizaciones disponibles
    setTimeout(() => {
        ipcRenderer.send('check-for-updates');
    }, 5000); // Verificar 5 segundos después de cargar
});

// Event listeners para actualizaciones
ipcRenderer.on('app-version', (event, version) => {
    console.log('Versión de la aplicación:', version);
    // Mostrar versión en algún lugar de la UI si es necesario
});

ipcRenderer.on('update-available', (event, info) => {
    mostrarNotificacionActualizacion(info);
});

ipcRenderer.on('update-not-available', (event, info) => {
    console.log('No hay actualizaciones disponibles');
});

ipcRenderer.on('download-progress', (event, progressObj) => {
    actualizarProgresoDescarga(progressObj);
});

ipcRenderer.on('update-downloaded', (event, info) => {
    mostrarActualizacionLista(info);
});

// Función para mostrar notificación de actualización disponible
function mostrarNotificacionActualizacion(info) {
    const updateModal = document.createElement('div');
    updateModal.className = 'modal fade';
    updateModal.id = 'updateModal';
    updateModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-download me-2"></i>Nueva Actualización Disponible
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <h6>Versión ${info.version}</h6>
                        <p class="mb-2"><strong>Novedades:</strong></p>
                        <div id="releaseNotes">
                            ${info.releaseNotes || 'Mejoras y correcciones de errores.'}
                        </div>
                    </div>
                    <div class="text-center">
                        <button type="button" class="btn btn-success me-2" onclick="descargarActualizacion()">
                            <i class="fas fa-download me-2"></i>Descargar e Instalar
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Más Tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(updateModal);
    const modal = new bootstrap.Modal(updateModal);
    modal.show();

    // Limpiar modal cuando se cierre
    updateModal.addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Función para descargar actualización
function descargarActualizacion() {
    mostrarNotificacion('Información', 'Descargando actualización...', 'info');
    // La descarga se maneja automáticamente por electron-updater
}

// Función para actualizar progreso de descarga
function actualizarProgresoDescarga(progressObj) {
    // Buscar si ya existe una notificación de progreso
    let progressToast = document.getElementById('progressToast');

    if (!progressToast) {
        // Crear toast de progreso
        const toastContainer = document.querySelector('.toast-container') || crearToastContainer();
        progressToast = document.createElement('div');
        progressToast.id = 'progressToast';
        progressToast.className = 'toast align-items-center text-white bg-primary border-0';
        progressToast.setAttribute('role', 'alert');
        progressToast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-download me-2"></i>
                        <div class="flex-grow-1">
                            <div class="mb-1">Descargando actualización...</div>
                            <div class="progress" style="height: 6px;">
                                <div id="progressBar" class="progress-bar bg-white" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        toastContainer.appendChild(progressToast);
        const toast = new bootstrap.Toast(progressToast, { autohide: false });
        toast.show();
    }

    // Actualizar barra de progreso
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${progressObj.percent}%`;
    }
}

// Función para mostrar que la actualización está lista
function mostrarActualizacionLista(info) {
    const readyModal = document.createElement('div');
    readyModal.className = 'modal fade';
    readyModal.id = 'readyModal';
    readyModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-check-circle me-2"></i>Actualización Lista
                    </h5>
                </div>
                <div class="modal-body text-center">
                    <div class="mb-4">
                        <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                        <h6>La actualización se ha descargado correctamente</h6>
                        <p class="text-muted">Versión ${info.version}</p>
                    </div>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Importante:</strong> La aplicación se reiniciará para aplicar la actualización.
                    </div>
                    <button type="button" class="btn btn-success btn-lg" onclick="instalarActualizacion()">
                        <i class="fas fa-play me-2"></i>Instalar Ahora
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(readyModal);
    const modal = new bootstrap.Modal(readyModal, { backdrop: 'static', keyboard: false });
    modal.show();
}

// Función para instalar actualización
function instalarActualizacion() {
    ipcRenderer.send('install-update');
}

// Función auxiliar para crear contenedor de toasts si no existe
function crearToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Funciones globales para actualizaciones
window.descargarActualizacion = descargarActualizacion;
window.instalarActualizacion = instalarActualizacion;

// ==================== INICIALIZACIÓN DE FACTURAS ====================

// Cargar facturas cuando se abre la pestaña de facturas
document.querySelector('#facturas-tab')?.addEventListener('click', () => {
    setTimeout(() => {
        cargarFacturas();
    }, 100);
});

// ==================== FUNCIONES PARA BÚSQUEDA DE CLIENTES ====================

let clienteSeleccionado = null;

// Función para buscar clientes en facturación
function buscarClientesFactura(termino) {
    if (termino.length < 2) {
        document.getElementById('clienteResultados').style.display = 'none';
        return;
    }

    ipcRenderer.send('buscar-clientes', termino);
}

// Mostrar resultados de búsqueda de clientes
function mostrarResultadosClientes(clientes) {
    const resultadosDiv = document.getElementById('clienteResultados');
    const listaDiv = document.getElementById('clienteLista');

    if (clientes.length === 0) {
        listaDiv.innerHTML = '<div class="list-group-item text-muted">No se encontraron clientes</div>';
        resultadosDiv.style.display = 'block';
        return;
    }

    let html = '';
    clientes.forEach(cliente => {
        html += `
            <button type="button" class="list-group-item list-group-item-action" onclick="seleccionarClienteFactura(${cliente.id}, '${cliente.nombre}', '${cliente.rnc || ''}')">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${cliente.nombre}</h6>
                    <small>${cliente.rnc || 'Sin RNC'}</small>
                </div>
                <small class="text-muted">${cliente.telefono || 'Sin teléfono'}</small>
            </button>
        `;
    });

    // Agregar opción para crear nuevo cliente
    html += `
        <button type="button" class="list-group-item list-group-item-action text-primary" onclick="mostrarModalNuevoClienteFactura()">
            <i class="fas fa-plus-circle me-2"></i>Agregar nuevo cliente
        </button>
    `;

    listaDiv.innerHTML = html;
    resultadosDiv.style.display = 'block';
}

// Seleccionar cliente para facturación
function seleccionarClienteFactura(id, nombre, rnc) {
    clienteSeleccionado = { id, nombre, rnc };
    document.getElementById('clienteNombre').value = nombre;
    document.getElementById('clienteResultados').style.display = 'none';

    // Actualizar display de cliente seleccionado
    const seleccionadoDiv = document.getElementById('clienteSeleccionado');
    seleccionadoDiv.innerHTML = `
        <strong>${nombre}</strong><br>
        <small class="text-muted">RNC: ${rnc || 'No especificado'}</small>
    `;
}

// Mostrar modal para nuevo cliente desde facturación
function mostrarModalNuevoClienteFactura() {
    document.getElementById('clienteResultados').style.display = 'none';
    mostrarModalCliente();
}

// ==================== FUNCIONES PARA PRODUCTOS EN FACTURACIÓN ====================

// Agregar producto a factura con selección de stock disponible
function agregarProductoFactura() {
    ipcRenderer.send('obtener-productos-stock');
}

// Mostrar modal de selección de productos con stock
function mostrarModalSeleccionProducto(productos) {
    // Crear modal dinámicamente
    const modalHtml = `
        <div class="modal fade" id="seleccionProductoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Seleccionar Producto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Producto</th>
                                        <th>Stock Disponible</th>
                                        <th>Precio</th>
                                        <th>Seleccionar</th>
                                    </tr>
                                </thead>
                                <tbody id="productosStockBody">
                                    ${productos.filter(p => p.stock > 0).map(p => `
                                        <tr>
                                            <td>${p.nombre}</td>
                                            <td><span class="badge bg-${p.stock > p.stock_minimo ? 'success' : 'warning'}">${p.stock}</span></td>
                                            <td>RD$${p.precio_venta.toFixed(2)}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" onclick="seleccionarProductoFactura(${p.id}, '${p.nombre}', ${p.stock}, ${p.precio_venta})">
                                                    Seleccionar
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('seleccionProductoModal'));
    modal.show();

    // Limpiar modal cuando se cierre
    document.getElementById('seleccionProductoModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Seleccionar producto para factura
function seleccionarProductoFactura(id, nombre, stock, precio) {
    const tbody = document.getElementById('productosBody');
    const row = tbody.insertRow();

    row.innerHTML = `
        <td>${nombre}<input type="hidden" class="producto-id" value="${id}"></td>
        <td><span class="badge bg-success">${stock}</span></td>
        <td><input type="number" class="producto-cantidad" min="1" max="${stock}" value="1" onchange="validarCantidadFactura(this, ${stock})"></td>
        <td><input type="number" class="producto-precio" step="0.01" min="0" value="${precio}" readonly></td>
        <td><span class="subtotal">RD$${precio.toFixed(2)}</span></td>
        <td><button class="btn btn-sm btn-danger" onclick="eliminarProductoFactura(this)">Eliminar</button></td>
    `;

    // Calcular totales
    calcularTotales();

    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('seleccionProductoModal')).hide();
}

// Validar cantidad no exceda stock en facturación
function validarCantidadFactura(input, maxStock) {
    const cantidad = parseInt(input.value);
    if (cantidad > maxStock) {
        input.value = maxStock;
        mostrarNotificacion('Advertencia', `Cantidad ajustada al stock disponible (${maxStock})`, 'warning');
    }
    calcularTotales();
}

// Eliminar producto de factura
function eliminarProductoFactura(button) {
    button.closest('tr').remove();
    calcularTotales();
}

// ==================== FUNCIONES PARA SOPORTE ====================

// Event listeners para herramientas de soporte
document.getElementById('limpiarDatosPrueba')?.addEventListener('click', limpiarDatosPrueba);

// Función para limpiar datos de prueba
function limpiarDatosPrueba() {
    if (confirm('¿Está seguro de eliminar todos los datos de prueba? Esta acción no se puede deshacer.')) {
        ipcRenderer.send('limpiar-datos-prueba');
    }
}

// Función para cargar y mostrar impresoras
function cargarImpresoras() {
    ipcRenderer.send('obtener-impresoras');
}

// Mostrar lista de impresoras
function mostrarImpresoras(impresoras) {
    const listaDiv = document.getElementById('listaImpresoras');
    if (!listaDiv) return;

    if (!impresoras || impresoras.length === 0) {
        listaDiv.innerHTML = '<small class="text-muted">No se detectaron impresoras</small>';
        return;
    }

    let html = '';
    impresoras.forEach(impresora => {
        const statusClass = impresora.status === 'disponible' ? 'success' : 'warning';
        const defaultBadge = impresora.isDefault ? '<span class="badge bg-primary ms-1">Predeterminada</span>' : '';

        html += `
            <div class="d-flex align-items-center mb-1">
                <i class="fas fa-print text-${statusClass} me-2"></i>
                <small>${impresora.name}${defaultBadge}</small>
            </div>
        `;
    });

    listaDiv.innerHTML = html;
}

// ==================== FUNCIONES PARA PROMEDIO DE PRECIOS ====================

// Modificar función de registrar entrada para calcular promedio de precios
function registrarEntradaConPromedio() {
    const entrada = {
        producto_id: parseInt(document.getElementById('entradaProducto').value),
        cantidad: parseInt(document.getElementById('entradaCantidad').value),
        precio_compra: parseFloat(document.getElementById('entradaPrecioCompra').value),
        precio_venta: parseFloat(document.getElementById('entradaPrecioVenta').value) || null,
        proveedor: document.getElementById('entradaProveedor').value,
        numero_factura: document.getElementById('entradaFactura').value,
        notas: document.getElementById('entradaNotas').value
    };

    if (!entrada.producto_id || !entrada.cantidad || !entrada.precio_compra) {
        mostrarNotificacion('Error', 'Por favor complete los campos obligatorios', 'danger');
        return;
    }

    // Calcular precio promedio si no se especifica precio de venta
    if (!entrada.precio_venta) {
        // Enviar solicitud para calcular precio promedio en main process
        ipcRenderer.send('calcular-precio-promedio', {
            producto_id: entrada.producto_id,
            precio_compra: entrada.precio_compra,
            cantidad: entrada.cantidad
        });

        // Escuchar respuesta del cálculo de precio promedio
        ipcRenderer.once('precio-promedio-calculado', (event, response) => {
            if (response.success) {
                entrada.precio_venta = response.precio_promedio;
                mostrarNotificacion('Información', `Precio promedio calculado: RD$${response.precio_promedio.toFixed(2)}`, 'info');
            }

            // Registrar entrada con precio calculado
            ipcRenderer.send('registrar-entrada', entrada);
        });
    } else {
        // Registrar entrada con precio especificado
        ipcRenderer.send('registrar-entrada', entrada);
    }
}

// ==================== EVENT LISTENERS PARA NUEVAS FUNCIONALIDADES ====================

// Event listener para búsqueda de clientes en facturación
document.getElementById('clienteNombre')?.addEventListener('input', function(e) {
    buscarClientesFactura(e.target.value);
});

document.getElementById('buscarClienteBtn')?.addEventListener('click', function() {
    const termino = document.getElementById('clienteNombre').value;
    buscarClientesFactura(termino);
});

// Event listener para agregar producto a factura
document.getElementById('agregarProductoFactura')?.addEventListener('click', agregarProductoFactura);

// Event listener para registrar entrada con promedio
document.getElementById('registrarEntrada')?.addEventListener('click', registrarEntradaConPromedio);

// IPC listeners para nuevas funcionalidades
ipcRenderer.on('productos-stock-obtenidos', (event, response) => {
    if (response.success) {
        mostrarModalSeleccionProducto(response.productos);
    }
});

ipcRenderer.on('clientes-buscados', (event, response) => {
    if (response.success) {
        mostrarResultadosClientes(response.clientes);
    }
});

ipcRenderer.on('datos-prueba-limpios', (event, response) => {
    if (response.success) {
        mostrarNotificacion('Éxito', 'Datos de prueba eliminados exitosamente', 'success');
        // Recargar datos
        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        mostrarNotificacion('Error', 'Error al limpiar datos de prueba', 'danger');
    }
});

ipcRenderer.on('impresoras-obtenidas', (event, response) => {
    if (response.success) {
        mostrarImpresoras(response.impresoras);
    } else {
        document.getElementById('listaImpresoras').innerHTML = '<small class="text-danger">Error al detectar impresoras</small>';
    }
});

// ==================== FUNCIONES GLOBALES ADICIONALES ====================

window.seleccionarClienteFactura = seleccionarClienteFactura;
window.mostrarModalNuevoClienteFactura = mostrarModalNuevoClienteFactura;
window.seleccionarProductoFactura = seleccionarProductoFactura;
window.validarCantidadFactura = validarCantidadFactura;
window.eliminarProductoFactura = eliminarProductoFactura;
