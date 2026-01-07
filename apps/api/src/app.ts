import fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import apiReference from '@scalar/fastify-api-reference';
import { flagsRoutes } from './routes/flags.js';
import { v4 as uuidv4 } from 'uuid';

export const buildApp = async () => {
    const app = fastify({
        logger: true,
        genReqId: () => uuidv4(), // Custom Request ID
    }).withTypeProvider<ZodTypeProvider>();

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
    app.setErrorHandler((error, request, reply) => {
        const err = error as any;
        if (err.validation) {
             const validationContext = err.validationContext ? `${err.validationContext} failed validation` : 'Validation error';
             return reply.status(400).send({
                 error: {
                     code: 'VALIDATION_ERROR',
                     message: validationContext,
                     details: err.validation
                 }
             });
        }
        
        // Handle other standard errors
        return reply.send(error);
    });

    return app;
};
