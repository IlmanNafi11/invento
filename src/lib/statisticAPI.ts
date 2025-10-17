import { APIClient } from './apiUtils';
import type { StatisticsResponse } from '@/types';

class StatisticAPIClient extends APIClient {
  async getStatistics(): Promise<StatisticsResponse> {
    return this.get<StatisticsResponse>('/statistic');
  }
}

export const statisticAPI = new StatisticAPIClient();
