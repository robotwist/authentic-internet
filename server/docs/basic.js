/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             status:
 *               type: integer
 *               description: HTTP status code
 *               example: 404
 *             code:
 *               type: string
 *               description: Error code
 *               example: not_found
 *             message:
 *               type: string
 *               description: Error message
 *               example: Resource not found
 *             details:
 *               type: object
 *               nullable: true
 *               description: Additional error details
 *             timestamp:
 *               type: string
 *               format: date-time
 *               description: Time when the error occurred
 *             path:
 *               type: string
 *               description: API path that generated the error
 *             method:
 *               type: string
 *               description: HTTP method used
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *         message:
 *           type: string
 *           nullable: true
 *           description: Optional success message
 *         data:
 *           type: object
 *           description: Response data
 *
 *     PaginatedResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             meta:
 *               type: object
 *               properties:
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       description: Total number of items
 *                       example: 100
 *
 *   responses:
 *     Unauthorized:
 *       description: Authentication is required to access the resource
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error:
 *               status: 401
 *               code: authentication_error
 *               message: Authentication required
 *               details: null
 *               timestamp: '2023-06-12T14:35:42.123Z'
 *               path: /api/protected-resource
 *               method: GET
 *
 *     Forbidden:
 *       description: User does not have permission to access the resource
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error:
 *               status: 403
 *               code: authorization_error
 *               message: Permission denied
 *               details: null
 *               timestamp: '2023-06-12T14:35:42.123Z'
 *               path: /api/admin-resource
 *               method: GET
 *
 *     NotFound:
 *       description: The specified resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error:
 *               status: 404
 *               code: not_found
 *               message: Resource not found
 *               details: null
 *               timestamp: '2023-06-12T14:35:42.123Z'
 *               path: /api/users/123
 *               method: GET
 *
 *     BadRequest:
 *       description: The request contains invalid parameters
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error:
 *               status: 400
 *               code: validation_error
 *               message: Validation failed
 *               details:
 *                 - field: email
 *                   message: Email is required
 *                 - field: password
 *                   message: Password must be at least 8 characters
 *               timestamp: '2023-06-12T14:35:42.123Z'
 *               path: /api/users
 *               method: POST
 *
 *     InternalServerError:
 *       description: Something went wrong on the server
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error:
 *               status: 500
 *               code: server_error
 *               message: Internal server error
 *               details: null
 *               timestamp: '2023-06-12T14:35:42.123Z'
 *               path: /api/resource
 *               method: GET
 */ 