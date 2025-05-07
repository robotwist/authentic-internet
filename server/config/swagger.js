import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { version } from '../package.json' assert { type: 'json' };

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Authentic Internet API Documentation',
      version,
      description: 'API documentation for Authentic Internet platform',
      license: {
        name: 'Proprietary',
        url: 'https://authenticinternet.co'
      },
      contact: {
        name: 'Support',
        url: 'https://authenticinternet.co/contact',
        email: 'support@authenticinternet.co'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.authenticinternet.co',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Path to the API docs
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js',
    './middleware/*.js',
    './docs/*.js', // For additional documentation
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Configure Swagger UI
 * @param {Object} app - Express app instance
 */
export const setupSwagger = (app) => {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Authentic Internet API Documentation',
  }));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('✅ Swagger documentation available at /api-docs');
};

export default setupSwagger; 