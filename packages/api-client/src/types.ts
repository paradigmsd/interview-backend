import type { FeatureFlag } from '@repo/types';

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ListFlagsResponse {
  data: FeatureFlag[];
  meta: {
    total: number;
    environments: Record<string, number>;
  };
}

export interface ToggleFlagResponse {
  data: FeatureFlag;
  previousState: boolean;
}
