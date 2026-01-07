import fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import apiReference from '@scalar/fastify-api-reference';
import { flagsRoutes } from './routes/flags.js';
import { v4 as uuidv4 } from 'uuid';

export const buildApp = async () => {
    const app = fastify({
        logger: true,
        genReqId: () => uuidv4(), // Custom Request ID
    }).withTypeProvider<ZodTypeProvider>();

    // Be tolerant of clients sending `Content-Type: application/json` with an empty body.
    // Fastify otherwise throws FST_ERR_CTP_EMPTY_JSON_BODY before hitting route handlers.
    app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
        try {
            const str = (body ?? '').toString().trim();
            if (!str) return done(null, undefined);
            return done(null, JSON.parse(str));
        } catch (err) {
            return done(err as Error);
        }
    });

    // Input Validation Setup
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // CORS
    await app.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type'],
    });

    // Swagger (OpenAPI Document Generation)
    await app.register(import('@fastify/swagger'), {
        openapi: {
            info: {
                title: 'Feature Flag API',
                description: 'Mock backend for frontend technical interview',
                version: '1.0.0',
            },
            tags: [
                { name: 'Flags', description: 'Feature Flag management endpoints' }
            ]
        },
        transform: jsonSchemaTransform, // Required for Zod
    });

    // API Documentation (Scalar)
    await app.register(apiReference, {
        routePrefix: '/docs',
    });

    // Register Routes
    await app.register(flagsRoutes);

    // Global Error Handler for Validation Errors
    app.setErrorHandler((error, _request, reply) => {
        const err = error as { validation?: unknown };
        if (err.validation) {
             return reply.status(400).send({
                 error: {
                     code: 'VALIDATION_ERROR',
                     message: "Request body failed validation",
                     details: err.validation
                 }
             });
        }
        
        // Handle other standard errors
        return reply.send(error);
    });

    return app;
};
