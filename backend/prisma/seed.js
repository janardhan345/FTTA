import prisma from '../src/lib/prisma.js';
import 'dotenv/config';

async function main() {
  console.log('Seeding database...');

  // ─── Departments ─────────────────────────────────────────────────────────
  // upsert = create if not exists, update if exists.
  // This means you can safely re-run the seed without creating duplicates.
  const departments = [
    { code: 'CSE',   name: 'Computer Science and Engineering' },
    { code: 'ECE',   name: 'Electronics and Communication Engineering' },
    { code: 'MECH',  name: 'Mechanical Engineering' },
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'IT',    name: 'Information Technology' },
    { code: 'AIDS',  name: 'Artificial Intelligence and Data Science' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where:  { code: dept.code },
      update: { name: dept.name }, // update name if code already exists
      create: dept,
    });
  }
  console.log(`✓ ${departments.length} departments seeded`);

  // ─── Admin placeholder ────────────────────────────────────────────────────
  // We seed the admin record now so it exists.
  // The 'id' here is a placeholder — it will be replaced with the real
  // Google sub ID the first time the admin logs in (via upsert in passport.js).
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('⚠ ADMIN_EMAIL not set in .env — skipping admin seed');
  } else {
    await prisma.admin.upsert({
      where:  { email: adminEmail },
      update: {}, // don't overwrite anything if it already exists
      create: {
        id:    'seed-placeholder',   // replaced on first real Google login
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
