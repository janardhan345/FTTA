import prisma from '../src/lib/prisma.js';
import 'dotenv/config';

async function main() {
  console.log('Seeding database...');

  const departments = [
    { code: 'CS',   name: 'Computer Science and Engineering' },
    { code: 'EC',   name: 'Electronics and Communication Engineering' },
    { code: 'ME',  name: 'Mechanical Engineering' },
    { code: 'EE', name: 'Electrical and Electronics Engineering' },
    { code: 'IT',    name: 'Information Technology' },
    { code: 'AD',  name: 'Artificial Intelligence and Data Science' },
    { code: 'EI', name: 'Electronics and Instrumentation Engineering'}
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where:  { code: dept.code },
      update: { name: dept.name }, // update name if code already exists
      create: dept,
    });
  }
  console.log(`✓ ${departments.length} departments seeded`);

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('⚠ ADMIN_EMAIL not set in .env — skipping admin seed');
  } else {
    await prisma.admin.upsert({
      where:  { email: adminEmail },
      update: {}, 
      create: {
        id:    `seed-${Date.now()}`,   
        email: adminEmail,
        name:  'Administrator',
      },
    });
    console.log(`✓ Admin seeded: ${adminEmail}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
