const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'backend', 'prisma', 'schema.prisma');
const provider = process.argv[2];

if (!provider || !['sqlite', 'postgresql', 'mysql'].includes(provider.toLowerCase())) {
  console.error('\x1b[31m[ERROR] Debes especificar un proveedor válido: sqlite, postgresql o mysql.\x1b[0m');
  console.error('Ejemplo: node scripts/switch-database.js postgresql\n');
  process.exit(1);
}

const targetProvider = provider.toLowerCase();

if (!fs.existsSync(schemaPath)) {
  console.error(`\x1b[31m[ERROR] No se encontró el archivo schema.prisma en: ${schemaPath}\x1b[0m`);
  process.exit(1);
}

try {
  let content = fs.readFileSync(schemaPath, 'utf8');

  // Regex para emparejar y reemplazar el bloque datasource db
  const datasourceRegex = /datasource db \{[\s\S]*?\}/;
  
  let newDatasourceBlock = '';
  if (targetProvider === 'sqlite') {
    newDatasourceBlock = `datasource db {\n  provider = "sqlite"\n}`;
  } else {
    newDatasourceBlock = `datasource db {\n  provider = "${targetProvider}"\n  url      = env("DATABASE_URL")\n}`;
  }

  content = content.replace(datasourceRegex, newDatasourceBlock);
  fs.writeFileSync(schemaPath, content, 'utf8');

  console.log(`\n\x1b[32m[ÉXITO] schema.prisma actualizado correctamente.\x1b[0m`);
  console.log(`Proveedor establecido a: \x1b[36m"${targetProvider}"\x1b[0m`);
  console.log(`\nPróximos pasos recomendados:`);
  console.log(`  1. Asegúrate de configurar la variable DATABASE_URL correcta en backend/.env`);
  console.log(`  2. Ejecuta: \x1b[33mcd backend\x1b[0m`);
  console.log(`  3. Regenera los tipos de Prisma: \x1b[33mnpx prisma generate\x1b[0m`);
  console.log(`  4. Sincroniza la estructura: \x1b[33mnpx prisma db push\x1b[0m\n`);
} catch (error) {
  console.error('\x1b[31m[ERROR] Ocurrió un error al modificar schema.prisma:\x1b[0m', error);
  process.exit(1);
}
