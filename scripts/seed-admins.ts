import connectDB from '../lib/mongodb';
import Admin from '../models/Admin';

const required = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'VIEWER_EMAIL', 'VIEWER_PASSWORD'] as const;
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const admins = [
  {
    username: 'admin',
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    role: 'full_access' as const,
  },
  {
    username: 'viewer',
    email: process.env.VIEWER_EMAIL!,
    password: process.env.VIEWER_PASSWORD!,
    role: 'read_only' as const,
  },
];

async function seedAdmins() {
  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB\n');

    for (const data of admins) {
      const existing = await Admin.findOne({ username: data.username });
      if (existing) {
        console.log(`⏭️  Admin "${data.username}" already exists (role: ${existing.role}) — skipping`);
        continue;
      }

      const admin = await Admin.create(data);
      console.log(`✅ Created admin "${admin.username}" with role: ${admin.role}`);
    }

    console.log('\n🎉 Admin seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAdmins();
