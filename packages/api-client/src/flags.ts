import type {
  FeatureFlag,
  CreateFlagRequest,
  UpdateFlagRequest,
  GetFlagsQuery,
} from '@repo/types';
import { ApiClient } from './client.js';
import type { ListFlagsResponse, ApiResponse, ToggleFlagResponse } from './types.js';

export class FlagsClient extends ApiClient {
  async list(query?: GetFlagsQuery): Promise<ListFlagsResponse> {
    const params = new URLSearchParams();
    if (query?.environment) params.set('environment', query.environment);
    if (query?.enabled !== undefined) params.set('enabled', String(query.enabled));
    if (query?.search) params.set('search', query.search);
    if (query?.tag) {
      if (Array.isArray(query.tag)) {
        query.tag.forEach(t => params.append('tag', t));
      } else {
        params.set('tag', query.tag);
      }
    }

    const queryString = params.toString();
    return this.get<ListFlagsResponse>(`/flags${queryString ? `?${queryString}` : ''}`);
  }

  async getById(id: string): Promise<ApiResponse<FeatureFlag>> {
    return this.get<ApiResponse<FeatureFlag>>(`/flags/${id}`);
  }

  async create(data: CreateFlagRequest): Promise<ApiResponse<FeatureFlag>> {
    return this.post<ApiResponse<FeatureFlag>>('/flags', data);
  }

  async update(id: string, data: UpdateFlagRequest): Promise<ApiResponse<FeatureFlag>> {
    return this.patch<ApiResponse<FeatureFlag>>(`/flags/${id}`, data);
  }

  async deleteFlag(id: string): Promise<void> {
    return this.delete<void>(`/flags/${id}`);
  }

  async toggle(id: string): Promise<ToggleFlagResponse> {
    return this.post<ToggleFlagResponse>(`/flags/${id}/toggle`);
  }
}
