# Agent Guidelines for Discord Bot Development

## Build & Development Commands

- **Development**: `bun run dev` - Start with live reload
- **Build**: `bun run build` - Compile TypeScript with SWC
- **Production**: `bun run start` - Run compiled code
- **Typecheck**: `tsc --noemit` - Run single TypeScript check
- **Lint TypeScript**: `eslint "**/*.ts" --ignore-path ".gitignore" && tsc --noemit`
- **Format Check**: `prettier "." --check --ignore-unknown '!**/*.yml' --ignore-path ".gitignore"`

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, use explicit types, no `any`
- **Imports**: Use absolute imports from `src/` root, group external libs first
- **Naming**: PascalCase for classes, camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants
- **Error Handling**: Use try/catch blocks, return void or throw errors
- **Formatting**: Use Prettier config `@walidoux/prettier-config`, ESLint config `@walidoux/eslint-config`
- **Discord.js**: Use v14+ API, prefer `event()` wrapper, use `Collection` for command storage
- **Async/Await**: Always use for async operations, handle promises properly
- **Modules**: CommonJS output, ESNext target, `.d.ts` files generated
