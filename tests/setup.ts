import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

// Register the .openapi() extension on Zod globally
extendZodWithOpenApi(z);