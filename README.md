# Sistema de Gestión Empresarial

Un sistema completo de facturación y gestión empresarial desarrollado con Electron, SQLite y Bootstrap.

## 🚀 Características

- ✅ **Sistema de autenticación completo** con login seguro
- ✅ **Control de permisos** basado en roles de usuario
- ✅ **Módulo de soporte** con gestión de usuarios
- ✅ **Interfaz moderna** con colores azul marino
- ✅ **Gestión completa de productos** con cálculo de precios promedio
- ✅ **Sistema de facturación** integrado con plantilla HTML
- ✅ **Generación de PDFs** para facturas
- ✅ **Actualizaciones automáticas** desde GitHub
- ✅ **Base de datos SQLite** con respaldo y restauración

## 📋 Requisitos

- Node.js 16+
- npm o yarn
- Windows 10+ (para desarrollo y distribución)

## 🛠️ Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/sistema-facturacion.git
   cd sistema-facturacion
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Ejecuta la aplicación:**
   ```bash
   npm start
   ```

## 🔐 Primer Uso

Al ejecutar la aplicación por primera vez:

1. **Usuario de soporte:** `soporte`
2. **Contraseña:** `[Configurada en el sistema]`

Desde el módulo de soporte puedes crear nuevos usuarios con diferentes permisos.

## 📦 Generar Instalador (.exe)

### Método Rápido (Recomendado)
```bash
# Distribución completa automática
node scripts/distribute.js
```

### Método Manual
```bash
# Para Windows con instalador
npm run build-win-setup

# Para distribución general
npm run dist
```

Los archivos generados estarán en la carpeta `dist/`.

### Scripts de Distribución
```bash
npm run release       # Release patch automático
npm run release-minor # Release minor automático
npm run release-major # Release major automático
```

## 🔄 Sistema de Actualizaciones

### Configuración de GitHub para Actualizaciones

1. **Crear un repositorio en GitHub**

2. **Configurar GitHub Actions** (crear `.github/workflows/release.yml`):

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run dist

    - name: Release
      uses: softprops/action-gh-release@v1
      with:
        files: dist/*.exe
        draft: true
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

3. **Actualizar configuración en `package.json`:**

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "tu-usuario",
    "repo": "sistema-facturacion"
  }
}
```

### Proceso de Actualización

1. **Crear nueva versión:**
    ```bash
    # Automático (recomendado)
    npm run release

    # Manual
    git tag v1.1.0
    git push origin v1.1.0
    ```

2. **GitHub Actions** generará automáticamente el instalador

3. **Los usuarios recibirán notificación** de actualización disponible

4. **Actualización automática** se descarga e instala

## 👥 Distribución a Usuarios Finales

### 🚀 Método Recomendado: GitHub Actions (Automático)

#### Configuración Inicial

1. **Ve a tu repositorio:**
   ```
   https://github.com/EdwinEstrella/FacturaProExE
   ```

2. **Activa GitHub Actions:**
   - Ve a la pestaña **"Actions"**
   - Si está desactivado, actívalo

3. **Verifica el workflow:**
   - Deberías ver **"Release"** en la lista de workflows

#### Crear Release Automático

```bash
# Para corrección de bug (1.0.0 → 1.0.1)
npm run release

# Para nueva funcionalidad (1.0.0 → 1.1.0)
npm run release-minor

# Para cambio mayor (1.0.0 → 2.0.0)
npm run release-major
```

#### Seguimiento del Proceso

1. **Ve a la pestaña "Actions"** en GitHub
2. **Verás el workflow ejecutándose**
3. **Cuando termine**, ve a **"Releases"**
4. **Edita el release** (estará en borrador)
5. **Publica el release**

### 📦 Método Manual (Si GitHub Actions no funciona)

```bash
# Construir instalador localmente
npm run build-win-setup

# Subir manualmente a GitHub Releases
```

### Descarga e Instalación para Usuarios

1. **Ir a:**
   ```
   https://github.com/EdwinEstrella/FacturaProExE/releases
   ```

2. **Descargar el instalador** más reciente (.exe)

3. **Ejecutar el instalador** y seguir las instrucciones

4. **Primer uso:**
   - Usuario: `soporte`
   - Contraseña: `@Teamo1110a`

### Actualizaciones Automáticas

- ✅ **Detección automática** de nuevas versiones
- ✅ **Descarga silenciosa** en segundo plano
- ✅ **Instalación automática** al reiniciar
- ✅ **Notificaciones** de actualizaciones disponibles

## 🗄️ Base de Datos

La aplicación utiliza SQLite con las siguientes tablas principales:

- `usuarios` - Gestión de usuarios y autenticación
- `permisos` - Definición de permisos del sistema
- `productos` - Inventario de productos
- `clientes` - Información de clientes
- `facturas` - Registro de facturas
- `entradas` - Movimientos de entrada de productos

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
NODE_ENV=production
DATABASE_PATH=./facturas.db
LOG_LEVEL=info
```

### Personalización

- **Colores:** Modificar en `index.html` (sección CSS)
- **Logo:** Reemplazar `assets/img/logo.png`
- **Configuración:** Ajustar en módulo de soporte

## 📁 Estructura del Proyecto

```
sistema-facturacion/
├── db.js                 # Base de datos y funciones
├── main.js              # Proceso principal de Electron
├── renderer.js          # Lógica del frontend
├── index.html           # Interfaz principal
├── login.html           # Pantalla de login
├── package.json         # Configuración del proyecto
├── assets/              # Recursos estáticos
│   ├── css/
│   ├── img/
│   └── js/
└── dist/                # Archivos de distribución
```

## 🚀 Despliegue

### Opción 1: Instalador Ejecutable
```bash
npm run build-win
# El archivo .exe estará en dist/
```

### Opción 2: Distribución Directa
```bash
npm run dist
```

### Opción 3: Publicación Automática
```bash
npm run publish
```

## 🐛 Solución de Problemas

### Error SQLITE_CONSTRAINT
- Verificar que todos los campos obligatorios estén completos
- El precio de venta debe ser mayor a 0
- Los códigos de producto deben ser únicos

### Problemas de Actualización
- Verificar conexión a internet
- Revisar configuración de GitHub
- Comprobar permisos de escritura

### Error de Base de Datos
- Cerrar la aplicación completamente
- Verificar que el archivo `facturas.db` no esté corrupto
- Usar la función de respaldo en el módulo de soporte

## 📞 Soporte

Para soporte técnico:
- Usuario: `soporte`
- Contraseña: `[Configurada en el sistema]`
- Módulo: Soporte > Gestión de Usuarios

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ usando Electron, SQLite y Bootstrap**