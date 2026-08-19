import {
    extendZodWithOpenApi,
    OpenAPIRegistry,
    OpenApiGeneratorV3
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import * as routes from "../schemas/swaggerSchemas";
import processEnv from '../../env';

// Extend with ZOD openAPI
extendZodWithOpenApi(z);

// Central openAPI registry
export const registry = new OpenAPIRegistry();


// Register all schema as barrel import
Object.values(routes).forEach((route) => {
    registry.registerPath(route);
});

export const getOpenApiDocumentation = () => {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'People and Pixel Coding Test Documentation',
            version: '1.0.0',
            description: 'People and Pixel coding Test documentation for development test and use',
        },
        servers: [
            {
                url: processEnv.BASE_URL!,
                description: 'Development server',
            },
        ],
    });
}