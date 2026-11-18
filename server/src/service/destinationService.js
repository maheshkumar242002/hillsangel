import { BaseService } from './BaseService.js';
import destinationRepository from '../repository/destinationRepository.js';

export class DestinationService extends BaseService {
  constructor() {
    super(destinationRepository);
  }

  /**
   * Get destinations enriched with live partner and package metrics
   */
  async getDestinationsWithStats(filters) {
    const { destinations, partnerCounts, packageCounts } =
      await destinationRepository.findDestinationsWithStats(filters);

    const partnerCountMap = new Map();
    partnerCounts.forEach((r) => {
      const key = `${r.loc || ''}|${r.subLoc || ''}|${r.category || ''}`;
      partnerCountMap.set(key, (partnerCountMap.get(key) || 0) + Number(r.cnt));
      const locOnlyKey = `${r.loc || ''}||${r.category || ''}`;
      partnerCountMap.set(locOnlyKey, (partnerCountMap.get(locOnlyKey) || 0) + Number(r.cnt));
    });

    const packageCountMap = new Map();
    packageCounts.forEach((r) => {
      packageCountMap.set(r.dest || '', Number(r.cnt));
    });

    const enriched = destinations.map((d) => {
      const dest = d.toJSON();
      const locKey = (dest.name || '').trim().toLowerCase();

      dest.livePackageCount = packageCountMap.get(locKey) || 0;
      dest.liveHotelCount = partnerCountMap.get(`${locKey}||hotel_resort`) || 0;
      dest.liveDiningCount = partnerCountMap.get(`${locKey}||restaurant_dining`) || 0;
      dest.liveActivityCount = partnerCountMap.get(`${locKey}||activity_sightseeing`) || 0;
      dest.liveCabCount = partnerCountMap.get(`${locKey}||transport_cab`) || 0;

      return dest;
    });

    return enriched;
  }

  /**
   * Create destination with duplicate name check
   */
  async createDestination(payload) {
    const existing = await destinationRepository.findByName(payload.name);
    if (existing) {
      const err = new Error(`Destination with name '${payload.name.trim()}' already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const destData = {
      name: payload.name.trim(),
      state: payload.state || 'Kerala',
      tagline: payload.tagline || '',
      description: payload.description || '',
      subLocations: Array.isArray(payload.subLocations) ? payload.subLocations : [],
      sightseeingSpots: Array.isArray(payload.sightseeingSpots) ? payload.sightseeingSpots : [],
      popularFor: Array.isArray(payload.popularFor) ? payload.popularFor : [],
      bestSeason: payload.bestSeason || 'September to March',
      elevation: payload.elevation || '',
      temperatureRange: payload.temperatureRange || '',
      heroImage: payload.heroImage || '',
      galleryImages: Array.isArray(payload.galleryImages) ? payload.galleryImages : [],
      status: payload.status || 'active',
      isFeatured: Boolean(payload.isFeatured),
      sortOrder: Number(payload.sortOrder) || 0,
    };

    return destinationRepository.create(destData);
  }

  /**
   * Update destination
   */
  async updateDestination(id, payload) {
    const dest = await destinationRepository.findById(id);
    if (!dest) {
      const err = new Error('Destination not found');
      err.statusCode = 404;
      throw err;
    }

    if (payload.name && payload.name.trim().toLowerCase() !== dest.name.toLowerCase()) {
      const conflict = await destinationRepository.findByName(payload.name, dest.id);
      if (conflict) {
        const err = new Error(`Destination with name '${payload.name.trim()}' already exists.`);
        err.statusCode = 409;
        throw err;
      }
    }

    await dest.update(payload);
    return dest;
  }

  /**
   * Add a sub-location hub
   */
  async addSubLocation(id, subLocationData) {
    const dest = await destinationRepository.findById(id);
    if (!dest) {
      const err = new Error('Destination not found');
      err.statusCode = 404;
      throw err;
    }

    const currentSubs = Array.isArray(dest.subLocations) ? [...dest.subLocations] : [];
    const nameTrimmed = subLocationData.name.trim();

    const exists = currentSubs.some((s) => (s.name || '').toLowerCase() === nameTrimmed.toLowerCase());
    if (exists) {
      const err = new Error(`Sub-location '${nameTrimmed}' already exists in ${dest.name}`);
      err.statusCode = 409;
      throw err;
    }

    const newSub = {
      id: `sub-${Date.now().toString().slice(-5)}`,
      name: nameTrimmed,
      category: subLocationData.category || 'Sightseeing Hub',
      description: subLocationData.description || '',
      elevation: subLocationData.elevation || '',
      distanceFromTown: subLocationData.distanceFromTown || '',
      popularAttractions: Array.isArray(subLocationData.popularAttractions)
        ? subLocationData.popularAttractions
        : [],
    };

    currentSubs.push(newSub);
    await dest.update({ subLocations: currentSubs });
    return { dest, subLocation: newSub };
  }

  /**
   * Toggle status
   */
  async toggleStatus(id) {
    const dest = await destinationRepository.findById(id);
    if (!dest) {
      const err = new Error('Destination not found');
      err.statusCode = 404;
      throw err;
    }

    const newStatus = dest.status === 'active' ? 'inactive' : 'active';
    await dest.update({ status: newStatus });
    return dest;
  }
}

export default new DestinationService();
