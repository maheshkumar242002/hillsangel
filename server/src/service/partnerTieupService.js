import { BaseService } from './BaseService.js';
import partnerTieupRepository from '../repository/partnerTieupRepository.js';
import uploadService from './uploadService.js';
import { PartnerCategory, PartnerPricingModel } from '../enums/index.js';

export class PartnerTieupService extends BaseService {
  constructor() {
    super(partnerTieupRepository);
  }

  /**
   * Filter partners
   */
  async getPartners(filters) {
    return partnerTieupRepository.findPartnersWithFilters(filters);
  }

  /**
   * Calculate partner statistical aggregates and pricing averages
   */
  async getPartnerStats() {
    const raw = await partnerTieupRepository.getPartnerStatsRaw();
    return {
      totalCount: raw.totalCount,
      stayCount: raw.stayCount,
      foodCount: raw.foodCount,
      activeCount: raw.activeCount,
      averages: {
        stay: {
          avgPerPerson: Math.round(Number(raw.stayAverages.avgStayPerPerson) || 0),
          avgPerRoom: Math.round(Number(raw.stayAverages.avgStayPerRoom) || 0),
          avgPerTrip: Math.round(Number(raw.stayAverages.avgStayPerTrip) || 0),
        },
        food: {
          avgPerPerson: Math.round(Number(raw.foodAverages.avgFoodPerPerson) || 0),
          avgPerTrip: Math.round(Number(raw.foodAverages.avgFoodPerTrip) || 0),
        },
      },
    };
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(id) {
    return this.getById(id);
  }

  /**
   * Create partner
   */
  async createPartner(payload) {
    const data = { ...payload };

    if (!data.partnerCode || data.partnerCode.trim() === '') {
      const prefix = data.category === 'stay' ? (data.type === 'cottage' ? 'COT' : 'HOT') : 'RES';
      const randomNum = Math.floor(100 + Math.random() * 900);
      data.partnerCode = `${prefix}-${randomNum}`;
    }

    if (!data.category) {
      const stayTypes = ['cottage', 'hotel', 'resort', 'homestay'];
      data.category = stayTypes.includes(data.type) ? 'stay' : 'food';
    }

    return partnerTieupRepository.create(data);
  }

  /**
   * Update partner
   */
  async updatePartner(id, payload) {
    const partner = await this.getById(id);
    const data = { ...payload };

    if (data.type && !data.category) {
      const stayTypes = ['cottage', 'hotel', 'resort', 'homestay'];
      data.category = stayTypes.includes(data.type) ? 'stay' : 'food';
    }

    await partner.update(data);
    return partner;
  }

  /**
   * Upload partner photo
   */
  async uploadPartnerPhoto(file, req) {
    const result = await uploadService.processFile(file, req);
    return result.url;
  }

  /**
   * Calculate Trip Settlement / Vendor Cost Estimator
   */
  async calculateTripSettlement(payload) {
    const { stayPartnerId, foodPartnerId, persons = 1, nights = 1, days = 1, selectedMeals } = payload;
    const numPersons = Math.max(1, parseInt(persons, 10) || 1);
    const numNights = Math.max(1, parseInt(nights, 10) || 1);
    const numDays = Math.max(1, parseInt(days, 10) || numNights);

    let stayDetails = null;
    let stayCost = 0;
    let stayCostPerPerson = 0;

    if (stayPartnerId) {
      const stay = await partnerTieupRepository.findById(stayPartnerId);
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
      const food = await partnerTieupRepository.findById(foodPartnerId);
      if (food) {
        let mealPricing = food.mealPricing;
        if (typeof mealPricing === 'string') {
          try {
            mealPricing = JSON.parse(mealPricing);
          } catch {
            mealPricing = {};
          }
        }
        mealPricing = mealPricing || {};

        const bPrice = Number(mealPricing.breakfast || 0);
        const lPrice = Number(mealPricing.lunch || 0);
        const dPrice = Number(mealPricing.dinner || 0);
        const fullDay = Number(mealPricing.fullDay || (bPrice + lPrice + dPrice) || 0);

        let rateUsed = 0;
        let mealSelectionSummary = [];

        if (food.pricingModel === 'per_trip') {
          foodCost = Number(food.pricePerTrip || 0);
          foodCostPerPerson = Math.round(foodCost / numPersons);
          rateUsed = food.pricePerTrip;
          mealSelectionSummary.push('Per Trip Food Contract');
        } else if (selectedMeals && typeof selectedMeals === 'object') {
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

          if (rateUsed === 0 && !selectedMeals.breakfast && !selectedMeals.lunch && !selectedMeals.dinner) {
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
          mealSelectionSummary: mealSelectionSummary.join(' + ') || 'Lunch Only',
        };
      }
    }

    return {
      stay: stayDetails,
      food: foodDetails,
      totalCost: stayCost + foodCost,
    };
  }

  /**
   * Save trip settlement record
   */
  async saveTripSettlement(payload) {
    const data = { ...payload };

    if (!data.settlementCode || data.settlementCode.trim() === '') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const rand = Math.floor(100 + Math.random() * 900);
      data.settlementCode = `SET-${yr}${mo}-${rand}`;
    }

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

      const allPaid = data.partnersBreakdown.every((p) => p.status === 'paid');
      const anyPaid = data.partnersBreakdown.some((p) => p.status === 'paid');
      data.overallStatus = allPaid ? 'settled' : (anyPaid ? 'partial' : 'pending');
    }

    return partnerTieupRepository.createSettlement(data);
  }

