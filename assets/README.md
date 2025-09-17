# 📁 Assets - FacturaPro ExE

Este directorio contiene los recursos gráficos y multimedia de la aplicación.

## 📋 Archivos Requeridos

### Iconos de Aplicación
- `icon.ico` - Icono para Windows (.ico 256x256 recomendado)
- `icon.icns` - Icono para macOS
- `icon.png` - Icono para Linux (512x512 recomendado)

### Imágenes del Instalador
- `installerSidebar.bmp` - Imagen lateral del instalador (164x314 pixels)
- `installerHeader.bmp` - Imagen de cabecera del instalador

## 🎨 Colores de la Aplicación

La aplicación utiliza el siguiente esquema de colores:
- **Azul Marino Principal:** `#1e3c72`
- **Azul Marino Secundario:** `#2a5298`
- **Gradiente:** `linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)`

## 📝 Notas Importantes

- Los archivos de iconos deben estar en los formatos correctos
- Las imágenes del instalador deben tener las dimensiones exactas
- Si no tienes estos archivos, la aplicación usará iconos por defecto
- Puedes generar iconos en: https://favicon.io/favicon-converter/

## 🔧 Configuración

Los assets se configuran automáticamente en:
- `electron-builder.json` - Configuración del empaquetador
- `package.json` - Referencias a iconos
- `index.html` - Estilos CSS con colores

## 📦 Distribución

Al ejecutar `npm run build-win-setup`, los assets se incluyen automáticamente en el instalador.