# 📦 Guía de Distribución - FacturaPro ExE

Esta guía explica cómo distribuir tu aplicación FacturaPro ExE a los usuarios finales y cómo configurar las actualizaciones automáticas.

## 🚀 Para Desarrolladores - Crear Instaladores

### Método Rápido (Recomendado)

```bash
# Ejecutar el script de distribución automática
node scripts/distribute.js
```

Este script hará automáticamente:
- ✅ Verificar cambios en Git
- ✅ Instalar dependencias
- ✅ Ejecutar ESLint
- ✅ Construir instalador
- ✅ Crear tag de versión
- ✅ Subir a GitHub

### Método Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Construir instalador para Windows
npm run build-win-setup

# 3. El instalador estará en la carpeta dist/
```

### Scripts Disponibles

```bash
# Desarrollo
npm start              # Ejecutar en modo desarrollo
npm run dev           # Alias para desarrollo

# Construcción
npm run build-win     # Construir para Windows
npm run build-win-setup  # Construir instalador completo
npm run dist          # Construir para todas las plataformas

# Releases
npm run release       # Release patch (1.0.0 -> 1.0.1)
npm run release-minor # Release minor (1.0.0 -> 1.1.0)
npm run release-major # Release major (1.0.0 -> 2.0.0)
```

## 👥 Para Usuarios Finales - Instalación

### Paso 1: Descargar el Instalador

Ve a la página de releases de GitHub:
```
https://github.com/EdwinEstrella/FacturaProExE/releases
```

Descarga el archivo `.exe` más reciente de la sección "Assets".

### Paso 2: Instalar la Aplicación

1. **Ejecuta el instalador** (.exe)
2. **Sigue el asistente de instalación**
3. **Elige la ubicación** donde instalar
4. **Crea accesos directos** (opcional)

### Paso 3: Primer Uso

Al ejecutar la aplicación por primera vez:

1. **Usuario:** `soporte`
2. **Contraseña:** `[Configurada en el sistema]`
3. **Ve al módulo de soporte** para crear usuarios adicionales

## 🔄 Sistema de Actualizaciones Automáticas

### Cómo Funciona

1. **Publicas una nueva versión** en GitHub Releases
2. **Los usuarios reciben notificación** automática
3. **La aplicación se actualiza** automáticamente
4. **No requieren reinstalación** manual

### Configurar GitHub Actions (Automático)

El proyecto ya incluye configuración de GitHub Actions en:
```
.github/workflows/release.yml
```

### Crear Release Manual

1. Ve a: https://github.com/EdwinEstrella/FacturaProExE/releases
2. Click en "Create a new release"
3. **Tag version:** `v1.0.0` (formato: v{major}.{minor}.{patch})
4. **Release title:** `FacturaPro ExE v1.0.0`
5. **Description:** Describe los cambios
6. **Attach files:** Sube el instalador desde `dist/`
7. **Publish release**

## 📊 Versionado Semántico

- **MAJOR (X.0.0):** Cambios incompatibles
- **MINOR (X.Y.0):** Nuevas funcionalidades compatibles
- **PATCH (X.Y.Z):** Corrección de bugs

### Ejemplos

```bash
# Para corrección de bug
npm run release        # 1.0.0 -> 1.0.1

# Para nueva funcionalidad
npm run release-minor  # 1.0.0 -> 1.1.0

# Para cambio mayor
npm run release-major  # 1.0.0 -> 2.0.0
```

## 🛠️ Solución de Problemas

### Error: "No se puede verificar la firma del instalador"

- **Solución:** Desactivar temporalmente el antivirus durante la instalación
- **Nota:** El instalador está firmado digitalmente para mayor seguridad

### Error: "La aplicación no se actualiza automáticamente"

- **Verificar:** Conexión a internet
- **Verificar:** Configuración de GitHub en `package.json`
- **Manual:** Descargar e instalar la nueva versión

### Error: "No se puede acceder al repositorio"

- **Verificar:** URL correcta en configuración
- **Verificar:** Repositorio público en GitHub
- **Verificar:** Token de acceso si es repositorio privado

## 📁 Estructura de Archivos de Distribución

```
dist/
├── FacturaPro ExE 1.0.0.exe    # Instalador principal
├── latest.yml                   # Información de versión
└── ...                          # Otros archivos generados
```

## 🔐 Configuración de Seguridad

### Para Repositorios Privados

Si tu repositorio es privado, configura un token de acceso:

1. Ve a: https://github.com/settings/tokens
2. Genera un "Personal Access Token" con permisos `repo`
3. Configura la variable de entorno: `GH_TOKEN=tu_token`

### Firma Digital (Opcional)

Para firmar digitalmente los instaladores:

```json
{
  "build": {
    "win": {
      "certificateFile": "certificado.p12",
      "certificatePassword": "tu_password"
    }
  }
}
```

## 📞 Soporte

Para soporte técnico:
- **Usuario:** `soporte`
- **Contraseña:** `[Configurada en el sistema]`
- **Módulo:** Soporte > Gestión de Usuarios

## 🎯 Checklist de Distribución

- [ ] Ejecutar `node scripts/distribute.js`
- [ ] Verificar que se creó el instalador en `dist/`
- [ ] Subir instalador a GitHub Releases
- [ ] Probar descarga e instalación
- [ ] Verificar actualizaciones automáticas
- [ ] Documentar cambios en el release

---

**¡Tu aplicación está lista para distribución!** 🎉