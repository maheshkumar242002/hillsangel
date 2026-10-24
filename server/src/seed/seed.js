import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import sequelize from '../config/db.js';
import Admin from '../models/Admin.js';
import Package from '../models/Package.js';
import Booking from '../models/Booking.js';
import Enquiry from '../models/Enquiry.js';
import Settings from '../models/Settings.js';
import Customer from '../models/Customer.js';
import Category from '../models/Category.js';
import Tier from '../models/Tier.js';
import Asset from '../models/Asset.js';
import Gallery from '../models/Gallery.js';
import { samplePackages } from '../utils/seedData.js';

dotenv.config();

export async function runSeed({ keepAlive = false } = {}) {
  try {
    console.log('[Seed] Starting database seed process for El Shaddai Jeep Safari Munnar...');
    await connectDB();

    // Sync database schema to ensure updated ENUM/STRING column types
    await sequelize.sync({ alter: true });

    // 1. Seed or Update Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hillsangels.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    await Admin.destroy({ where: {} });
    const admin = await Admin.create({
      name: 'El Shaddai Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log(`[Seed] Admin user created: ${admin.email}`);

    // 2. Seed Default Settings
    await Settings.destroy({ where: {} });
    const defaultSettings = await Settings.create({
      siteName: 'El Shaddai Jeep Safari Munnar',
      tagline: 'Explore Nature Feel Alive • 4x4 Munnar Jeep Safari',
      whatsappNumber: process.env.WHATSAPP_NUMBER || '918111039182',
      contactPhone: '+91 81110 39182',
      contactEmail: 'info@elshaddaijeepsafari.com',
      address: 'Munnar Town, Near Old Bus Stand, Idukki District, Kerala - 685612',
      socialLinks: {
        instagram: 'https://instagram.com/elshaddaijeepsafari',
        facebook: 'https://facebook.com/elshaddaijeepsafari',
        youtube: 'https://youtube.com/@elshaddaijeepsafari',
      },
      hero: {
        title: 'Adventure Awaits in Munnar • Ride, Explore, Discover',
        subtitle:
          'Explore nature and feel alive with El Shaddai Jeep Safari. Curated 4x4 off-road safari tours for Family Trips and Friends Trips across Kanthaloor, Mattupatty, Cochin, Viriparai & Ponmudi.',
        badgeText: 'Official El Shaddai 4x4 Jeep Safari Munnar',
        bannerImage:
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=80',
      },
    });
    console.log(`[Seed] Site settings initialized with WhatsApp: ${defaultSettings.whatsappNumber}`);

    // 3. Seed Category Collection: Exactly 2 Categories (family & friends)
    await Category.destroy({ where: {} });
    const familyCategory = await Category.create({
      key: 'family',
      name: 'Family Trip',
      slug: 'family',
      badgeText: 'Family Safari',
      description:
        'Safe, scenic, and joyful 4x4 Munnar Jeep Safaris crafted for families, kids, and seniors. Explore gardens, tea museums, waterfalls, and peaceful viewpoints.',
      targetAudience: 'Families with Kids & Elders',
      icon: 'Users',
      highlights: [
        'Private 4x4 Safari Jeep with Experienced Chauffeur',
        'Comfortable sightseeing pace for kids & elders',
        'Tea museum, gardens, dams, and waterfall photo spots',
        'Safe elephant arrival spot and scenic boating',
      ],
      defaultMaxSeats: 6,
      defaultPriceUnit: 'per jeep',
      isActive: true,
    });

    const friendsCategory = await Category.create({
      key: 'friends',
      name: 'Friends Trip',
      slug: 'friends',
      badgeText: 'Off-Road & Adventure',
      description:
        'Action-packed 4x4 off-road safari adventures for friends. Splashing river crossings, tiger caves, high-altitude clifftops, ziplines, and group photography spots.',
      targetAudience: 'Friends & Adventure Groups',
      icon: 'Compass',
      highlights: [
        'Exciting 4x4 Off-Road Trail & River Crossing',
        'High-altitude clifftops at Top Station & Chathurangapara',
        'Zipline, hanging bridge & adventure activities',
        'Unforgettable reels and scenic road-trip memories',
      ],
      defaultMaxSeats: 6,
      defaultPriceUnit: 'per jeep',
      isActive: true,
    });
    console.log('[Seed] Categories seeded (family & friends).');

    // 4. Seed Tier Collection
    await Tier.destroy({ where: {} });
    const premiumTier = await Tier.create({
      key: 'premium',
      name: 'Standard 4x4 Safari',
      slug: 'premium',
      badgeText: '4x4 Commander Safari',
      starRating: 4,
      resortType: 'Mahindra Commander 4x4 Off-Road Jeep',
      description:
        'Complete direction safari in heavy-duty 4x4 Jeep with experienced mountain chauffeur.',
      badgeColor: 'elaichi',
      perks: [
        'Dedicated 4x4 Mahindra Jeep',
        'Experienced local driver-cum-guide',
        'All listed direction spots covered',
        'Fuel, parking & permits included',
      ],
      isActive: true,
    });

    const extraPremiumTier = await Tier.create({
      key: 'extra_premium',
      name: 'VIP Open-Top 4x4 Safari',
      slug: 'extra-premium',
      badgeText: 'VIP Open-Top 4x4',
      starRating: 5,
      resortType: 'Modified Open-Top Thar / Gurkha 4x4 Safari',
      description:
        'Premium open-top safari with action cam / GoPro mount, high-elevation viewpoint stops, snacks and priority guide assistance.',
      badgeColor: 'gold',
      perks: [
        'Open-top panoramic viewing',
        'Action camera / GoPro mounting setup',
        'Complimentary snacks & cold beverages',
        'Priority photo assistance & flexible stoppage times',
      ],
      isActive: true,
    });
    console.log('[Seed] Tiers seeded (premium & extra_premium).');

    // 5. Seed Vehicles & Rental Assets
    await Asset.destroy({ where: {} });
    const commanderJeep = await Asset.create({
      name: 'Mahindra Commander 4x4 Jeep (KL 68 C 3024)',
      assetCode: 'AST-VEH-01',
      category: 'vehicle',
      buyPrice: 850000,
      rentPrice: 0,
      rentUnit: 'per trip',
      quantity: 5,
      availableQuantity: 5,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      description: 'Signature El Shaddai 4x4 Commander Safari Jeep (KL 68 C 3024) with heavy-duty off-road suspension and panoramic safari seating for up to 6 passengers.',
      vehicleSpecs: {
        seatingCapacity: 6,
        vehicleType: 'jeep',
        ac: false,
        transmission: 'Manual 4x4 High/Low',
        fuelType: 'Diesel',
      },
    });

    const tharOpen = await Asset.create({
      name: 'Mahindra Thar 4x4 Open-Top Safari Jeep',
      assetCode: 'AST-VEH-02',
      category: 'vehicle',
      buyPrice: 1750000,
      rentPrice: 1500,
      rentUnit: 'per trip',
      quantity: 3,
      availableQuantity: 3,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      description: 'Open-air modified 4x4 Jeep with roof bars for 360-degree photography across Top Station and Chathurangapara.',
      vehicleSpecs: {
        seatingCapacity: 5,
        vehicleType: 'jeep',
        ac: false,
        transmission: 'Manual 4x4',
        fuelType: 'Diesel',
      },
    });

    const goproKit = await Asset.create({
      name: 'GoPro HERO 11 Black 5K Adventure Action Kit',
      assetCode: 'AST-ELC-01',
      category: 'electronics',
      buyPrice: 46000,
      rentPrice: 1000,
      rentUnit: 'per day',
      quantity: 4,
      availableQuantity: 4,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      description: 'Ultra-stabilized 5.3K video camera with hood mount for recording thrilling off-road river crossings and mountain bends.',
    });

    const droneKit = await Asset.create({
      name: 'DJI 4K Drone Aerial Photoshoot Kit',
      assetCode: 'AST-ELC-02',
      category: 'electronics',
      buyPrice: 85000,
      rentPrice: 2000,
      rentUnit: 'per trip',
      quantity: 2,
      availableQuantity: 2,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
      description: 'Professional drone video recording at Top Station, Chathurangapara Windmill, and Shooting Point.',
    });

    const campingTent = await Asset.create({
      name: '4-Person Alpine Waterproof Dome Tent',
      assetCode: 'AST-CMP-01',
      category: 'camping',
      buyPrice: 12000,
      rentPrice: 800,
      rentUnit: 'per trip',
      quantity: 6,
      availableQuantity: 6,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      description: 'Double-layered waterproof tent for campfire night stops in Munnar.',
    });

    console.log('[Seed] Seeded Safari Vehicles and Gear Assets.');

    // 6. Seed Gallery Collection
    await Gallery.destroy({ where: {} });
    await Gallery.bulkCreate([
      {
        title: 'El Shaddai 4x4 Commander Jeep in Action (KL 68 C 3024)',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
        tag: 'Jeep Safari',
        caption: 'Mahindra Commander 4x4 Safari Jeep cruising through mist-clad mountain bends of Munnar.',
        featured: true,
        sortOrder: 1,
      },
      {
        title: 'Viriparai River Crossing 4x4 Off-Road Thrill',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        tag: 'Viriparai',
        caption: 'Exciting river splash crossing during the Viriparai off-road safari route.',
        featured: true,
        sortOrder: 2,
      },
      {
        title: 'Top Station Clifftops & Sea of Clouds',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        tag: 'Mattupatty',
        caption: 'End of Mattupatty circuit at Top Station overlooking the Western Ghats clifftops.',
        featured: true,
        sortOrder: 3,
      },
      {
        title: 'Kanthaloor Apple Orchards & Sandalwood Forest',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
        tag: 'Kanthaloor',
        caption: 'Fresh apple orchards and ancient Muniyara dolmens in Kanthaloor direction.',
        featured: true,
        sortOrder: 4,
      },
      {
        title: 'Chathurangapara Windmill Ridge Viewpoint',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80',
        tag: 'Ponmudi',
        caption: 'Breezy windmill cliff peak with panoramic valley views on Ponmudi direction.',
        featured: true,
        sortOrder: 5,
      },
      {
        title: 'Athukad Waterfalls & Wonder Valley Zipline',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=600&q=80',
        tag: 'Cochin Direction',
        caption: 'Athukad waterfall cascade and high valley zipline adventure on Cochin route.',
        featured: true,
        sortOrder: 6,
      },
    ]);
    console.log('[Seed] Seeded Gallery collection with Munnar safari destinations.');

    // 7. Seed Packages: Clean delete old and insert new 10 packages
    await Package.destroy({ where: {} });
    const insertedPackages = [];
    for (const pkg of samplePackages) {
      const categoryId = pkg.category === 'family' ? familyCategory.id : friendsCategory.id;
      const tierId = pkg.tier === 'premium' ? premiumTier.id : extraPremiumTier.id;

      const includedAssetIds = [commanderJeep.id];
      const availableVehicleIds = [commanderJeep.id, tharOpen.id];

      const createdPkg = await Package.create({
        ...pkg,
        categoryId,
        tierId,
        includedAssetIds,
        availableVehicleIds,
      });
      insertedPackages.push(createdPkg);
    }
    console.log(`[Seed] Successfully inserted ${insertedPackages.length} Munnar Jeep Safari packages.`);

    // 8. Seed Customers Collection
    await Customer.destroy({ where: {} });
    const cust1 = await Customer.create({
      name: 'Karthik Subramanian',
      phone: '9840123456',
      email: 'karthik.subramanian@gmail.com',
      city: 'Chennai',
      totalBookings: 1,
      totalSpent: 6000,
      notes: 'Family trip with 2 kids and parents, booked Mattupatty & Top Station safari.',
      status: 'active',
    });

    const cust2 = await Customer.create({
      name: 'Arun & Friends (Group of 6)',
      phone: '9944556677',
      email: 'arun.bangalore@gmail.com',
      city: 'Bangalore',
      totalBookings: 1,
      totalSpent: 6000,
      notes: 'College friends group, booked Viriparai Off-Road River Crossing.',
      status: 'active',
    });

    const cust3 = await Customer.create({
      name: 'Deepak Nair',
      phone: '9895123456',
      email: 'deepak.nair@yahoo.com',
      city: 'Kochi',
      totalBookings: 1,
      totalSpent: 5000,
      notes: 'Family trip to Kanthaloor apple farm.',
      status: 'active',
    });
    console.log('[Seed] Customers collection initialized with demo records.');

    // 9. Seed Initial Bookings
    await Booking.destroy({ where: {} });
    const mattupattyFamily = insertedPackages.find(
      (p) => p.slug === 'munnar-mattupatty-top-station-jeep-safari-family'
    );
    const viriparaiFriends = insertedPackages.find(
      (p) => p.slug === 'munnar-viriparai-offroad-safari-friends'
    );

    if (mattupattyFamily) {
      await Booking.create({
        bookingId: 'ESJ-2026-0001',
        customerId: cust1.id,
        categoryId: familyCategory.id,
        tierId: premiumTier.id,
        packageId: mattupattyFamily.id,
        packageSnapshot: {
          title: mattupattyFamily.title,
          slug: mattupattyFamily.slug,
          category: mattupattyFamily.category,
          tier: mattupattyFamily.tier,
          destination: mattupattyFamily.destination,
          price: mattupattyFamily.price,
          priceUnit: mattupattyFamily.priceUnit,
        },
        customerName: cust1.name,
        phone: cust1.phone,
        email: cust1.email,
        travelDate: new Date(Date.now() + 3 * 86400000),
        persons: 5,
        pickupLocation: 'Munnar Town Hotel',
        transportVehicle: {
          name: 'Mahindra Commander 4x4 Jeep (KL 68 C 3024)',
          vehicleType: 'jeep',
          price: 0,
        },
        rentalAssets: [],
        totalPrice: 6000,
        status: 'confirmed',
        notes: 'Family safari, 2 kids included. Need slow driving near Top Station.',
      });
    }

    if (viriparaiFriends) {
      await Booking.create({
        bookingId: 'ESJ-2026-0002',
        customerId: cust2.id,
        categoryId: friendsCategory.id,
        tierId: premiumTier.id,
        packageId: viriparaiFriends.id,
        packageSnapshot: {
          title: viriparaiFriends.title,
          slug: viriparaiFriends.slug,
          category: viriparaiFriends.category,
          tier: viriparaiFriends.tier,
          destination: viriparaiFriends.destination,
          price: viriparaiFriends.price,
          priceUnit: viriparaiFriends.priceUnit,
        },
        customerName: cust2.name,
        phone: cust2.phone,
        email: cust2.email,
        travelDate: new Date(Date.now() + 5 * 86400000),
        persons: 6,
        pickupLocation: 'Adimali / Munnar Junction',
        transportVehicle: {
          name: 'Mahindra Commander 4x4 Jeep (KL 68 C 3024)',
          vehicleType: 'jeep',
          price: 0,
        },
        rentalAssets: [
          {
            name: 'GoPro HERO 11 Black 5K Adventure Action Kit',
            rentPrice: 1000,
            quantity: 1,
          },
        ],
        totalPrice: 7000,
        status: 'pending',
        notes: 'Excited for deep river crossing and tiger cave.',
      });
    }
    console.log('[Seed] Inserted initial El Shaddai safari bookings.');

    // 10. Seed Initial Customer Enquiries
    await Enquiry.destroy({ where: {} });
    await Enquiry.bulkCreate([
      {
        name: 'Suresh Kumar',
        phone: '9841234567',
        email: 'suresh.k@gmail.com',
        subject: 'Family Trip to Kanthaloor Apple Farm',
        message: 'We are a family of 5 planning to visit Munnar this Saturday. Can we visit the Kanthaloor apple farm and live jaggery making in one jeep?',
        status: 'unread',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        name: 'Gautam Menon',
        phone: '9847112233',
        email: 'gautam.menon@outlook.com',
        subject: 'Friends Trip Viriparai Off-Road River Crossing',
        message: 'Hi, we are 6 friends coming from Kochi. Is the river crossing active this month? We want to book the Viriparai off-road package.',
        status: 'read',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    ]);
    console.log('[Seed] Inserted initial customer enquiries.');

    console.log('[Seed] Database seeding completed successfully! ✨');
    if (!keepAlive) {
      await disconnectDB();
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    if (!keepAlive) {
      process.exit(1);
    }
  }
}

// If run directly via node src/seed/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed().then(() => process.exit(0));
}
