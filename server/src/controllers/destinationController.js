import { Op, Sequelize } from 'sequelize';
import Destination from '../models/Destination.js';
import PartnerTieup from '../models/PartnerTieup.js';
import Package from '../models/Package.js';

// @desc    Get all destinations with filters, search, and live partner/package counts
// @route   GET /api/destinations
// @access  Public / Admin
export const getDestinations = async (req, res, next) => {
  try {
    const { search, state, status, sort = 'sortOrder' } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (state && state !== 'all') {
      where.state = state;
    }
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { state: { [Op.like]: term } },
        { tagline: { [Op.like]: term } },
      ];
    }

    let order = [['sortOrder', 'ASC'], ['name', 'ASC']];
    if (sort === 'name') order = [['name', 'ASC']];
    if (sort === 'state') order = [['state', 'ASC']];
    if (sort === 'newest') order = [['createdAt', 'DESC']];

    const destinations = await Destination.findAll({ where, order });

    // BUG-012 Fix: Perform database-level aggregation via GROUP BY instead of in-memory array filtering
    const [partnerCounts, packageCounts] = await Promise.all([
      PartnerTieup.findAll({
        attributes: [
          [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('location'))), 'loc'],
          [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('subLocation'))), 'subLoc'],
          'category',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt'],
        ],
        group: [
          Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('location'))),
          Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('subLocation'))),
          'category',
        ],
        raw: true,
      }),
      Package.findAll({
        attributes: [
          [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('destination'))), 'dest'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt'],
        ],
        group: [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('destination')))],
        raw: true,
      }),
    ]);

    const enriched = destinations.map((d) => {
      const destObj = d.toJSON();
      const destNameLower = (d.name || '').toLowerCase().trim();

      // Filter from aggregated location groups
      const matchingPartners = partnerCounts.filter((p) => {
        const pLoc = p.loc || '';
        return pLoc === destNameLower || pLoc.includes(destNameLower) || destNameLower.includes(pLoc);
      });

      const lodgesCount = matchingPartners
        .filter((p) => p.category === 'stay')
        .reduce((sum, p) => sum + (Number(p.cnt) || 0), 0);

      const restaurantsCount = matchingPartners
        .filter((p) => p.category === 'food')
        .reduce((sum, p) => sum + (Number(p.cnt) || 0), 0);

      const packagesCount = packageCounts
        .filter((pkg) => {
          const pkgDest = pkg.dest || '';
          return pkgDest === destNameLower || pkgDest.includes(destNameLower) || destNameLower.includes(pkgDest);
        })
        .reduce((sum, pkg) => sum + (Number(pkg.cnt) || 0), 0);

      // Group sub-location counts from aggregated groups
      const subLocations = Array.isArray(destObj.subLocations) ? destObj.subLocations : [];
      const subLocationBreakdown = subLocations.map((subLoc) => {
        const subLower = (subLoc || '').toLowerCase().trim();
        const subLodges = matchingPartners
          .filter((p) => p.category === 'stay' && (p.subLoc || '') === subLower)
          .reduce((sum, p) => sum + (Number(p.cnt) || 0), 0);
        const subRestaurants = matchingPartners
          .filter((p) => p.category === 'food' && (p.subLoc || '') === subLower)
          .reduce((sum, p) => sum + (Number(p.cnt) || 0), 0);
        return {
          name: subLoc,
          lodgesCount: subLodges,
          restaurantsCount: subRestaurants,
        };
      });

      return {
        ...destObj,
        lodgesCount,
        restaurantsCount,
        packagesCount,
        subLocationsCount: subLocations.length,
        subLocationBreakdown,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      destinations: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single destination by ID or Name with associated partners and packages
// @route   GET /api/destinations/:id
// @access  Public
export const getDestinationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let destination;

    if (!isNaN(parseInt(id, 10))) {
      destination = await Destination.findByPk(id);
    }
    if (!destination) {
      destination = await Destination.findOne({
        where: { name: id },
      });
    }

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    const destObj = destination.toJSON();
    const destNameLower = destObj.name.toLowerCase().trim();

    // Fetch related partners and packages
    const [partners, packages] = await Promise.all([
      PartnerTieup.findAll({
        where: {
          [Op.or]: [
            { location: { [Op.like]: `%${destObj.name}%` } },
            { address: { [Op.like]: `%${destObj.name}%` } },
          ],
        },
      }),
      Package.findAll({
        where: {
          destination: { [Op.like]: `%${destObj.name}%` },
        },
      }),
    ]);

    const lodges = partners.filter((p) => p.category === 'stay');
    const restaurants = partners.filter((p) => p.category === 'food');

    res.status(200).json({
      success: true,
      destination: {
        ...destObj,
        lodges,
        restaurants,
        packages,
        lodgesCount: lodges.length,
        restaurantsCount: restaurants.length,
        packagesCount: packages.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new destination
// @route   POST /api/destinations
// @access  Private (Admin)
export const createDestination = async (req, res, next) => {
  try {
    const {
      name,
      state,
      tagline,
      description,
      subLocations,
      sightseeingSpots,
      popularFor,
      bestTimeToVisit,
      imageUrl,
      status,
      sortOrder,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Destination name is required',
      });
    }

    const existing = await Destination.findOne({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Destination "${name}" already exists`,
      });
    }

    // Clean up arrays
    const cleanSubLocations = Array.isArray(subLocations)
      ? Array.from(new Set(subLocations.map((s) => String(s).trim()).filter(Boolean)))
      : [];
    const cleanSpots = Array.isArray(sightseeingSpots)
      ? Array.from(new Set(sightseeingSpots.map((s) => String(s).trim()).filter(Boolean)))
      : [];
    const cleanPopularFor = Array.isArray(popularFor)
      ? Array.from(new Set(popularFor.map((s) => String(s).trim()).filter(Boolean)))
      : [];

    const newDest = await Destination.create({
      name: name.trim(),
      state: state ? state.trim() : 'Kerala',
      tagline: tagline ? tagline.trim() : '',
      description: description ? description.trim() : '',
      subLocations: cleanSubLocations,
      sightseeingSpots: cleanSpots,
      popularFor: cleanPopularFor,
      bestTimeToVisit: bestTimeToVisit ? bestTimeToVisit.trim() : 'All Year Round',
      imageUrl: imageUrl || '',
      status: status || 'active',
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      destination: newDest.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update destination
// @route   PUT /api/destinations/:id
// @access  Private (Admin)
export const updateDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByPk(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    const oldName = destination.name;
    const {
      name,
      state,
      tagline,
      description,
      subLocations,
      sightseeingSpots,
      popularFor,
      bestTimeToVisit,
      imageUrl,
      status,
      sortOrder,
    } = req.body;

    if (name && name.trim() !== oldName) {
      const existing = await Destination.findOne({
        where: {
          name: name.trim(),
          id: { [Op.ne]: destination.id },
        },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Destination with name "${name}" already exists`,
        });
      }
      destination.name = name.trim();

      // Optionally cascade update location name in partners and packages
      await PartnerTieup.update(
        { location: name.trim() },
        { where: { location: oldName } }
      );
      await Package.update(
        { destination: name.trim() },
        { where: { destination: oldName } }
      );
    }

    if (state !== undefined) destination.state = state.trim();
    if (tagline !== undefined) destination.tagline = tagline.trim();
    if (description !== undefined) destination.description = description.trim();
    if (subLocations !== undefined) {
      destination.subLocations = Array.isArray(subLocations)
        ? Array.from(new Set(subLocations.map((s) => String(s).trim()).filter(Boolean)))
        : [];
    }
    if (sightseeingSpots !== undefined) {
      destination.sightseeingSpots = Array.isArray(sightseeingSpots)
        ? Array.from(new Set(sightseeingSpots.map((s) => String(s).trim()).filter(Boolean)))
        : [];
    }
    if (popularFor !== undefined) {
      destination.popularFor = Array.isArray(popularFor)
        ? Array.from(new Set(popularFor.map((s) => String(s).trim()).filter(Boolean)))
        : [];
    }
    if (bestTimeToVisit !== undefined) destination.bestTimeToVisit = bestTimeToVisit.trim();
    if (imageUrl !== undefined) destination.imageUrl = imageUrl;
    if (status !== undefined) destination.status = status;
    if (sortOrder !== undefined) destination.sortOrder = parseInt(sortOrder, 10) || 0;

    await destination.save();

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      destination: destination.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a sub-location / area into a destination
// @route   POST /api/destinations/:id/sub-locations
// @access  Private (Admin)
export const addSubLocation = async (req, res, next) => {
  try {
    const destination = await Destination.findByPk(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    const { placeName } = req.body;
    if (!placeName || !placeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Place/Area name is required',
      });
    }

    const trimmed = placeName.trim();
    const currentSubs = Array.isArray(destination.subLocations) ? destination.subLocations : [];
    if (!currentSubs.includes(trimmed)) {
      destination.subLocations = [...currentSubs, trimmed];
      await destination.save();
    }

    res.status(200).json({
      success: true,
      message: `Added place "${trimmed}" to ${destination.name}`,
      subLocations: destination.subLocations,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle destination active/inactive
// @route   PATCH /api/destinations/:id/status
// @access  Private (Admin)
export const toggleDestinationStatus = async (req, res, next) => {
  try {
    const destination = await Destination.findByPk(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    destination.status = destination.status === 'active' ? 'inactive' : 'active';
    await destination.save();

    res.status(200).json({
      success: true,
      message: `Destination status changed to ${destination.status}`,
      destination: destination.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete destination
// @route   DELETE /api/destinations/:id
// @access  Private (Admin)
export const deleteDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByPk(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    await destination.destroy();

    res.status(200).json({
      success: true,
      message: 'Destination deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
