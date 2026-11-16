2
import { Op } from 'sequelize';
import PartnerTieup from '../models/PartnerTieup.js';
import TripSettlement from '../models/TripSettlement.js';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import sequelize from '../config/db.js';

// @desc    Get all partner tie-ups with filters & search
// @route   GET /api/partners
// @access  Public / Admin
export const getPartners = async (req, res, next) => {
  try {
    const {
      category,
      type,
      location,
      status,
      pricingModel,
      search,
      sort = 'name',
    } = req.query;

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }
    if (type && type !== 'all') {
      where.type = type;
    }
    if (location && location !== 'all') {
      where.location = location;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (pricingModel && pricingModel !== 'all') {
      where.pricingModel = pricingModel;
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { partnerCode: { [Op.like]: term } },
        { location: { [Op.like]: term } },
        { contactPerson: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { address: { [Op.like]: term } },
      ];
    }

    let order = [['name', 'ASC']];
    if (sort === 'createdAt_desc') order = [['createdAt', 'DESC']];
    else if (sort === 'price_asc') order = [['pricePerPerson', 'ASC']];
    else if (sort === 'price_desc') order = [['pricePerPerson', 'DESC']];
    else if (sort === 'rating_desc') order = [['rating', 'DESC']];

    const partners = await PartnerTieup.findAll({
      where,
      order,
    });

    res.status(200).json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get partner statistics & financial averages
// @route   GET /api/partners/stats
// @access  Admin Protected
export const getPartnerStats = async (req, res, next) => {
  try {
    const totalCount = await PartnerTieup.count();
    const stayCount = await PartnerTieup.count({ where: { category: 'stay' } });
    const foodCount = await PartnerTieup.count({ where: { category: 'food' } });
    const activeCount = await PartnerTieup.count({ where: { status: 'active' } });

    // Stay average pricing
    const [stayAverages] = await sequelize.query(`
      SELECT 
        COALESCE(AVG(CASE WHEN pricePerPerson > 0 THEN pricePerPerson END), 0) AS avgStayPerPerson,
        COALESCE(AVG(CASE WHEN pricePerRoom > 0 THEN pricePerRoom END), 0) AS avgStayPerRoom,
        COALESCE(AVG(CASE WHEN pricePerTrip > 0 THEN pricePerTrip END), 0) AS avgStayPerTrip
      FROM partner_tieups
      WHERE category = 'stay' AND status = 'active'
    `);

    // Food average pricing
    const [foodAverages] = await sequelize.query(`
      SELECT 
        COALESCE(AVG(CASE WHEN pricePerPerson > 0 THEN pricePerPerson END), 0) AS avgFoodPerPerson,
        COALESCE(AVG(CASE WHEN pricePerTrip > 0 THEN pricePerTrip END), 0) AS avgFoodPerTrip
      FROM partner_tieups
      WHERE category = 'food' AND status = 'active'
    `);

    // Distinct locations
    const locationsResult = await PartnerTieup.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('location')), 'location']],
      raw: true,
    });
    const locations = locationsResult.map((l) => l.location).filter(Boolean);

    res.status(200).json({
      success: true,
      stats: {
        totalCount,
        stayCount,
        foodCount,
        activeCount,
        avgStayPerPerson: Math.round(stayAverages[0]?.avgStayPerPerson || 0),
        avgStayPerRoom: Math.round(stayAverages[0]?.avgStayPerRoom || 0),
        avgStayPerTrip: Math.round(stayAverages[0]?.avgStayPerTrip || 0),
        avgFoodPerPerson: Math.round(foodAverages[0]?.avgFoodPerPerson || 0),
        avgFoodPerTrip: Math.round(foodAverages[0]?.avgFoodPerTrip || 0),
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate Trip Settlement / Vendor Cost Estimator
// @route   POST /api/partners/calculate-settlement
// @access  Admin Protected
export const calculateTripSettlement = async (req, res, next) => {
  try {
    const { stayPartnerId, foodPartnerId, persons = 1, nights = 1, days = 1 } = req.body;

    const numPersons = Math.max(1, parseInt(persons, 10) || 1);
    const numNights = Math.max(1, parseInt(nights, 10) || 1);
    const numDays = Math.max(1, parseInt(days, 10) || numNights);

    let stayDetails = null;
    let stayCost = 0;
    let stayCostPerPerson = 0;

    if (stayPartnerId) {
      const stay = await PartnerTieup.findByPk(stayPartnerId);
      if (stay) {
        if (stay.pricingModel === 'per_person') {
          stayCost = stay.pricePerPerson * numPersons * numNights;
          stayCostPerPerson = stay.pricePerPerson * numNights;
        } else if (stay.pricingModel === 'per_room') {
          const roomCapacity = stay.maxGuestsPerRoom || 2;
          const roomsNeeded = Math.ceil(numPersons / roomCapacity);
          stayCost = stay.pricePerRoom * roomsNeeded * numNights;
          stayCostPerPerson = Math.round(stayCost / numPersons);
        } else if (stay.pricingModel === 'per_trip') {
          stayCost = stay.pricePerTrip;
          stayCostPerPerson = Math.round(stayCost / numPersons);
        } else {
          stayCost = (stay.pricePerPerson || stay.pricePerRoom || 0) * numPersons * numNights;
          stayCostPerPerson = Math.round(stayCost / numPersons);
        }

        stayDetails = {
          id: stay.id,
          name: stay.name,
          type: stay.type,
          pricingModel: stay.pricingModel,
          rateUsed: stay.pricePerPerson || stay.pricePerRoom || stay.pricePerTrip,
          totalCost: stayCost,
          costPerPerson: stayCostPerPerson,
        };
      }
    }

    let foodDetails = null;
    let foodCost = 0;
    let foodCostPerPerson = 0;

    if (foodPartnerId) {
      const food = await PartnerTieup.findByPk(foodPartnerId);
      if (food) {
        let mealPricing = food.mealPricing;
        if (typeof mealPricing === 'string') {
          try {
            mealPricing = JSON.parse(mealPricing);
          } catch (e) {
            mealPricing = {};
          }
        }
        mealPricing = mealPricing || {};

        const bPrice = Number(mealPricing.breakfast || 0);
        const lPrice = Number(mealPricing.lunch || 0);
        const dPrice = Number(mealPricing.dinner || 0);
        const fullDay = Number(mealPricing.fullDay || (bPrice + lPrice + dPrice) || 0);

        const mealsConfig = req.body.selectedMeals;
        let rateUsed = 0;
        let mealSelectionSummary = [];

        if (food.pricingModel === 'per_trip') {
          foodCost = Number(food.pricePerTrip || 0);
          foodCostPerPerson = Math.round(foodCost / numPersons);
          rateUsed = food.pricePerTrip;
          mealSelectionSummary.push('Per Trip Food Contract');
        } else if (mealsConfig && typeof mealsConfig === 'object') {
          if (mealsConfig.breakfast) {
            rateUsed += bPrice;
            mealSelectionSummary.push(`Breakfast (₹${bPrice})`);
          }
          if (mealsConfig.lunch) {
            rateUsed += lPrice;
            mealSelectionSummary.push(`Lunch (₹${lPrice})`);
          }
          if (mealsConfig.dinner) {
            rateUsed += dPrice;
            mealSelectionSummary.push(`Dinner (₹${dPrice})`);
          }

          if (rateUsed === 0 && !mealsConfig.breakfast && !mealsConfig.lunch && !mealsConfig.dinner) {
            rateUsed = 0;
          } else if (rateUsed === 0) {
            rateUsed = Number(food.pricePerPerson || fullDay || 0);
            mealSelectionSummary.push('Standard Daily Rate');
          }

          foodCost = rateUsed * numPersons * numDays;
          foodCostPerPerson = rateUsed * numDays;
        } else if (food.pricingModel === 'per_meal' && (bPrice || lPrice || dPrice)) {
          rateUsed = fullDay || (bPrice + lPrice + dPrice);
          foodCost = rateUsed * numPersons * numDays;
          foodCostPerPerson = rateUsed * numDays;
          mealSelectionSummary.push(`Full Day Meals (₹${rateUsed})`);
        } else {
          rateUsed = Number(food.pricePerPerson || 0);
          foodCost = rateUsed * numPersons * numDays;
          foodCostPerPerson = rateUsed * numDays;
          mealSelectionSummary.push(`Standard Rate (₹${rateUsed})`);
        }

        foodDetails = {
          id: food.id,
          name: food.name,
          type: food.type,
          pricingModel: food.pricingModel,
          rateUsed,
          totalCost: foodCost,
          costPerPerson: foodCostPerPerson,
          mealPricing: {
            breakfast: bPrice,
            lunch: lPrice,
            dinner: dPrice,
            fullDay,
          },
          selectedMeals: mealsConfig || { breakfast: true, lunch: true, dinner: true },
          mealSelectionSummary: mealSelectionSummary.join(' + ') || 'Custom Meal Plan',
        };
      }
    }

    const totalSettlement = stayCost + foodCost;
    const totalPerPerson = stayCostPerPerson + foodCostPerPerson;

    // Dynamic Organizing Partners Profit Sharing Calculation
    // CRITICAL: ONLY NET PROFIT (Revenue - All Direct Trip Costs) IS SHARED!
    const revenue = Math.max(0, parseFloat(req.body.tripRevenue) || 0);
    const transport = Math.max(0, parseFloat(req.body.transportCost) || 0);
    const misc = Math.max(0, parseFloat(req.body.miscCost) || 0);

    const totalTripExpenses = totalSettlement + transport + misc;
    const netOrganizingProfit = Math.max(0, revenue - totalTripExpenses);
    const profitMarginPercent = revenue > 0 ? Math.round((netOrganizingProfit / revenue) * 100) : 0;

    let partnersInput = Array.isArray(req.body.partners) && req.body.partners.length > 0
      ? req.body.partners
      : [
        {
          name: req.body.partner1Name || 'Partner 1 (mohan)',
          sharePercent: parseFloat(req.body.partner1Percent) ?? 50,
        },
        {
          name: req.body.partner2Name || 'Partner 2 (Co-Organizer)',
          sharePercent: parseFloat(req.body.partner2Percent) ?? 50,
        },
      ];

    const partnerCommissionDetails = partnersInput.map((p, idx) => {
      const sharePct = parseFloat(p.sharePercent) || 0;
      // Share ONLY from net profit!
      const amount = Math.round(netOrganizingProfit * (sharePct / 100));
      return {
        id: p.id || `partner-${idx + 1}`,
        name: p.name || `Partner ${idx + 1}`,
        phone: p.phone || '',
        sharePercent: sharePct,
        amount,
      };
    });

    const p1 = partnerCommissionDetails[0] || { name: 'Partner 1', sharePercent: 50, amount: 0 };
    const p2 = partnerCommissionDetails[1] || { name: 'Partner 2', sharePercent: 50, amount: 0 };

    res.status(200).json({
      success: true,
      data: {
        persons: numPersons,
        nights: numNights,
        days: numDays,
        stay: stayDetails,
        food: foodDetails,
        totalSettlement,
        totalPerPerson,
        partnerSplit: {
          tripRevenue: revenue,
          transportCost: transport,
          miscCost: misc,
          totalVendorPayout: totalSettlement,
          totalTripExpenses,
          netOrganizingProfit,
          profitMarginPercent,
          partners: partnerCommissionDetails,
          partner1: p1,
          partner2: p2,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single partner tie-up
// @route   GET /api/partners/:id
// @access  Public / Admin
export const getPartnerById = async (req, res, next) => {
  try {
    const partner = await PartnerTieup.findByPk(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner tie-up not found' });
    }
    res.status(200).json({ success: true, partner });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new partner tie-up
// @route   POST /api/partners
// @access  Admin Protected
export const createPartner = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Auto-generate partnerCode if missing
    if (!data.partnerCode || data.partnerCode.trim() === '') {
      const prefix = data.category === 'stay' ? (data.type === 'cottage' ? 'COT' : 'HOT') : 'RES';
      const randomNum = Math.floor(100 + Math.random() * 900);
      data.partnerCode = `${prefix}-${randomNum}`;
    }

    // Default category based on type if not explicitly set
    if (!data.category) {
      const stayTypes = ['cottage', 'hotel', 'resort', 'homestay'];
      data.category = stayTypes.includes(data.type) ? 'stay' : 'food';
    }

    const partner = await PartnerTieup.create(data);
    res.status(201).json({
      success: true,
      message: 'Partner tie-up created successfully',
      partner,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Partner code already exists. Please choose a unique code.',
      });
    }
    next(error);
  }
};

// @desc    Update partner tie-up
// @route   PUT /api/partners/:id
// @access  Admin Protected
export const updatePartner = async (req, res, next) => {
  try {
    const partner = await PartnerTieup.findByPk(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner tie-up not found' });
    }

    const data = { ...req.body };
    if (data.type && !data.category) {
      const stayTypes = ['cottage', 'hotel', 'resort', 'homestay'];
      data.category = stayTypes.includes(data.type) ? 'stay' : 'food';
    }

    await partner.update(data);
    res.status(200).json({
      success: true,
      message: 'Partner tie-up updated successfully',
      partner,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Partner code already exists. Please choose a unique code.',
      });
    }
    next(error);
  }
};

// @desc    Delete partner tie-up
// @route   DELETE /api/partners/:id
// @access  Admin Protected
export const deletePartner = async (req, res, next) => {
  try {
    const partner = await PartnerTieup.findByPk(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner tie-up not found' });
    }
    await partner.destroy();
    res.status(200).json({
      success: true,
      message: 'Partner tie-up deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// TRIP SETTLEMENTS & COMMISSION TRACKING
// ==========================================

// @desc    Save new trip settlement record with partner profit shares
// @route   POST /api/partners/settlements
// @access  Admin Protected
export const saveTripSettlement = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Auto generate settlementCode if missing
    if (!data.settlementCode || data.settlementCode.trim() === '') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const rand = Math.floor(100 + Math.random() * 900);
      data.settlementCode = `SET-${yr}${mo}-${rand}`;
    }

    // Default calculations if not provided
    const revenue = Math.max(0, parseFloat(data.tripRevenue) || 0);
    const stayCost = Math.max(0, parseFloat(data.stayCost) || 0);
    const foodCost = Math.max(0, parseFloat(data.foodCost) || 0);
    const transport = Math.max(0, parseFloat(data.transportCost) || 0);
    const misc = Math.max(0, parseFloat(data.miscCost) || 0);

    const totalExpenses = data.totalExpenses !== undefined
      ? parseFloat(data.totalExpenses)
      : (stayCost + foodCost + transport + misc);

    const netProfit = data.netProfit !== undefined
      ? parseFloat(data.netProfit)
      : Math.max(0, revenue - totalExpenses);

    const profitMarginPercent = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    data.tripRevenue = revenue;
    data.stayCost = stayCost;
    data.foodCost = foodCost;
    data.transportCost = transport;
    data.miscCost = misc;
    data.totalExpenses = totalExpenses;
    data.netProfit = netProfit;
    data.profitMarginPercent = profitMarginPercent;

    // Ensure partnersBreakdown has status defaulted to pending if not specified
    if (Array.isArray(data.partnersBreakdown)) {
      data.partnersBreakdown = data.partnersBreakdown.map((p, idx) => ({
        id: p.id || `partner-${idx + 1}`,
        name: p.name || `Partner ${idx + 1}`,
        phone: p.phone || '',
        sharePercent: parseFloat(p.sharePercent) || 0,
        amount: Math.round(parseFloat(p.amount) || (netProfit * ((parseFloat(p.sharePercent) || 0) / 100))),
        status: p.status || 'pending',
        paymentMode: p.paymentMode || 'upi',
        paymentRef: p.paymentRef || '',
        paidAt: p.status === 'paid' ? (p.paidAt || new Date().toISOString()) : null,
      }));

      // Determine overallStatus
      const allPaid = data.partnersBreakdown.every(p => p.status === 'paid');
      const anyPaid = data.partnersBreakdown.some(p => p.status === 'paid');
      data.overallStatus = allPaid ? 'settled' : (anyPaid ? 'partial' : 'pending');
    }

    const settlement = await TripSettlement.create(data);

    res.status(201).json({
      success: true,
      message: 'Trip settlement and partner profit shares saved successfully',
      settlement,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Settlement code already exists. Please use a unique reference code.',
      });
    }
    next(error);
  }
};

// @desc    Get all trip settlements with filters & pagination
// @route   GET /api/partners/settlements
// @access  Admin Protected
export const getTripSettlements = async (req, res, next) => {
  try {
    const { status, partnerName, destination, search, sort = 'createdAt_desc' } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.overallStatus = status;
    }
    if (destination && destination !== 'all') {
      where.destination = destination;
    }
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { settlementCode: { [Op.like]: term } },
        { tripTitle: { [Op.like]: term } },
        { destination: { [Op.like]: term } },
        { stayPartnerName: { [Op.like]: term } },
        { foodPartnerName: { [Op.like]: term } },
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'date_asc') order = [['tripDate', 'ASC']];
    else if (sort === 'date_desc') order = [['tripDate', 'DESC']];
    else if (sort === 'profit_desc') order = [['netProfit', 'DESC']];

    const settlements = await TripSettlement.findAll({
      where,
      order,
    });

    const safeParseBreakdown = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const formattedSettlements = settlements.map((s) => {
      const item = s.get ? s.get({ plain: true }) : s;
      item.partnersBreakdown = safeParseBreakdown(item.partnersBreakdown);
      return item;
    });

    // In-memory filter by partner name inside partnersBreakdown if provided
    let filteredSettlements = formattedSettlements;
    if (partnerName && partnerName !== 'all') {
      filteredSettlements = formattedSettlements.filter((s) => {
        const list = s.partnersBreakdown || [];
        return list.some((p) => p.name?.toLowerCase().includes(partnerName.toLowerCase()));
      });
    }

    res.status(200).json({
      success: true,
      count: filteredSettlements.length,
      settlements: filteredSettlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive commission & profit tracking analytics
// @route   GET /api/partners/commission-stats
// @access  Admin Protected
export const getCommissionStats = async (req, res, next) => {
  try {
    const settlements = await TripSettlement.findAll({
      order: [['tripDate', 'DESC']],
    });

    const safeParseBreakdown = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalNetProfit = 0;
    let totalCommissionDistributed = 0;
    let totalPaidCommission = 0;
    let totalPendingCommission = 0;

    // Partner-by-partner aggregates
    const partnerMap = {};

    settlements.forEach((s) => {
      totalRevenue += s.tripRevenue || 0;
      totalExpenses += s.totalExpenses || 0;
      totalNetProfit += s.netProfit || 0;

      const breakdown = safeParseBreakdown(s.partnersBreakdown);
      breakdown.forEach(p => {
        const amt = parseFloat(p.amount) || 0;
        const isPaid = p.status === 'paid';
        totalCommissionDistributed += amt;
        if (isPaid) {
          totalPaidCommission += amt;
        } else {
          totalPendingCommission += amt;
        }

        const key = p.name ? p.name.trim() : 'Unknown Partner';
        if (!partnerMap[key]) {
          partnerMap[key] = {
            name: key,
            phone: p.phone || '',
            tripsCount: 0,
            totalEarned: 0,
            totalPaid: 0,
            totalPending: 0,
            lastTripDate: s.tripDate,
            lastSettlementCode: s.settlementCode,
          };
        }

        partnerMap[key].tripsCount += 1;
        partnerMap[key].totalEarned += amt;
        if (isPaid) {
          partnerMap[key].totalPaid += amt;
        } else {
          partnerMap[key].totalPending += amt;
        }
      });
    });

    const partnerSummary = Object.values(partnerMap).sort((a, b) => b.totalEarned - a.totalEarned);

    res.status(200).json({
      success: true,
      stats: {
        totalTrips: settlements.length,
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses),
        totalNetProfit: Math.round(totalNetProfit),
        totalCommissionDistributed: Math.round(totalCommissionDistributed),
        totalPaidCommission: Math.round(totalPaidCommission),
        totalPendingCommission: Math.round(totalPendingCommission),
        partnerSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update partner payout status inside a settlement (Mark as Paid/Pending)
// @route   PUT /api/partners/settlements/:id/payout
// @access  Admin Protected
export const updatePartnerPayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { partnerIndex, partnerName, status, paymentMode, paymentRef, notes } = req.body;

    const settlement = await TripSettlement.findByPk(id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    const list = Array.isArray(settlement.partnersBreakdown)
      ? [...settlement.partnersBreakdown]
      : [];

    let targetIdx = -1;
    if (typeof partnerIndex === 'number' && partnerIndex >= 0 && partnerIndex < list.length) {
      targetIdx = partnerIndex;
    } else if (partnerName) {
      targetIdx = list.findIndex(p => p.name?.toLowerCase() === partnerName.toLowerCase());
    }

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, message: 'Target partner not found in this settlement' });
    }

    // Update partner payout details
    const newStatus = status === 'paid' ? 'paid' : 'pending';
    list[targetIdx] = {
      ...list[targetIdx],
      status: newStatus,
      paymentMode: paymentMode || list[targetIdx].paymentMode || 'upi',
      paymentRef: paymentRef !== undefined ? paymentRef : list[targetIdx].paymentRef,
      paidAt: newStatus === 'paid' ? (new Date().toISOString()) : null,
      notes: notes !== undefined ? notes : list[targetIdx].notes,
    };

    // Recalculate overall status
    const allPaid = list.every(p => p.status === 'paid');
    const anyPaid = list.some(p => p.status === 'paid');
    const overallStatus = allPaid ? 'settled' : (anyPaid ? 'partial' : 'pending');

    await settlement.update({
      partnersBreakdown: list,
      overallStatus,
    });

    res.status(200).json({
      success: true,
      message: `Payout for ${list[targetIdx].name} updated to ${newStatus}`,
      settlement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip settlement
// @route   DELETE /api/partners/settlements/:id
// @access  Admin Protected
export const deleteTripSettlement = async (req, res, next) => {
  try {
    const settlement = await TripSettlement.findByPk(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }
    await settlement.destroy();
    res.status(200).json({
      success: true,
      message: 'Settlement record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modular calculation & settlement helper for a booking using configured baseline prices
export const generateSettlementForBooking = async (bookingOrId, options = {}) => {
  const {
    stayPartnerId,
    foodPartnerId,
    selectedMeals = { breakfast: false, lunch: true, dinner: false },
    transportCostOverride,
    miscCostOverride,
    saveToLedger = true,
  } = options;

  let booking = bookingOrId;
  if (typeof bookingOrId === 'string' || typeof bookingOrId === 'number') {
    booking = await Booking.findOne({
      where: isNaN(Number(bookingOrId)) ? { bookingId: String(bookingOrId) } : { id: Number(bookingOrId) },
    });
  }

  if (!booking) {
    throw new Error(`Booking ${bookingOrId} not found`);
  }

  // Load configured Settings for default rates & organizer partners
  const settings = await Settings.findOne();
  const tripDefaults = settings?.tripExpenseDefaults || {
    stayRatePerPersonNight: 600,
    foodRatePerPersonDay: 400,
    transportRatePerDay: 1800,
    driverBataPerTrip: 500,
    miscRatePerTrip: 300,
  };

  const pkgSnapshot = booking.packageSnapshot || {};
  const destination = pkgSnapshot.destination || 'Munnar';
  const numPersons = Math.max(1, parseInt(booking.persons, 10) || 1);

  // Duration
  const duration = pkgSnapshot.duration || {};
  const numNights = Math.max(0, parseInt(duration.nights, 10) || 1);
  const numDays = Math.max(1, parseInt(duration.days, 10) || 2);

  const tripRevenue = parseFloat(booking.totalPrice) || 0;

  // 1. Resolve Stay Partner (Use passed ID or auto-pick best matching active tie-up in destination)
  let stayPartner = null;
  if (stayPartnerId) {
    stayPartner = await PartnerTieup.findByPk(stayPartnerId);
  } else {
    stayPartner = await PartnerTieup.findOne({
      where: {
        category: 'stay',
        status: 'active',
        location: { [Op.like]: `%${destination}%` },
      },
    });
    if (!stayPartner) {
      stayPartner = await PartnerTieup.findOne({
        where: { category: 'stay', status: 'active' },
      });
    }
  }

  let stayCost = 0;
  let stayCostPerPerson = 0;
  let stayDetails = null;

  if (stayPartner) {
    if (stayPartner.pricingModel === 'per_person') {
      stayCost = stayPartner.pricePerPerson * numPersons * Math.max(1, numNights);
      stayCostPerPerson = stayPartner.pricePerPerson * Math.max(1, numNights);
    } else if (stayPartner.pricingModel === 'per_room') {
      const roomCapacity = stayPartner.maxGuestsPerRoom || 2;
      const roomsNeeded = Math.ceil(numPersons / roomCapacity);
      stayCost = stayPartner.pricePerRoom * roomsNeeded * Math.max(1, numNights);
      stayCostPerPerson = Math.round(stayCost / numPersons);
    } else if (stayPartner.pricingModel === 'per_trip') {
      stayCost = stayPartner.pricePerTrip;
      stayCostPerPerson = Math.round(stayCost / numPersons);
    } else {
      stayCost = (stayPartner.pricePerPerson || stayPartner.pricePerRoom || 0) * numPersons * Math.max(1, numNights);
      stayCostPerPerson = Math.round(stayCost / numPersons);
    }

    stayDetails = {
      id: stayPartner.id,
      name: stayPartner.name,
      type: stayPartner.type,
      pricingModel: stayPartner.pricingModel,
      rateUsed: stayPartner.pricePerPerson || stayPartner.pricePerRoom || stayPartner.pricePerTrip,
      totalCost: stayCost,
      costPerPerson: stayCostPerPerson,
    };
  } else {
    // Fallback to pre-set baseline stay rate
    const defaultStayRate = tripDefaults.stayRatePerPersonNight || 600;
    stayCost = defaultStayRate * numPersons * Math.max(1, numNights);
    stayCostPerPerson = defaultStayRate * Math.max(1, numNights);
    stayDetails = {
      id: 0,
      name: `Direct Accommodation (₹${defaultStayRate}/pax/night)`,
      type: 'resort',
      pricingModel: 'per_person',
      rateUsed: defaultStayRate,
      totalCost: stayCost,
      costPerPerson: stayCostPerPerson,
    };
  }

  // 2. Resolve Food Partner (Use passed ID or auto-pick best matching active tie-up in destination)
  let foodPartner = null;
  if (foodPartnerId) {
    foodPartner = await PartnerTieup.findByPk(foodPartnerId);
  } else {
    foodPartner = await PartnerTieup.findOne({
      where: {
        category: 'food',
        status: 'active',
        location: { [Op.like]: `%${destination}%` },
      },
    });
    if (!foodPartner) {
      foodPartner = await PartnerTieup.findOne({
        where: { category: 'food', status: 'active' },
      });
    }
  }

  let foodCost = 0;
  let foodCostPerPerson = 0;
  let foodDetails = null;

  if (foodPartner) {
    let mealPricing = foodPartner.mealPricing;
    if (typeof mealPricing === 'string') {
      try { mealPricing = JSON.parse(mealPricing); } catch (e) { mealPricing = {}; }
    }
    mealPricing = mealPricing || {};

    const bPrice = Number(mealPricing.breakfast || 0);
    const lPrice = Number(mealPricing.lunch || 0);
    const dPrice = Number(mealPricing.dinner || 0);
    const fullDay = Number(mealPricing.fullDay || (bPrice + lPrice + dPrice) || 0);

    let rateUsed = 0;
    let mealSelectionSummary = [];

    if (foodPartner.pricingModel === 'per_trip') {
      foodCost = Number(foodPartner.pricePerTrip || 0);
      foodCostPerPerson = Math.round(foodCost / numPersons);
      rateUsed = foodPartner.pricePerTrip;
      mealSelectionSummary.push('Per Trip Food Contract');
    } else {
      if (selectedMeals.breakfast) {
        rateUsed += bPrice;
        mealSelectionSummary.push(`Breakfast (₹${bPrice})`);
      }
      if (selectedMeals.lunch) {
        rateUsed += lPrice;
        mealSelectionSummary.push(`Lunch (₹${lPrice})`);
      }
      if (selectedMeals.dinner) {
        rateUsed += dPrice;
        mealSelectionSummary.push(`Dinner (₹${dPrice})`);
      }

      if (rateUsed === 0) {
        rateUsed = Number(foodPartner.pricePerPerson || fullDay || 0);
        mealSelectionSummary.push('Standard Daily Rate');
      }

      foodCost = rateUsed * numPersons * numDays;
      foodCostPerPerson = rateUsed * numDays;
    }

    foodDetails = {
      id: foodPartner.id,
      name: foodPartner.name,
      type: foodPartner.type,
      pricingModel: foodPartner.pricingModel,
      rateUsed,
      totalCost: foodCost,
      costPerPerson: foodCostPerPerson,
      mealPricing: { breakfast: bPrice, lunch: lPrice, dinner: dPrice, fullDay },
      mealSelectionSummary: mealSelectionSummary.join(' + ') || 'Lunch Only',
    };
  } else {
    // Fallback to pre-set baseline food rate
    const defaultFoodRate = tripDefaults.foodRatePerPersonDay || 400;
    foodCost = defaultFoodRate * numPersons * numDays;
    foodCostPerPerson = defaultFoodRate * numDays;
    foodDetails = {
      id: 0,
      name: `Local Dining (₹${defaultFoodRate}/pax/day)`,
      type: 'restaurant',
      pricingModel: 'per_person',
      rateUsed: defaultFoodRate,
      totalCost: foodCost,
      costPerPerson: foodCostPerPerson,
      mealSelectionSummary: `Standard Daily Meals (₹${defaultFoodRate}/day)`,
    };
  }

  // 3. Transport & Misc
  const defaultTransportRate = tripDefaults.transportRatePerDay || 1800;
  const transportCost = transportCostOverride !== undefined
    ? Math.max(0, parseFloat(transportCostOverride) || 0)
    : defaultTransportRate * numDays;

  const defaultBata = tripDefaults.driverBataPerTrip || 500;
  const defaultMisc = tripDefaults.miscRatePerTrip || 300;
  const miscCost = miscCostOverride !== undefined
    ? Math.max(0, parseFloat(miscCostOverride) || 0)
    : defaultBata + defaultMisc;

  const totalExpenses = stayCost + foodCost + transportCost + miscCost;
  const netProfit = Math.max(0, tripRevenue - totalExpenses);
  const profitMarginPercent = tripRevenue > 0 ? Math.round((netProfit / tripRevenue) * 100) : 0;

  // Load configured company partners from Settings
  let partnersList = [
    { id: 'p1', name: 'mohan (Lead Organizer)', sharePercent: 50, phone: '+91 81110 39182' },
    { id: 'p2', name: 'Partner 2 (Co-Organizer)', sharePercent: 50, phone: '' },
  ];

  if (settings && settings.organizerPartners) {
    let op = settings.organizerPartners;
    if (typeof op === 'string') {
      try { op = JSON.parse(op); } catch (e) { }
    }
    if (Array.isArray(op.partners) && op.partners.length > 0) {
      partnersList = op.partners;
    } else if (op.partner1 && op.partner2) {
      partnersList = [
        { id: 'p1', name: op.partner1.name || 'mohan', sharePercent: op.partner1.sharePercent || 50, phone: op.partner1.phone || '', upiId: op.partner1.upiId || '' },
        { id: 'p2', name: op.partner2.name || 'Co-Organizer', sharePercent: op.partner2.sharePercent || 50, phone: op.partner2.phone || '', upiId: op.partner2.upiId || '' },
      ];
    }
  }

  const partnerCommissionDetails = partnersList.map((p, idx) => {
    const sharePct = parseFloat(p.sharePercent) || 0;
    const amount = Math.round(netProfit * (sharePct / 100));
    return {
      id: p.id || `partner-${idx + 1}`,
      name: p.name || `Partner ${idx + 1}`,
      phone: p.phone || '',
      upiId: p.upiId || '',
      sharePercent: sharePct,
      amount,
      status: 'pending',
      paidAt: null,
    };
  });

  let savedSettlement = null;
  if (saveToLedger) {
    const existing = await TripSettlement.findOne({ where: { bookingId: booking.bookingId } });
    if (existing) {
      existing.tripTitle = `${pkgSnapshot.title || 'Tour'} (${booking.customerName})`;
      existing.destination = destination;
      existing.tripDate = booking.travelDate || new Date();
      existing.numPersons = numPersons;
      existing.numNights = numNights;
      existing.numDays = numDays;
      existing.tripRevenue = tripRevenue;
      existing.stayCost = stayCost;
      existing.stayPartnerName = stayPartner?.name || stayDetails?.name || 'Direct Stay';
      existing.foodCost = foodCost;
      existing.foodPartnerName = foodPartner?.name || foodDetails?.name || 'Local Dining';
      existing.transportCost = transportCost;
      existing.miscCost = miscCost;
      existing.totalExpenses = totalExpenses;
      existing.netProfit = netProfit;
      existing.profitMarginPercent = profitMarginPercent;
      existing.partnersBreakdown = partnerCommissionDetails;
      await existing.save();
      savedSettlement = existing;
    } else {
      const count = await TripSettlement.count();
      const code = `SET-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      savedSettlement = await TripSettlement.create({
        settlementCode: code,
        bookingId: booking.bookingId,
        tripTitle: `${pkgSnapshot.title || 'Tour'} (${booking.customerName})`,
        destination,
        tripDate: booking.travelDate || new Date(),
        numPersons,
        numNights,
        numDays,
        tripRevenue,
        stayCost,
        stayPartnerName: stayPartner?.name || stayDetails?.name || 'Direct Stay',
        foodCost,
        foodPartnerName: foodPartner?.name || foodDetails?.name || 'Local Dining',
        transportCost,
        miscCost,
        totalExpenses,
        netProfit,
        profitMarginPercent,
        partnersBreakdown: partnerCommissionDetails,
        overallStatus: 'pending',
        notes: `Auto-generated account for Booking ${booking.bookingId}. Pre-configured rates applied: Stay (${stayDetails?.name}), Food (${foodDetails?.name}), Transport (₹${transportCost}), Bata/Misc (₹${miscCost}).`,
      });
    }
  }

  return {
    booking: {
      id: booking.id,
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      phone: booking.phone,
      travelDate: booking.travelDate,
      destination,
      tripTitle: pkgSnapshot.title || 'Tour Package',
      persons: numPersons,
      nights: numNights,
      days: numDays,
      tripRevenue,
    },
    stay: stayDetails,
    food: foodDetails,
    transportCost,
    miscCost,
    totalExpenses,
    netProfit,
    profitMarginPercent,
    partnerSplit: {
      tripRevenue,
      transportCost,
      miscCost,
      totalVendorPayout: stayCost + foodCost,
      totalTripExpenses: totalExpenses,
      netOrganizingProfit: netProfit,
      profitMarginPercent,
      partners: partnerCommissionDetails,
    },
    savedSettlement,
  };
};

// @desc    Auto-calculate profit & vendor costs for a specific booking using pre-entered tie-ups
// @route   POST /api/partners/auto-calculate-booking
// @access  Admin Protected
export const autoCalculateBookingProfit = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const data = await generateSettlementForBooking(bookingId, req.body);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-generate settlement accounts for all confirmed/completed bookings that have not been settled yet
// @route   POST /api/partners/auto-settle-all
// @access  Admin Protected
export const autoSettleAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        status: {
          [Op.in]: ['confirmed', 'completed', 'pending'],
        },
      },
      order: [['createdAt', 'DESC']],
    });

    const settledList = [];
    const skippedList = [];

    for (const booking of bookings) {
      const existing = await TripSettlement.findOne({ where: { bookingId: booking.bookingId } });
      if (existing) {
        skippedList.push(booking.bookingId);
        continue;
      }

      try {
        const result = await generateSettlementForBooking(booking, { saveToLedger: true });
        settledList.push({
          bookingId: booking.bookingId,
          settlementCode: result.savedSettlement?.settlementCode,
          netProfit: result.netProfit,
        });
      } catch (err) {
        console.error(`Error settling booking ${booking.bookingId}:`, err);
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated accounts for ${settledList.length} trip(s). (${skippedList.length} trips already had existing accounts).`,
      count: settledList.length,
      settled: settledList,
      skipped: skippedList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload partner photo (cottage, resort, restaurant, dining)
// @route   POST /api/partners/upload
// @access  Admin
export const uploadPartnerImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, imageUrl });
  } catch (err) {
    next(err);
  }
};

