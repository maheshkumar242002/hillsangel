import sequelize, { connectDB } from '../config/db.js';
import Vehicle from '../models/Vehicle.js';
import { seedVehiclesIfEmpty } from './seedVehicles.js';

const run = async () => {
  try {
    await connectDB();
    await Vehicle.sync({ alter: true });
    console.log('✅ Vehicle table synced successfully.');
    await seedVehiclesIfEmpty();
    console.log('🎉 Vehicle seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Vehicle sync/seed error:', err);
    process.exit(1);
  }
};

run();
