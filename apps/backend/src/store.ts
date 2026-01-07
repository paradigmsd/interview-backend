import type { FeatureFlag, Environment, FlagMetadata } from './types.js';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import fs from 'node:fs';
import path from 'node:path';

// Stable namespace for generating deterministic IDs for seeded flags.
// This reduces confusion during dev/watch restarts (seeded flags keep the same IDs).
const SEED_NAMESPACE = uuidv5('interview-backend-seed-namespace', uuidv5.URL);

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'flags.json');

export class FeatureFlagStore {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    // Persist flags to disk so create/update/toggle/delete remain consistent across restarts.
    // This keeps interview UX smooth while still being "local only" storage.
    if (!this.loadFromDisk()) {
      this.seed();
      this.saveToDisk();
    }
  }

  private loadFromDisk(): boolean {
    try {
      if (!fs.existsSync(DATA_FILE)) return false;
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as FeatureFlag[];
      if (!Array.isArray(parsed)) return false;
      this.flags = new Map(parsed.map((f) => [f.id, f]));
      return this.flags.size > 0;
    } catch {
      return false;
    }
  }

  private saveToDisk() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(this.flags.values()), null, 2));
    } catch {
      // best-effort persistence; ignore disk failures
    }
  }

  private seed() {
    const now = new Date().toISOString();
    const flagsToSeed: Array<{
      key: string;
      name: string;
      environment: Environment;
      enabled: boolean;
      tags: string[];
      description?: string;
    }> = [
      { key: 'dark-mode', name: 'Dark Mode', environment: 'production', enabled: true, tags: ['ui', 'theme'], description: "Enable dark mode theme across the application" },
      { key: 'dark-mode', name: 'Dark Mode (Staging)', environment: 'staging', enabled: true, tags: ['ui', 'theme'] },
      { key: 'new-checkout-flow', name: 'New Checkout Flow', environment: 'staging', enabled: true, tags: ['payments', 'experiment'] },
      { key: 'new-checkout-flow', name: 'New Checkout Flow', environment: 'development', enabled: true, tags: ['payments', 'experiment'] },
      { key: 'ai-recommendations', name: 'AI Recommendations', environment: 'development', enabled: true, tags: ['ml', 'experiment'] },
      { key: 'beta-dashboard', name: 'Beta Dashboard', environment: 'staging', enabled: false, tags: ['ui', 'beta'] },
      { key: 'maintenance-mode', name: 'Maintenance Mode', environment: 'production', enabled: false, tags: ['ops', 'critical'] },
      { key: 'feature-analytics', name: 'Feature Analytics', environment: 'production', enabled: true, tags: ['analytics'] },
      { key: 'social-login', name: 'Social Login', environment: 'development', enabled: true, tags: ['auth'] },
      { key: 'export-csv', name: 'CSV Export', environment: 'production', enabled: true, tags: ['data', 'utility'] },
      { key: 'bulk-operations', name: 'Bulk Operations', environment: 'staging', enabled: true, tags: ['admin', 'utility'] },
      { key: 'notification-center', name: 'Notification Center', environment: 'development', enabled: false, tags: ['ui', 'notifications'] },
    ];

    flagsToSeed.forEach((seed) => {
      // Use deterministic UUIDs for seeded flags so IDs remain stable across restarts.
      // This only applies to seed data; created flags remain in-memory and are lost on restart.
       const id = uuidv5(`${seed.key}:${seed.environment}`, SEED_NAMESPACE);
       
       const flag: FeatureFlag = {
         id,
         key: seed.key,
         name: seed.name,
         description: seed.description || null,
         enabled: seed.enabled,
         environment: seed.environment,
         metadata: {
           owner: 'system',
           tags: seed.tags,
           expiresAt: null
         },
         createdAt: now,
         updatedAt: now
       };
       this.flags.set(id, flag);
    });
  }

  // Find all with filtering
  getAll(filters: { environment?: Environment; enabled?: boolean; search?: string; tags?: string[] }): FeatureFlag[] {
    let result = Array.from(this.flags.values());

    if (filters.environment) {
      result = result.filter(f => f.environment === filters.environment);
    }

    if (filters.enabled !== undefined) {
      result = result.filter(f => f.enabled === filters.enabled);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tags = filters.tags;
      result = result.filter((f) => tags.some((t) => f.metadata.tags.includes(t)));
    }

    if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter((f) => 
            f.key.toLowerCase().includes(search) ||
            f.name.toLowerCase().includes(search) ||
            (f.description?.toLowerCase().includes(search) ?? false)
        );
    }

    return result;
  }

  getById(id: string): FeatureFlag | undefined {
    return this.flags.get(id);
  }

  // Key uniqueness check: key must be unique ACROSS ALL ENVIRONMENTS? 
  // Wait, spec says: "key must be unique across ALL environments". 
  // However, the seed data shows 'dark-mode' in both 'production' and 'staging'.
  // Clarification: The spec says "key must be unique across ALL environments" under Validation Rules for Create.
  // But strictly looking at the seed data:
  // | dark-mode | Dark Mode | production |
  // | dark-mode | Dark Mode (Staging) | staging |
  // This implies (Key + Environment) should be unique, OR the spec means "key must be used consistently for the same feature across environments" but the ID makes them distinct entities.
  // BUT: "key must be unique across ALL environments" usually means you can't have 'dark-mode' in prod AND 'dark-mode' in dev if they share the same uniqueness scope.
  // EXCEPT... if the intention is that a flag *concept* is one thing, but here we have separate records.
  // Let's re-read carefully: "Note: The key field cannot be updated after creation."
  // And "Duplicate Key 409 Flag key already exists".
  // The seed data CLEARLY violates "unique across ALL environments" if it means globally unique.
  // It most likely means "Unique PER environment".
  // OR, it means the API treats "dark-mode" as the same flag and we are creating *definitions* for it?
  // The Data Model has `id`. `key`, `environment`.
  // If I create a flag with key `new-feature`, env `dev`.
  // can I create `new-feature`, env `prod`?
  // If "unique across ALL environments" is literal, then NO.
  // But the seed data has `dark-mode` twice.
  // Assumption: The Spec's validation rule "key must be unique across ALL environments" might be a typo for "unique per environment" OR the seed data is illustrative of a common pattern that the validation might supposedly prevent?
  // No, usually seed data is truth.
  // "key must be unique across ALL environments" -> Maybe it means you cannot create a *new* flag with a key that exists, checking against *all* flags? 
  // If so, how did `dark-mode` get in there twice?
  // Maybe the intention is `(key, environment)` usage.
  // Let's assume (Key + Environment) must be unique.
  // HOWEVER, the error code says `DUPLICATE_KEY`.
  // Let's look at the seed data again. 
  // `dark-mode` exists for prod and staging.
  // `new-checkout-flow` exists for staging and dev.
  // This implies that multiple records can share the same key.
  // So "unique across ALL environments" is DEFINITELY conflicting with seed data.
  // interpretation: The "Validation Rules" section might normally apply to a single-env system, but here we have multi-env.
  // OR, the prompts for the candidate might be to FIX this, or I am just implementing the backend for them.
  // "This is a pre-built Fastify backend... for the frontend technical interview."
  // I should PROBABLY implement it such that it supports the seed data.
  // So uniqueness is likely (Key + Environment).
  // BUT, strict reading: "key must be unique across ALL environments".
  // Let's try to implement (Key + Environment) uniqueness as it makes the most sense.
  // Wait, if I implement "Unique per env", then creating 'dark-mode' in 'dev' should be allowed if it exists in 'prod'.
  // If I implement "Unique globally", then I can't.
  // Given the seed data, "Unique globally" fails immediately.
  // I will assume the validation rule meant "Unique composite of Key + Environment". 
  
  // Re-reading: "key must be unique across ALL environments" could mean "The 'key' identifier is global, you can't have 'dark-mode' mean 'Dark Mode' in prod and 'Totally Different Thing' in dev". 
  // No, that's semantic.
  // Let's stick to: I will check if (key, environment) exists. 
  // If the user meant "cannot exist in any other environment", then the seed data is impossible.
  // I will add a comment about this decision.
  
  create(data: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): FeatureFlag {
    // Check uniqueness
    // implementing (key + environment) uniqueness based on seed data evidence
    const existing = Array.from(this.flags.values()).find(f => f.key === data.key && f.environment === data.environment);
    if (existing) {
        throw new Error('DUPLICATE_KEY');
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const newFlag: FeatureFlag = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
    };
    this.flags.set(id, newFlag);
    this.saveToDisk();
    return newFlag;
  }

  update(id: string, updates: Partial<Omit<FeatureFlag, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'metadata'>> & { metadata?: Partial<FlagMetadata> }): FeatureFlag | undefined {
    const flag = this.flags.get(id);
    if (!flag) return undefined;

    // If updating environment, check collision
    if (updates.environment && updates.environment !== flag.environment) {
        const existing = Array.from(this.flags.values()).find(f => 
            f.key === flag.key && 
            f.environment === updates.environment && 
            f.id !== id
        );
        if (existing) throw new Error('DUPLICATE_KEY');
    }

    const updatedFlag: FeatureFlag = {
        ...flag,
        ...updates,
        metadata: {
            ...flag.metadata,
            ...(updates.metadata || {})
        },
        updatedAt: new Date().toISOString()
    };
    
    this.flags.set(id, updatedFlag);
    this.saveToDisk();
    return updatedFlag;
  }

  delete(id: string): boolean {
    const ok = this.flags.delete(id);
    if (ok) this.saveToDisk();
    return ok;
  }
}
