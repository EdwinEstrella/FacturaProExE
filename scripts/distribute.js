#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando proceso de distribución de FacturaPro ExE...\n');

// Función para ejecutar comandos
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    process.exit(1);
  }
}

// Verificar que estamos en el directorio correcto
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Ejecuta este script desde la raíz del proyecto');
  process.exit(1);
}

// Verificar que Git esté limpio
try {
  const gitStatus = execSync('git status --porcelain').toString().trim();
  if (gitStatus) {
    console.log('⚠️  Hay cambios sin commitear. Creando commit automático...');
    runCommand('git add .', 'Agregando cambios al staging');
    runCommand('git commit -m "🔄 Cambios automáticos para distribución"', 'Creando commit automático');
  }
} catch (error) {
  console.log('⚠️  No se pudo verificar estado de Git, continuando...');
}

// Paso 1: Instalar dependencias
runCommand('npm install', 'Instalando dependencias');

// Paso 2: Ejecutar linting
console.log('🔍 Ejecutando ESLint...');
try {
  execSync('npx eslint . --fix', { stdio: 'inherit' });
  console.log('✅ ESLint completado\n');
} catch (error) {
  console.log('⚠️  ESLint encontró algunos problemas, pero continuando...\n');
}

// Paso 3: Construir la aplicación
runCommand('npm run build-win-setup', 'Construyendo instalador Windows');

// Paso 4: Verificar que se creó el instalador
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('❌ Error: No se encontró el directorio dist');
  process.exit(1);
}

const files = fs.readdirSync(distDir);
const installer = files.find(file => file.endsWith('.exe'));

if (!installer) {
  console.error('❌ Error: No se encontró el archivo instalador (.exe)');
  process.exit(1);
}

console.log(`📦 Instalador creado: ${installer}`);

// Paso 5: Crear tag de versión
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`🏷️  Creando tag de versión: v${version}`);
try {
  execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
  console.log(`✅ Tag v${version} creado\n`);
} catch (error) {
  console.log(`⚠️  Tag v${version} ya existe, continuando...\n`);
}

// Paso 6: Subir cambios a GitHub
runCommand('git push origin main', 'Subiendo cambios a GitHub');
runCommand(`git push origin v${version}`, 'Subiendo tag a GitHub');

// Paso 7: Publicar release en GitHub
console.log('🚀 Publicando release en GitHub...');
console.log(`📦 Instalador disponible en: dist/${installer}`);
console.log(`🔗 URL del repositorio: https://github.com/EdwinEstrella/FacturaProExE`);
console.log(`🏷️  Tag: v${version}`);

console.log('\n🎉 ¡Distribución completada exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a https://github.com/EdwinEstrella/FacturaProExE/releases');
console.log('2. Crea un nuevo release con el tag v' + version);
console.log('3. Sube el archivo instalador desde la carpeta dist/');
console.log('4. Los usuarios podrán descargar e instalar automáticamente');
console.log('5. Las actualizaciones se distribuirán automáticamente a través de GitHub');

console.log('\n💡 Para futuras actualizaciones:');
console.log('- Ejecuta: npm run release (para patch version)');
console.log('- Ejecuta: npm run release-minor (para minor version)');
console.log('- Ejecuta: npm run release-major (para major version)');