/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: Users
 *     description: User management endpoints
 *   - name: System
 *     description: System management endpoints
 *
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: User ID
 *                         email:
 *                           type: string
 *                           format: email
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [user, admin]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 status: 401
 *                 code: authentication_error
 *                 message: Invalid email or password
 *                 details: null
 *                 timestamp: '2023-06-12T14:35:42.123Z'
 *                 path: /api/auth/login
 *                 method: POST
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *               name:
 *                 type: string
 *                 description: User's full name
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                           format: email
 *                         name:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 status: 409
 *                 code: conflict
 *                 message: Email already in use
 *                 details: null
 *                 timestamp: '2023-06-12T14:35:42.123Z'
 *                 path: /api/auth/register
 *                 method: POST
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */ 