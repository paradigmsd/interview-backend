import { z } from 'zod';
export declare const EnvironmentSchema: z.ZodEnum<["development", "staging", "production"]>;
export declare const FlagMetadataSchema: z.ZodObject<{
    owner: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    tags: string[];
    expiresAt: string | null;
}, {
    owner: string;
    tags: string[];
    expiresAt: string | null;
}>;
export declare const FeatureFlagSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    enabled: z.ZodBoolean;
    environment: z.ZodEnum<["development", "staging", "production"]>;
    metadata: z.ZodObject<{
        owner: z.ZodString;
        tags: z.ZodArray<z.ZodString, "many">;
        expiresAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        tags: string[];
        expiresAt: string | null;
    }, {
        owner: string;
        tags: string[];
        expiresAt: string | null;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    key: string;
    name: string;
    description: string | null;
    enabled: boolean;
    environment: "development" | "staging" | "production";
    metadata: {
        owner: string;
        tags: string[];
        expiresAt: string | null;
    };
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    key: string;
    name: string;
    description: string | null;
    enabled: boolean;
    environment: "development" | "staging" | "production";
    metadata: {
        owner: string;
        tags: string[];
        expiresAt: string | null;
    };
    createdAt: string;
    updatedAt: string;
}>;
export declare const CreateFlagRequestSchema: z.ZodEffects<z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    environment: z.ZodEnum<["development", "staging", "production"]>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        owner: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        expiresAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        tags: string[];
        expiresAt?: string | null | undefined;
    }, {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    key: string;
    name: string;
    enabled: boolean;
    environment: "development" | "staging" | "production";
    metadata: {
        owner: string;
        tags: string[];
        expiresAt?: string | null | undefined;
    };
    description?: string | null | undefined;
}, {
    key: string;
    name: string;
    environment: "development" | "staging" | "production";
    description?: string | null | undefined;
    enabled?: boolean | undefined;
    metadata?: {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    } | undefined;
}>, {
    key: string;
    name: string;
    enabled: boolean;
    environment: "development" | "staging" | "production";
    metadata: {
        owner: string;
        tags: string[];
        expiresAt?: string | null | undefined;
    };
    description?: string | null | undefined;
}, {
    key: string;
    name: string;
    environment: "development" | "staging" | "production";
    description?: string | null | undefined;
    enabled?: boolean | undefined;
    metadata?: {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    } | undefined;
}>;
export declare const UpdateFlagRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    environment: z.ZodOptional<z.ZodEnum<["development", "staging", "production"]>>;
    metadata: z.ZodOptional<z.ZodObject<{
        owner: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        expiresAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    }, {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    enabled?: boolean | undefined;
    environment?: "development" | "staging" | "production" | undefined;
    metadata?: {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    enabled?: boolean | undefined;
    environment?: "development" | "staging" | "production" | undefined;
    metadata?: {
        owner?: string | undefined;
        tags?: string[] | undefined;
        expiresAt?: string | null | undefined;
    } | undefined;
}>;
export declare const GetFlagsQuerySchema: z.ZodObject<{
    environment: z.ZodOptional<z.ZodEnum<["development", "staging", "production"]>>;
    enabled: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
    search: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    environment?: "development" | "staging" | "production" | undefined;
    search?: string | undefined;
    tag?: string | string[] | undefined;
}, {
    enabled?: "true" | "false" | undefined;
    environment?: "development" | "staging" | "production" | undefined;
    search?: string | undefined;
    tag?: string | string[] | undefined;
}>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type FlagMetadata = z.infer<typeof FlagMetadataSchema>;
export type CreateFlagRequest = z.infer<typeof CreateFlagRequestSchema>;
export type UpdateFlagRequest = z.infer<typeof UpdateFlagRequestSchema>;
export type GetFlagsQuery = z.infer<typeof GetFlagsQuerySchema>;
//# sourceMappingURL=schemas.d.ts.map