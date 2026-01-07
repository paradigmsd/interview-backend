export type Environment = 'development' | 'staging' | 'production'

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  enabled: boolean
  environment: Environment
  metadata: {
    owner: string
    tags: string[]
    expiresAt: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface ApiErrorShape {
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

export interface GetFlagsResponse {
  data: FeatureFlag[]
  meta: {
    total: number
    environments: Record<string, number>
  }
}

export interface CreateFlagRequest {
  key: string
  name: string
  environment: Environment
  description?: string | null
  metadata?: {
    owner?: string
  }
}

export interface UpdateFlagRequest {
  name?: string
  description?: string | null
  enabled?: boolean
  environment?: Environment
  metadata?: {
    owner?: string
  }
}


