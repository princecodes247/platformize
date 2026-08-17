# Contributing to Platformize

Thank you for your interest in contributing to Platformize! We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## 🛠️ Development Setup

Platformize uses an `npm` monorepo workspace structure.

### Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/princecodes247/platformize.git
   cd platformize
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build all workspace packages:
   ```bash
   npm run build
   ```

---

## 🧪 Testing & Validation

Before submitting changes, ensure all unit tests pass:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript typechecks
npm run typecheck
```

---

## 🎨 Code Style & Formatting

We use Prettier and ESLint to enforce a consistent code style across the monorepo.

```bash
# Run linter
npm run lint

# Format code automatically
npm run format
```

---

## 📦 Versioning & Changesets

We use **Changesets** to manage releases, changelogs, and versioning.

If your PR introduces user-facing changes or bug fixes, add a changeset before opening your PR:

```bash
npx changeset
```

Follow the interactive prompts:
1. Select the packages affected by your changes.
2. Choose the semver bump type (`patch`, `minor`, or `major`).
3. Provide a clear summary of what changed.

Commit the generated `.changeset/*.md` file along with your code changes.

---

## 🚀 Submitting a Pull Request

1. Create a feature branch off `main`:
   ```bash
   git checkout -b feature/my-cool-feature
   ```
2. Make your changes, write tests, and verify with `npm test`.
3. Add a changeset if applicable (`npx changeset`).
4. Commit your changes:
   ```bash
   git commit -m "feat(vite): add awesome new option"
   ```
5. Push to your fork and submit a Pull Request!

Thank you for helping make Platformize better!
