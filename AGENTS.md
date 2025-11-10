# Agent Guidelines for Discord Bot Development

## Build & Development Commands

- **Development**: `bun run dev` - Start with live reload using tsx
- **Build**: `bun run build` - Compile TypeScript with SWC to dist/
- **Production**: `bun run start` - Run compiled code from dist/
- **Typecheck**: `tsc --noemit` - Run TypeScript type checking
- **Lint**: `bun run lint:typescript` - ESLint + TypeScript check
- **Format Check**: `bun run lint:prettier` - Prettier formatting check
- **Database**: `bun run db:generate/db:push/db:seed/db:reset` - Prisma commands

## Code Style Guidelines

- **TypeScript**: Strict mode, explicit types, no `any`, branded type interfaces
- **Imports**: Absolute paths from `src/`, external libs first, then internal imports
- **Naming**: PascalCase classes, camelCase vars/functions, SCREAMING_SNAKE_CASE constants
- **Error Handling**: Try/catch with Logger.error(), return void or throw, no silent failures
- **Formatting**: Prettier `@walidoux/prettier-config`, ESLint `@walidoux/eslint-config`
- **Discord.js**: v14+ API, `Collection` for storage, proper intent/partial handling, use `MessageFlags.Ephemeral` instead of `ephemeral: true`
- **Async/Await**: Always use, handle promises with proper error catching
- **Modules**: ESNext target, CommonJS output, declaration files generated
