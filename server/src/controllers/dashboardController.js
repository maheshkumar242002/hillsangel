import dashboardService from '../service/dashboardService.js';
import { ApiResponse } from '../common/index.js';


export const getDashboardStats = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboardStats();
    return ApiResponse.success(res, result, 'Dashboard metrics retrieved successfully');


  } catch (err) {
    next(err);
  }
};
