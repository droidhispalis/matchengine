# AI Agent Project - Copilot Instructions

## Project Overview
This is a **multi-stage job scraping and classification pipeline** for Spanish public employment opportunities (oposiciones). The system uses AI agents to search, classify, and extract structured data from job postings, specifically targeting opportunities with disability quotas.

### Pipeline Architecture (3-Stage Workers)
1. **agentRunner** → Searches web using Tavily API, inserts raw jobs into DB
2. **classifierRunner** → Uses GPT-4.1-mini to filter relevant opportunities (SI/NO classifier)
3. **extractorRunner** → Extracts structured data (title, organism, deadlines, etc.) using GPT-4.1-mini

Each worker is **independent** and can be run separately. Jobs flow through status transitions: `pending` → `classified` → `extracted`.

## Critical Patterns

### OpenAI Responses API (Not Chat Completions)
- This project uses **`openai.responses.create()`**, not the standard chat completions API
- Response objects have `.output_text` and `.output` arrays with function calls
- Tool calling pattern in [agent.ts](src/agent/agent.ts) shows: `tool_choice: { type: "function", name: "getWeather" }`
- Parse function calls from `output.find(o => o.type === "function_call")`
- Use `previous_response_id` for multi-turn conversations

### Database Status Management
- Jobs table uses `status` field: `'pending'` | `'classified'` | `'extracted'`
- **URL deduplication** via SHA-256 hash in [jobRepository.ts](src/repositories/jobRepository.ts#L6-L17)
- URLs are **normalized** (remove query params) before hashing to avoid duplicates
- Use `ON DUPLICATE KEY UPDATE id=id` pattern for upsert operations
- Repository functions return boolean to indicate new vs duplicate records

### Spanish-Language AI Prompts
- **All AI prompts are in Spanish** - maintain this convention in tools/
- Classification uses strict "SI"/"NO" binary responses (see [classifyJob.ts](src/tools/classifyJob.ts))
- Extraction expects JSON with specific schema (disability_quota, autonomous_region, etc.)
- Temperature is typically low (0.2) for deterministic extraction

### Module System & File Extensions
- Project uses **ESM** (`"type": "module"` in package.json)
- **All imports must include `.js` extension** even for `.ts` files (e.g., `import { pool } from "../db/pool.js"`)
- TypeScript compiles to JS, so references point to `.js` output

### Configuration-Driven Search
- [data/config.json](data/config.json) defines search queries and intervals
- Tavily search combines multiple queries targeting `site:juntadeandalucia.es` with disability-related terms
- Results are deduplicated by URL before storage

## Key Files & Responsibilities

- **[src/tools/](src/tools/)** - AI-powered functions (classify, extract, search)
  - Each tool is a pure function taking job data, calling OpenAI, returning result
  - Error handling: return `null` on JSON parse failures to prevent infinite retries
- **[src/workers/](src/workers/)** - Executable scripts for each pipeline stage
  - Run independently: `tsx src/workers/agentRunner.ts`
  - Each processes a batch, updates status, logs progress
- **[src/repositories/](src/repositories/)** - Database layer with SQL queries
  - Abstracts MySQL operations, handles status transitions
  - Use `getUnclassifiedJobs()`, `markJobAsClassified()` pattern
- **[src/db/pool.js](src/db/pool.js)** - MySQL connection pool (JS file, not TS)

## Development Workflow

### Running Workers
```bash
# Run dev entry point (currently demo agent)
pnpm dev

# Run specific workers directly
tsx src/workers/agentRunner.ts      # Search & insert jobs
tsx src/workers/classifierRunner.ts # Classify pending jobs
tsx src/workers/extractorRunner.ts  # Extract structured data
```

### Environment Variables Required
```
OPENAI_API_KEY=...
TAVILY_API_KEY=...
DB_HOST=...
DB_USER=...
DB_PASS=...
DB_NAME=...
```

### Testing Individual Components
- [src/testClassifier.ts](src/testClassifier.ts), [src/testSearchJobs.ts](src/testSearchJobs.ts) - Unit test examples
- Run with `tsx src/test*.ts`

## Common Pitfalls

1. **Don't use `.ts` extensions in imports** - always `.js` even though files are TypeScript
2. **Workers mark jobs as processed even on errors** - prevents infinite retry loops (see extractorRunner error handling)
3. **URL normalization is critical** - always use `normalizeUrl()` before hashing to catch duplicates
4. **OpenAI Responses API is non-standard** - don't confuse with chat completions, structure is different
5. **Config changes require worker restart** - [data/config.json](data/config.json) is read at startup

## Database Schema Expectations
- `jobs` table: `id`, `url`, `url_hash`, `title`, `snippet`, `source`, `status`, `is_relevant`, `created_at`
- `opportunities` table: includes Spanish-specific fields like `autonomous_region`, `disability_quota`, `access_type` (libre/concurso/oposicion)
