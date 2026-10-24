import Driver from '../models/Driver.js';

export const seedDriversIfEmpty = async () => {
  try {
    const count = await Driver.count();
    if (count > 0) {
      console.log(`[Seed] Drivers table already contains ${count} records. Skipping seed.`);
      return;
    }

    const realDrivers = [
      {
        name: 'Murugan K.',
        phone: '+91 98421 23456',
        altPhone: '+91 94432 11223',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        licenseNumber: 'TN38-2008-0029381',
        licenseExpiry: '2030-08-15',
        badgeNumber: 'HILL-BADGE-092',
        experienceYears: 14,
        specialization: 'High-Altitude 4x4 Mountain Safari Pilot',
        languages: ['Tamil', 'Malayalam', 'English'],
        emergencyContactName: 'Lakshmi M. (Wife)',
        emergencyContactPhone: '+91 98421 88990',
        bloodGroup: 'B+',
        address: '14/2 Upper Bazaar, Ooty, Nilgiris - 643001',
        assignedVehicleReg: 'KL 68 C 3024',
        dailyBatta: 900,
        rating: 4.95,
        totalTripsCompleted: 412,
        status: 'available',
        notes: 'Expert in Avalanche & Mudumalai off-road jungle trails. Certified wilderness first-aid responder.',
      },
      {
        name: 'Senthil Kumar R.',
        phone: '+91 94432 54321',
        altPhone: '+91 89031 44556',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        licenseNumber: 'TN43-2012-0048192',
        licenseExpiry: '2032-04-10',
        badgeNumber: 'HILL-BADGE-118',
        experienceYears: 11,
        specialization: 'Family Tour Chauffeur & Eco Guide',
        languages: ['Tamil', 'English', 'Hindi', 'Kannada'],
        emergencyContactName: 'Ramasamy (Father)',
        emergencyContactPhone: '+91 94432 99887',
        bloodGroup: 'O+',
        address: '42 Club Road, Near Boat House, Kodaikanal - 624101',
        assignedVehicleReg: 'TN 43 B 8891',
        dailyBatta: 850,
        rating: 4.9,
        totalTripsCompleted: 328,
        status: 'available',
        notes: 'Fluent in 4 languages, exceptional customer service and photography assistance on viewpoints.',
      },
      {
        name: 'Rajesh P.',
        phone: '+91 98940 76543',
        altPhone: '',
        photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        licenseNumber: 'KL68-2015-0019284',
        licenseExpiry: '2028-11-20',
        badgeNumber: 'HILL-BADGE-144',
        experienceYears: 9,
        specialization: 'Night Safari & Forest Wildlife Pilot',
        languages: ['Tamil', 'Malayalam', 'English'],
        emergencyContactName: 'Ponnusamy (Brother)',
        emergencyContactPhone: '+91 98940 11223',
        bloodGroup: 'A+',
        address: '8/92 Meppadi Road, Wayanad - 673577',
        assignedVehicleReg: 'KL 12 F 4492',
        dailyBatta: 800,
        rating: 4.88,
        totalTripsCompleted: 245,
        status: 'available',
        notes: 'Thorough knowledge of elephant corridors and night safari tracking around Wayanad & Bandipur.',
      },
      {
        name: 'Vijay Anand',
        phone: '+91 97890 12345',
        altPhone: '',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        licenseNumber: 'TN37-2016-0081723',
        licenseExpiry: '2031-01-30',
        badgeNumber: 'HILL-BADGE-172',
        experienceYears: 7,
        specialization: 'Heavy Vehicle & Urbania Luxury Coach Pilot',
        languages: ['Tamil', 'English'],
        emergencyContactName: 'Kavitha V. (Sister)',
        emergencyContactPhone: '+91 97890 99001',
        bloodGroup: 'AB+',
        address: '56 Coonoor Ghat Road, Mettupalayam - 641301',
        assignedVehicleReg: 'TN 37 E 9021',
        dailyBatta: 1000,
        rating: 4.92,
        totalTripsCompleted: 180,
        status: 'available',
        notes: 'Specialist in hairpin bend navigation with 14-17 seater Force Urbania luxury vans.',
      },
    ];

    await Driver.bulkCreate(realDrivers);
    console.log(`[Seed] Successfully seeded ${realDrivers.length} initial mountain pilots into drivers table.`);
  } catch (error) {
    console.error('Failed to seed drivers:', error);
  }
};
