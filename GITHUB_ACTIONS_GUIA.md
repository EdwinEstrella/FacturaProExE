# 🚀 Guía Completa - GitHub Actions para FacturaPro ExE

Esta guía te explica paso a paso cómo configurar y usar GitHub Actions para generar instaladores automáticamente.

## 📋 Requisitos Previos

- ✅ **Repositorio en GitHub**: `https://github.com/EdwinEstrella/FacturaProExE`
- ✅ **Código subido**: Todo el proyecto está en GitHub
- ✅ **Archivo workflow**: `.github/workflows/release.yml` configurado

## 🎯 Configuración de GitHub Actions

### Paso 1: Verificar que Actions esté activado

1. Ve a tu repositorio: https://github.com/EdwinEstrella/FacturaProExE
2. Click en la pestaña **"Actions"**
3. Si está desactivado, activa GitHub Actions

### Paso 2: Verificar el Workflow

1. En la pestaña **"Actions"** deberías ver el workflow **"Release"**
2. El workflow se activa automáticamente cuando creas un tag que comienza con `v`

## 🚀 Cómo Crear un Release Automático

### Método 1: Usando npm scripts (Recomendado)

```bash
# Para corrección de bug (1.0.0 → 1.0.1)
npm run release

# Para nueva funcionalidad (1.0.0 → 1.1.0)
npm run release-minor

# Para cambio mayor (1.0.0 → 2.0.0)
npm run release-major
```

### Método 2: Manual paso a paso

```bash
# 1. Crear tag de versión
git tag -a v1.0.0 -m "Release v1.0.0 - Primera versión estable"

# 2. Subir el tag a GitHub
git push origin v1.0.0

# 3. GitHub Actions se activa automáticamente
```

## 📊 Seguimiento del Proceso

### Ver el progreso en GitHub

1. Ve a la pestaña **"Actions"** en tu repositorio
2. Verás que se ejecuta el workflow **"Release"**
3. Click en el workflow en ejecución para ver los logs en tiempo real

### Estados del Workflow

- 🟡 **En cola**: Esperando que un runner esté disponible
- 🟢 **En progreso**: Instalando dependencias y construyendo
- 🟢 **Completado**: Instalador generado exitosamente
- 🔴 **Fallido**: Error en el proceso (revisar logs)

## 📦 Resultado del Workflow

Cuando el workflow se complete exitosamente:

### Archivos Generados
```
📁 dist/
├── 📄 FacturaPro ExE 1.0.0.exe    # Instalador principal
├── 📄 latest.yml                   # Archivo de versiones
└── 📄 ...                         # Otros archivos
```

### Release Automático
- ✅ **Release creado** en GitHub Releases
- ✅ **Instalador adjunto** al release
- ✅ **Notas de release** generadas automáticamente
- ✅ **Estado: Draft** (borrador para revisión)

## 🎯 Publicar el Release

### Paso 1: Revisar el Release

1. Ve a: https://github.com/EdwinEstrella/FacturaProExE/releases
2. Verás un release con estado **"Draft"**
3. Revisa que el instalador esté adjunto

### Paso 2: Personalizar el Release

1. **Título**: `FacturaPro ExE v1.0.0`
2. **Descripción**: Copia el contenido de `RELEASE_TEMPLATE.md`
3. **Marcar como pre-release** si es versión beta

### Paso 3: Publicar

1. Click en **"Publish release"**
2. ¡Listo! El instalador está disponible para descarga

## 👥 Para tus Usuarios

### Enlace de Descarga
```
https://github.com/EdwinEstrella/FacturaProExE/releases
```

### Instrucciones para Usuarios

1. **Ir al enlace de arriba**
2. **Descargar** `FacturaPro ExE 1.0.0.exe`
3. **Ejecutar** el instalador
4. **Primer uso:**
   - Usuario: `soporte`
   - Contraseña: `@Teamo1110a`

## 🔄 Actualizaciones Automáticas

### Cómo Funciona

1. **Usuario instala** la aplicación
2. **Aplicación verifica** automáticamente nuevas versiones
3. **Descarga silenciosa** de actualizaciones
4. **Instalación automática** al reiniciar

### Configuración en la App

La aplicación ya incluye:
- ✅ Sistema de verificación de actualizaciones
- ✅ Descarga automática en segundo plano
- ✅ Notificaciones de nuevas versiones
- ✅ Instalación sin intervención del usuario

## 🛠️ Solución de Problemas

### Workflow no se activa

**Síntomas:**
- Creas un tag pero no se ejecuta el workflow

**Soluciones:**
1. Verificar que el tag comience con `v` (ej: `v1.0.0`)
2. Revisar que el archivo `.github/workflows/release.yml` existe
3. Verificar que GitHub Actions esté activado

### Error en la construcción

**Síntomas:**
- Workflow falla durante la construcción

**Soluciones:**
1. Revisar los logs del workflow
2. Verificar que todas las dependencias estén en `package.json`
3. Comprobar que los archivos de configuración sean correctos

### Release no se crea

**Síntomas:**
- Workflow se completa pero no hay release

**Soluciones:**
1. Verificar que `GITHUB_TOKEN` esté disponible
2. Revisar permisos del repositorio
3. Comprobar que no haya conflictos de nombre

## 📈 Flujo de Trabajo Recomendado

### Desarrollo Diario
```bash
# Hacer cambios
git add .
git commit -m "Nueva funcionalidad"

# Probar localmente
npm start
```

### Crear Release
```bash
# Crear nueva versión
npm run release

# GitHub Actions genera instalador automáticamente
# Revisar y publicar el release
```

### Actualizaciones Futuras
```bash
# Para cada nueva versión
npm run release

# Los usuarios reciben actualizaciones automáticamente
```

## 🎉 Beneficios de GitHub Actions

- ✅ **Automático**: No necesitas construir localmente
- ✅ **Confiable**: Servidores con permisos adecuados
- ✅ **Escalable**: Maneja múltiples plataformas
- ✅ **Integrado**: Funciona con GitHub Releases
- ✅ **Gratuito**: Para repositorios públicos

## 📞 Soporte

Si tienes problemas con GitHub Actions:

1. **Revisa los logs** del workflow fallido
2. **Verifica la configuración** en `.github/workflows/release.yml`
3. **Comprueba el estado** de GitHub Actions en tu repositorio

---

**¡Tu sistema de distribución automática está listo!** 🎉

Cada vez que ejecutes `npm run release`, GitHub Actions generará automáticamente un instalador profesional para tus usuarios.