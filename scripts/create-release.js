#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Creando nuevo release de FacturaPro ExE...\n');

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

// Obtener versión actual
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Versión actual: ${currentVersion}`);

// Preguntar tipo de release
const args = process.argv.slice(2);
let newVersion = currentVersion;

if (args[0] === 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  newVersion = `${major}.${minor}.${patch + 1}`;
} else if (args[0] === 'minor') {
  const [major, minor] = currentVersion.split('.').map(Number);
  newVersion = `${major}.${minor + 1}.0`;
} else if (args[0] === 'major') {
  const [major] = currentVersion.split('.').map(Number);
  newVersion = `${major + 1}.0.0`;
} else {
  console.log('Uso: node scripts/create-release.js [patch|minor|major]');
  console.log('Ejemplos:');
  console.log('  node scripts/create-release.js patch  # 1.0.0 → 1.0.1');
  console.log('  node scripts/create-release.js minor  # 1.0.0 → 1.1.0');
  console.log('  node scripts/create-release.js major  # 1.0.0 → 2.0.0');
  process.exit(1);
}

console.log(`🎯 Nueva versión: ${newVersion}`);

// Verificar cambios pendientes
try {
  const gitStatus = execSync('git status --porcelain').toString().trim();
  if (gitStatus) {
    console.log('⚠️  Hay cambios sin commitear. Creando commit automático...');
    runCommand('git add .', 'Agregando cambios al staging');
    runCommand('git commit -m "🔄 Cambios automáticos para release v' + newVersion + '"', 'Creando commit automático');
  }
} catch (error) {
  console.log('⚠️  No se pudo verificar estado de Git, continuando...');
}

// Actualizar versión en package.json
packageJson.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('📝 Versión actualizada en package.json\n');

// Crear commit de versión
runCommand('git add package.json', 'Agregando cambios de versión');
runCommand('git commit -m "🔖 Release v' + newVersion + '"', 'Creando commit de versión');

// Crear tag
runCommand('git tag -a v' + newVersion + ' -m "Release v' + newVersion + '"', 'Creando tag de versión');

// Subir cambios y tag
runCommand('git push origin main', 'Subiendo cambios a GitHub');
runCommand('git push origin v' + newVersion, 'Subiendo tag a GitHub');

console.log('\n🎉 ¡Release creado exitosamente!');
console.log(`🏷️  Tag: v${newVersion}`);
console.log(`📊 Versión: ${newVersion}`);
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a https://github.com/EdwinEstrella/FacturaProExE/actions');
console.log('2. Espera que termine el workflow "Release"');
console.log('3. Ve a https://github.com/EdwinEstrella/FacturaProExE/releases');
console.log('4. Edita y publica el release generado');
console.log('5. ¡Los usuarios podrán descargar la nueva versión!');

console.log('\n💡 Para verificar el progreso:');
console.log('- Actions: https://github.com/EdwinEstrella/FacturaProExE/actions');
console.log('- Releases: https://github.com/EdwinEstrella/FacturaProExE/releases');