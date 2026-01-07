import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { FeatureFlagStore } from '../store.js';
import {
  CreateFlagRequestSchema,
  UpdateFlagRequestSchema,
  GetFlagsQuerySchema,
  FeatureFlagSchema,
} from '@repo/types';
import { z } from 'zod';

const store = new FeatureFlagStore();

export async function flagsRoutes(app: FastifyInstance) {
  const service = app.withTypeProvider<ZodTypeProvider>();

  // GET /flags
  service.get('/flags', {
    schema: {
      tags: ['Flags'],
      summary: 'List all feature flags',
      querystring: GetFlagsQuerySchema,
      response: {
        200: z.object({
          data: z.array(FeatureFlagSchema),
          meta: z.object({
            total: z.number(),
            environments: z.record(z.string(), z.number()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const flags = store.getAll(request.query);
    
    // Calculate metadata
    const environments: Record<string, number> = {
        development: 0,
        staging: 0,
        production: 0
    };
    
    flags.forEach(f => {
        if (environments[f.environment] !== undefined) {
            environments[f.environment]++;
        }
    });

    return {
      data: flags,
      meta: {
        total: flags.length,
        environments,
      },
    };
  });

  // GET /flags/:id
  service.get('/flags/:id', {
    schema: {
      tags: ['Flags'],
      summary: 'Get a feature flag by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ data: FeatureFlagSchema }),
        404: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
      },
    },
  }, async (request, reply) => {
    const flag = store.getById(request.params.id);
    if (!flag) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }
    return { data: flag };
  });

  // POST /flags
  service.post('/flags', {
    schema: {
      tags: ['Flags'],
      summary: 'Create a new feature flag',
      body: CreateFlagRequestSchema,
      response: {
        201: z.object({ data: FeatureFlagSchema }),
        409: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
        400: z.object({ error: z.any() }), // Zod validation errors handled by fastify-type-provider-zod default error handler usually
      },
    },
  }, async (request, reply) => {
    try {
      const { metadata, ...rest } = request.body;
      const newFlag = store.create({
          ...rest,
          description: rest.description ?? null,
          metadata: {
              owner: metadata?.owner ?? 'unassigned',
              tags: metadata?.tags ?? [],
              expiresAt: metadata?.expiresAt ?? null
          }
      });
      return reply.code(201).send({ data: newFlag });
    } catch (e: any) {
      if (e.message === 'DUPLICATE_KEY') {
        return reply.code(409).send({
          error: { code: 'DUPLICATE_KEY', message: 'Flag key already exists' }
        });
      }
      throw e;
    }
  });

  // PATCH /flags/:id
  service.patch('/flags/:id', {
    schema: {
      tags: ['Flags'],
      summary: 'Update a feature flag',
      params: z.object({ id: z.string().uuid() }),
      body: UpdateFlagRequestSchema,
      response: {
        200: z.object({ data: FeatureFlagSchema }),
        404: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
        409: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
      },
    },
  }, async (request, reply) => {
    try {
      const updatedFlag = store.update(request.params.id, request.body);
      if (!updatedFlag) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Resource not found' }
        });
      }
      return { data: updatedFlag };
    } catch (e: any) {
      if (e.message === 'DUPLICATE_KEY') {
        return reply.code(409).send({
          error: { code: 'DUPLICATE_KEY', message: 'Flag key already exists' }
        });
      }
      throw e;
    }
  });

  // DELETE /flags/:id
  service.delete('/flags/:id', {
    schema: {
      tags: ['Flags'],
      summary: 'Delete a feature flag',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
      },
    },
  }, async (request, reply) => {
    const success = store.delete(request.params.id);
    if (!success) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }
    return reply.code(204).send();
  });

  // POST /flags/:id/toggle
  service.post('/flags/:id/toggle', {
    schema: {
      tags: ['Flags'],
      summary: 'Toggle a feature flag',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ 
            data: FeatureFlagSchema,
            previousState: z.boolean()
        }),
        404: z.object({ error: z.object({ code: z.string(), message: z.string() }) }),
      },
    },
  }, async (request, reply) => {
    const flag = store.getById(request.params.id);
    if (!flag) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }

    const previousState = flag.enabled;
    const updatedFlag = store.update(flag.id, { enabled: !previousState });

    return { 
        data: updatedFlag!,
        previousState
    };
  });
}
