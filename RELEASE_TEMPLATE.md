# 📦 Plantilla para Crear Releases - FacturaPro ExE

Esta plantilla te ayuda a crear releases profesionales en GitHub.

## 🚀 Crear Release en GitHub

### Paso 1: Preparar el Release

```bash
# Crear el instalador
npm run build-win-setup

# Verificar que se creó
ls dist/
```

### Paso 2: Crear Tag de Versión

```bash
# Para versión 1.0.0
git tag -a v1.0.0 -m "Release v1.0.0 - Sistema completo de facturación"

# Subir el tag
git push origin v1.0.0
```

### Paso 3: Crear Release en GitHub

Ve a: https://github.com/EdwinEstrella/FacturaProExE/releases

**Configuración del Release:**

#### Tag version:
```
v1.0.0
```

#### Release title:
```
FacturaPro ExE v1.0.0 - Sistema de Gestión Empresarial
```

#### Describe this release:
```markdown
## 🚀 FacturaPro ExE v1.0.0

### ✨ Nuevas Características

- ✅ **Sistema de autenticación completo** con login seguro
- ✅ **Control de permisos** basado en roles de usuario
- ✅ **Módulo de soporte** con gestión de usuarios
- ✅ **Interfaz moderna** con colores azul marino
- ✅ **Gestión completa de productos** con cálculo de precios promedio
- ✅ **Sistema de facturación** integrado con plantilla HTML
- ✅ **Generación de PDFs** para facturas
- ✅ **Actualizaciones automáticas** desde GitHub
- ✅ **Base de datos SQLite** con respaldo y restauración

### 🔧 Mejoras Técnicas

- Sistema de sesiones seguro con tokens JWT
- Validación completa de datos en formularios
- Interfaz responsive con Bootstrap 5
- Arquitectura modular y escalable
- Documentación completa del código

### 📦 Instalación

1. Descarga el archivo `FacturaPro-ExE-Setup-1.0.0.exe`
2. Ejecuta el instalador
3. Sigue las instrucciones del asistente
4. ¡Disfruta de tu nuevo sistema de facturación!

### 🔐 Primer Uso

- **Usuario:** soporte
- **Contraseña:** [Configurada en el sistema]
- Ve al módulo de soporte para crear usuarios adicionales

### 📋 Requisitos del Sistema

- Windows 10 o superior
- 100 MB de espacio en disco
- Conexión a internet para actualizaciones

### 🐛 Problemas Conocidos

- Ninguno reportado en esta versión

### 🙏 Agradecimientos

Gracias por usar FacturaPro ExE. Tu apoyo nos motiva a seguir mejorando.

---

**Desarrollado con ❤️ para hacer la facturación más sencilla**
```

### Paso 4: Adjuntar Archivos

**Archivos a adjuntar:**
- `dist/FacturaPro ExE 1.0.0.exe` (Instalador principal)
- `dist/latest.yml` (Información de versión para actualizaciones)

### Paso 5: Publicar

1. Marcar como "pre-release" si es una versión beta
2. Hacer clic en "Publish release"
3. ¡Listo! Los usuarios podrán descargar e instalar

## 🔄 Actualizaciones Futuras

### Proceso Automático (Recomendado)

```bash
# Para corrección de bug
npm run release

# Para nueva funcionalidad
npm run release-minor

# Para cambio mayor
npm run release-major
```

### Proceso Manual

```bash
# Incrementar versión
npm version patch  # 1.0.0 -> 1.0.1

# Construir y publicar
npm run build-win-setup
npm run publish
```

## 📊 Versionado

- **MAJOR (X.0.0):** Cambios incompatibles
- **MINOR (X.Y.0):** Nuevas funcionalidades
- **PATCH (X.Y.Z):** Correcciones de bugs

## 🎯 Checklist de Release

- [ ] Ejecutar `npm run build-win-setup`
- [ ] Verificar instalador en `dist/`
- [ ] Crear tag de versión
- [ ] Crear release en GitHub
- [ ] Adjuntar instalador
- [ ] Escribir descripción detallada
- [ ] Publicar release
- [ ] Probar descarga e instalación
- [ ] Verificar actualizaciones automáticas

---

¡Tu aplicación está lista para ser distribuida! 🎉