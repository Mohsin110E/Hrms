import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT 'user_types' as table_name, COUNT(*)::int as cnt FROM user_types
    UNION ALL SELECT 'roles', COUNT(*)::int FROM roles
    UNION ALL SELECT 'document_types', COUNT(*)::int FROM document_types
    UNION ALL SELECT 'parameter_types', COUNT(*)::int FROM parameter_types
    UNION ALL SELECT 'parameters', COUNT(*)::int FROM parameters
    UNION ALL SELECT 'messages', COUNT(*)::int FROM messages
    UNION ALL SELECT 'system_configurations', COUNT(*)::int FROM system_configurations
    UNION ALL SELECT 'menu_items', COUNT(*)::int FROM menu_items
  `;
  console.table(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
