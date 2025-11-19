### 📘 Project Best Practices

#### 1. Project Purpose
A full-stack pharmacy management platform. The backend is an Express (ESM) API with MongoDB (Mongoose) for authentication, products, carts, orders, prescriptions (including OCR extraction via Tesseract and PDF parsing), checkout, and M-Pesa payments. The frontend is a static client served via live-server for admin, pharmacist, and patient experiences.

#### 2. Project Structure
- backend/
  - server.js: Express app entry. Loads .env from repo root, sets CORS, JSON parsing, cookies, static uploads, and mounts feature routes. Connects to MongoDB on listen.
  - config/: DB and third-party setup (MongoDB, Cloudinary)
  - controllers/: Route handlers for each domain (auth, cart, chatbot, checkout, message, mpesa, order, prescription, product)
  - middleware/: AuthZ/AuthN (protectRoute, authorize), uploads (multer), etc.
  - models/: Mongoose schemas (cart, checkout, conversation, message, order, prescription, product, user)
  - routes/: Express routers mapping REST endpoints to controllers
  - utils/: Reusable helpers (email sender, JWT generation, M-Pesa token, OCR)
  - views/: Reserved for server-rendered views (currently unused)
- client/
  - admin/, pharmacist/, pages/patient/: Role-specific pages, assets, and scripts
  - public/: Shared static assets like navbar
  - scripts/: Shared client JS entrypoints
  - assets/: Images, Lottie JSON, styles
- tests/
  - server.test.js: Node test runner (node:test) smoke tests for server availability and products route
- package.json: ESM project with dev scripts for concurrent backend and static frontend, and Node test runner configuration

Key entry points and configs:
- Node ESM: "type": "module"
- Start: npm start (node backend/server.js)
- Dev: npm run dev (concurrently runs nodemon and live-server)
- Env: .env is expected at the repo root; backend/server.js resolves it from one level above backend/
- Static uploads served from /uploads via express.static

#### 3. Test Strategy
- Framework: Node’s built-in node:test with assert
- Scope: Smoke tests that verify server responds and product route doesn’t crash
- Organization: tests/ folder at repo root; add per-domain test files (e.g., products.test.js, auth.test.js)
- Conventions:
  - Name tests as <feature>.test.js
  - Keep tests independent; avoid shared global state
  - Use environment variable BASE_URL to point tests at a running server
- Mocking:
  - For unit tests, mock external services (MongoDB with an in-memory server like mongodb-memory-server, Cloudinary, Tesseract/PDF parsing, M-Pesa HTTP calls)
  - Stub network-bound code with nock or manual http/https stubs
- Strategy:
  - Unit tests for controllers and utils (validate request validation, branches, error paths)
  - Integration tests for routes (supertest against an app instance) covering auth, authorization, validation, and common 4xx/5xx
  - Acceptance smoke tests against a running server (current pattern)
- Coverage: Target 80%+ for controllers and utils; ensure critical flows (auth, payments, prescriptions OCR) have tests for success and failure

#### 4. Code Style
- Language: Modern JavaScript (ES modules)
- Async patterns: Use async/await; always wrap await in try/catch at controller boundaries and return proper HTTP status codes
- Typing: Use JSDoc for complex params/returns if needed; prefer explicit object shapes in docs and consistent return schemas
- Naming:
  - Files: kebab-case for routes (auth.routes.js), controllers (feature.controller.js), and models (feature.model.js)
  - Variables: camelCase; constants UPPER_SNAKE_CASE
  - Functions: verbs for handlers (getAllProducts, uploadPrescription)
  - Routes: plural resources (products, orders) and semantic verbs where necessary (/verify, /upload)
- Validation:
  - Validate req.params, req.query, and req.body; use express-validator consistently for user input
  - Normalize responses: { success, data|<resource>, message|error }
- Errors:
  - Use consistent 4xx/5xx codes; never expose internal error stacks in responses
  - Log with context (controller name, action, ids)
- Security:
  - Use protectRoute for authenticated routes and authorize for role checks
  - Sanitize inputs; avoid trusting client-provided IDs
  - Set CORS allowlist via config; fail closed for unknown origins
  - Never store plain passwords; use bcryptjs and JWT via generateToken
- Files/Uploads:
  - Restrict MIME types and file size in multer config
  - Store only URLs/paths in DB; never raw file buffers
  - Serve uploads via static path with correct permissions

#### 5. Common Patterns
- Layered architecture: routes -> controllers -> models/utils
- Auth middleware pipeline: router.use(protectRoute) then authorize per-route
- Controller structure: try/catch with early 4xx returns and final 500 fallback
- OCR pipeline: upload -> async OCR (image/pdf) -> parsed data persisted -> status updates
- M-Pesa/payment utilities centralized under utils; tokens re-used via helper
- ID conventions: public-facing IDs like prescriptionId separate from Mongo _id

#### 6. Do's and Don'ts
- Do
  - Keep controllers thin; move cross-cutting logic to utils/services
  - Validate inputs and sanitize outputs
  - Paginate list endpoints; add filters for categories/status
  - Use lean() for read-only queries to improve performance
  - Populate only required fields to minimize payload size
  - Check route protection and authorization for every new endpoint
  - Add rate limiting and Helmet for production (already listed in deps)
- Don’t
  - Block the request/response cycle with long-running OCR or external calls; offload or background when possible
  - Return unbounded query results or sensitive fields
  - Hardcode origins, secrets, or file paths in code; use .env and config modules
  - Mix role-specific logic inside shared controllers; prefer middleware and service functions

#### 7. Tools & Dependencies
- Backend
  - express: HTTP server and routing
  - mongoose: MongoDB ODM
  - jsonwebtoken, bcryptjs, cookie-parser: Auth stack
  - multer: File uploads
  - tesseract.js, pdf-parse: OCR and PDF text extraction
  - cloudinary: File storage (images)
  - helmet, cors, morgan: Security, CORS, logging
- Dev
  - nodemon: Auto-restart server in dev
  - live-server: Static client dev server
  - concurrently: Run backend and frontend together
- Scripts
  - npm run dev: start backend (nodemon) and client (live-server) together
  - npm run server: start backend with nodemon only
  - npm test: Node test runner (node --test)
- Setup
  - Ensure .env at repo root; server resolves it from one level above backend
  - Create uploads/ directory with write permissions
  - Configure MongoDB URI, JWT secret, Cloudinary, and M-Pesa credentials in .env

#### 8. Other Notes
- CORS allowlist lives in backend/server.js; consider moving to config and reading from env (comma-separated list)
- Consider extracting OCR processing to a background job queue (e.g., BullMQ + Redis) to avoid tying response time to extraction
- Add centralized error handler middleware and a request validator middleware wrapper to standardize responses
- Prefer Supertest for route-level integration tests and mongodb-memory-server for isolated DB testing
- Maintain API contracts in a docs/ folder or OpenAPI spec for frontend consumption
- When generating new code:
  - Follow existing folder/file naming conventions
  - Export default routers and named controller functions
  - Always protect routes that modify resources; authorize by role where applicable
  - Keep response shapes consistent and include success flag and messages where helpful