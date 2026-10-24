import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import Customer from '../models/Customer.js';

dotenv.config();

/**
 * Script to insert sample or custom customers into the MySQL database.
 * Run directly via: node src/seed/insertCustomer.js
 */
export async function insertSampleCustomers() {
  try {
    console.log('[Customer Seed] Connecting to MySQL database...');
    await connectDB();

    const sampleCustomers = [
      {
        name: 'Aarav Sharma',
        phone: '9876543210',
        email: 'aarav.sharma@example.com',
        city: 'Coimbatore',
        address: '12 Race Course Road, Coimbatore, Tamil Nadu',
        notes: 'Honeymoon couple, preferred quiet valley view in Ooty.',
        status: 'vip',
        totalBookings: 2,
        totalSpent: 35000,
      },
      {
        name: 'Priya Nambiar',
        phone: '9123456789',
        email: 'priya.n@example.com',
        city: 'Kochi',
        address: '45 Marine Drive, Kochi, Kerala',
        notes: 'Solo traveler, joined Munnar stranger group trail.',
        status: 'active',
        totalBookings: 1,
        totalSpent: 11900,
      },
      {
        name: 'Vikramaditya Rao',
        phone: '8877665544',
        email: 'vikram.rao@example.com',
        city: 'Madurai',
        address: '88 KK Nagar, Madurai, Tamil Nadu',
        notes: 'Anniversary celebration in Kodaikanal.',
        status: 'vip',
        totalBookings: 3,
        totalSpent: 52000,
      },
      {
        name: 'Ananya Deshmukh',
        phone: '9820112233',
        email: 'ananya.d@example.com',
        city: 'Bengaluru',
        address: '77 Indiranagar 100ft Rd, Bengaluru, Karnataka',
        notes: 'Regular trekking enthusiast, loves Wayanad & Coorg.',
        status: 'active',
        totalBookings: 1,
        totalSpent: 14500,
      },
      {
        name: 'Karthik Subramanian',
        phone: '9444123456',
        email: 'karthik.subbu@example.com',
        city: 'Chennai',
        address: '14 Besant Nagar, Chennai, Tamil Nadu',
        notes: 'Family retreat, booked 4-person tempo trail.',
        status: 'active',
        totalBookings: 1,
        totalSpent: 28000,
      },
    ];

    console.log(`[Customer Seed] Inserting ${sampleCustomers.length} customers into MySQL...`);

    for (const data of sampleCustomers) {
      const [customer, created] = await Customer.findOrCreate({
        where: { phone: data.phone },
        defaults: data,
      });

      if (created) {
        console.log(`✅ Inserted: ${customer.name} (Phone: ${customer.phone}, ID: ${customer.id})`);
      } else {
        // Update existing customer details
        await customer.update(data);
        console.log(`🔄 Updated: ${customer.name} (Phone: ${customer.phone}, ID: ${customer.id})`);
      }
    }

    console.log('[Customer Seed] ✅ Customer details successfully written to MySQL database!');
  } catch (error) {
    console.error('❌ Error inserting customer details:', error);
  } finally {
    await disconnectDB();
  }
}

// If executed directly from command line
if (process.argv[1]?.endsWith('insertCustomer.js')) {
  insertSampleCustomers().then(() => process.exit(0));
}