  /**
   * Get all trip settlements with filters
   */
  async getTripSettlements(filters) {
    const { partnerName, ...dbFilters } = filters;
    const settlements = await partnerTieupRepository.findSettlementsWithFilters(dbFilters);

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

    if (partnerName && partnerName !== 'all') {
      return formattedSettlements.filter((s) => {
        const list = s.partnersBreakdown || [];
        return list.some((p) => p.name?.toLowerCase().includes(partnerName.toLowerCase()));
      });
    }

    return formattedSettlements;
  }

  /**
   * Commission and financial stats
   */
  async getCommissionStats() {
    const settlements = await partnerTieupRepository.getAllSettlementsForStats();

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

    const partnerMap = {};

    settlements.forEach((s) => {
      totalRevenue += Number(s.tripRevenue) || 0;
      totalExpenses += Number(s.totalExpenses) || 0;
      totalNetProfit += Number(s.netProfit) || 0;

      const breakdown = safeParseBreakdown(s.partnersBreakdown);
      breakdown.forEach((p) => {
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

    return {
      totalTrips: settlements.length,
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      totalNetProfit: Math.round(totalNetProfit),
      totalCommissionDistributed: Math.round(totalCommissionDistributed),
      totalPaidCommission: Math.round(totalPaidCommission),
      totalPendingCommission: Math.round(totalPendingCommission),
      partnerSummary,
    };
  }

  /**
   * Update partner payout inside settlement
   */
  async updatePartnerPayoutStatus(id, { partnerIndex, partnerName, status, paymentMode, paymentRef, notes }) {
    const settlement = await partnerTieupRepository.findSettlementById(id);
    if (!settlement) {
      const err = new Error('Settlement record not found');
      err.statusCode = 404;
      throw err;
    }

    const list = Array.isArray(settlement.partnersBreakdown) ? [...settlement.partnersBreakdown] : [];

    let targetIdx = -1;
    if (typeof partnerIndex === 'number' && partnerIndex >= 0 && partnerIndex < list.length) {
      targetIdx = partnerIndex;
    } else if (partnerName) {
      targetIdx = list.findIndex((p) => p.name?.toLowerCase() === partnerName.toLowerCase());
    }

    if (targetIdx === -1) {
      const err = new Error('Target partner not found in this settlement');
      err.statusCode = 404;
      throw err;
    }

    const newStatus = status === 'paid' ? 'paid' : 'pending';
    list[targetIdx] = {
      ...list[targetIdx],
      status: newStatus,
      paymentMode: paymentMode || list[targetIdx].paymentMode || 'upi',
      paymentRef: paymentRef !== undefined ? paymentRef : list[targetIdx].paymentRef,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : null,
      notes: notes !== undefined ? notes : list[targetIdx].notes,
    };

    const allPaid = list.every((p) => p.status === 'paid');
    const anyPaid = list.some((p) => p.status === 'paid');
    const overallStatus = allPaid ? 'settled' : (anyPaid ? 'partial' : 'pending');

    await settlement.update({
      partnersBreakdown: list,
      overallStatus,
    });

    return {
      partner: list[targetIdx],
      settlement,
    };
  }

  /**
   * Delete settlement record (supports soft and hard delete)
   */
  async deleteTripSettlement(id, options = {}) {
    return partnerTieupRepository.deleteSettlement(id, options);
  }

  /**
   * Modular settlement generator for bookings
   */
  async generateSettlementForBooking(bookingOrId, options = {}) {
    const {
      stayPartnerId,
      foodPartnerId,
      transportCostOverride,
      miscCostOverride,
      saveToLedger = true,
    } = options;

    let booking = bookingOrId;
    if (typeof bookingOrId === 'string' || typeof bookingOrId === 'number') {
      booking = await partnerTieupRepository.findBookingForSettlement(bookingOrId);
    }

    if (!booking) {
      const err = new Error(`Booking ${bookingOrId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const settings = await partnerTieupRepository.getSettings();
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
    const duration = pkgSnapshot.duration || {};
    const numNights = Math.max(0, parseInt(duration.nights, 10) || 1);
    const numDays = Math.max(1, parseInt(duration.days, 10) || 2);
    const tripRevenue = parseFloat(booking.totalPrice) || 0;

    let stayPartner = null;
    if (stayPartnerId) {
      stayPartner = await partnerTieupRepository.findById(stayPartnerId);
    } else {
      stayPartner = await partnerTieupRepository.findActivePartnerByDestination('stay', destination);
      if (!stayPartner) {
        stayPartner = await partnerTieupRepository.findFirstActivePartner('stay');
      }
    }

    let stayCost = 0;
    if (stayPartner) {
      if (stayPartner.pricingModel === 'per_person') {
        stayCost = stayPartner.pricePerPerson * numPersons * Math.max(1, numNights);
      } else if (stayPartner.pricingModel === 'per_room') {
        const roomsNeeded = Math.ceil(numPersons / (stayPartner.maxGuestsPerRoom || 2));
        stayCost = stayPartner.pricePerRoom * roomsNeeded * Math.max(1, numNights);
      } else if (stayPartner.pricingModel === 'per_trip') {
        stayCost = stayPartner.pricePerTrip;
      } else {
        stayCost = (stayPartner.pricePerPerson || stayPartner.pricePerRoom || 0) * numPersons * Math.max(1, numNights);
      }
    } else {
      stayCost = (tripDefaults.stayRatePerPersonNight || 600) * numPersons * Math.max(1, numNights);
    }

    const defaultFoodRate = tripDefaults.foodRatePerPersonDay || 400;
    const foodCost = defaultFoodRate * numPersons * numDays;

    const defaultTransportRate = tripDefaults.transportRatePerDay || 1800;
    const transportCost = transportCostOverride !== undefined ? Math.max(0, parseFloat(transportCostOverride) || 0) : defaultTransportRate * numDays;

    const defaultBata = tripDefaults.driverBataPerTrip || 500;
    const defaultMisc = tripDefaults.miscRatePerTrip || 300;
    const miscCost = miscCostOverride !== undefined ? Math.max(0, parseFloat(miscCostOverride) || 0) : defaultBata + defaultMisc;

    const totalExpenses = stayCost + foodCost + transportCost + miscCost;
    const netProfit = Math.max(0, tripRevenue - totalExpenses);
    const profitMarginPercent = tripRevenue > 0 ? Math.round((netProfit / tripRevenue) * 100) : 0;

    let savedSettlement = null;
    if (saveToLedger) {
      const existing = await partnerTieupRepository.findSettlementByBookingId(booking.bookingId);
      if (existing) {
        existing.tripRevenue = tripRevenue;
        existing.totalExpenses = totalExpenses;
        existing.netProfit = netProfit;
        existing.profitMarginPercent = profitMarginPercent;
        await existing.save();
        savedSettlement = existing;
      } else {
        const count = await partnerTieupRepository.countSettlements();
        const code = `SET-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        savedSettlement = await partnerTieupRepository.createSettlement({
          settlementCode: code,
          bookingId: booking.bookingId,
          tripTitle: `${pkgSnapshot.title || 'Tour'} (${booking.customerName})`,
          destination,
          tripDate: booking.travelDate || new Date(),
          tripRevenue,
          stayCost,
          foodCost,
          transportCost,
          miscCost,
          totalExpenses,
          netProfit,
          profitMarginPercent,
          overallStatus: 'pending',
        });
      }
    }

    return {
      bookingId: booking.bookingId,
      tripRevenue,
      totalExpenses,
      netProfit,
      profitMarginPercent,
      savedSettlement,
    };
  }

  /**
   * Auto settle all unsettled bookings
   */
  async autoSettleAllBookings() {
    const bookings = await partnerTieupRepository.findUnsettledBookings();
    const settledList = [];
    const skippedList = [];

    for (const booking of bookings) {
      const existing = await partnerTieupRepository.findSettlementByBookingId(booking.bookingId);
      if (existing) {
        skippedList.push(booking.bookingId);
        continue;
      }

      try {
        const result = await this.generateSettlementForBooking(booking, { saveToLedger: true });
        settledList.push({
          bookingId: booking.bookingId,
          settlementCode: result.savedSettlement?.settlementCode,
          netProfit: result.netProfit,
        });
      } catch (err) {
        console.error(`Error settling booking ${booking.bookingId}:`, err);
      }
    }

    return {
      settledList,
      skippedList,
    };
  }
}

export default new PartnerTieupService();
