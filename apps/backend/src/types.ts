import { z } from 'zod';

// Zod Schemas for Validation
export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

export const FlagMetadataSchema = z.object({
  owner: z.string(),
  tags: z.array(z.string()),
  expiresAt: z.string().nullable(),
});

export const FeatureFlagSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Key must be kebab-case (lowercase letters, numbers, hyphens only) and cannot start or end with a hyphen"
  }),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  enabled: z.boolean(),
  environment: EnvironmentSchema,
  metadata: FlagMetadataSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create Flag Request Schema
export const CreateFlagRequestSchema = z.object({
  key: z.string().min(3).max(50).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Key must be kebab-case (lowercase letters, numbers, hyphens only) and cannot start or end with a hyphen"
  }),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  enabled: z.boolean().optional().default(false),
  environment: EnvironmentSchema,
  metadata: z.object({
    owner: z.string().optional().default('unassigned'),
    tags: z.array(z.string()).optional().default([]),
    expiresAt: z.string().datetime().nullable().optional(),
  }).optional().default({}),
}).refine((data) => {
    if (data.metadata?.expiresAt) {
      return new Date(data.metadata.expiresAt) > new Date();
    }
    return true;
}, {
    message: "expiresAt must be a future date",
    path: ["metadata", "expiresAt"]
});

// Update Flag Request Schema
export const UpdateFlagRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  enabled: z.boolean().optional(),
  environment: EnvironmentSchema.optional(),
  metadata: FlagMetadataSchema.partial().optional(),
});

// Filter Query Schema
export const GetFlagsQuerySchema = z.object({
  environment: EnvironmentSchema.optional(),
  enabled: z.enum(['true', 'false']).transform((v) => v === 'true').optional(), // fastify query params are strings
  search: z.string().optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(), // fastify handles repeated params
});

// Types inferred from Zod
export type Environment = z.infer<typeof EnvironmentSchema>;
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type FlagMetadata = z.infer<typeof FlagMetadataSchema>;
export type CreateFlagRequest = z.infer<typeof CreateFlagRequestSchema>;
export type UpdateFlagRequest = z.infer<typeof UpdateFlagRequestSchema>;
export type GetFlagsQuery = z.infer<typeof GetFlagsQuerySchema>;
