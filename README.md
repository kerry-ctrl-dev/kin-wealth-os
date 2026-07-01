# 💰 Kin Wealth OS

An intelligent financial management platform that consolidates your complete financial picture—from investments and income to expenses and debts—with an AI-powered assistant to guide your financial journey.

## 🎯 Overview

**Kin Wealth OS** is a comprehensive wealth management application designed to help you:

- **Consolidate Assets** - Merge all financial assets (investments, real estate, crypto) into one unified dashboard
- **Track Cash Flow** - Monitor income, expenses, and net worth trends
- **Get AI Financial Advice** - Receive personalized guidance from an intelligent financial assistant
- **Plan & Project** - Simulate future scenarios and set achievable financial goals
- **Manage Documents** - Securely store and organize financial documents

## ✨ Key Features

### Core Features (MVP)

1. **Investment Portfolio Management** - Track stocks, crypto, real estate, and other assets with real-time valuations
2. **Dashboard Overview** - At-a-glance view of total net worth, asset allocation, and performance metrics
3. **Authentication & Security** - Secure signup/signin with 12+ character passwords and role-based access

### Planned Features (In Development)

1. **Expenses & Cash Flow** - Track spending by category with monthly net cash flow analysis
2. **Net Worth History** - Daily snapshots and trend analysis (30/90/365-day views)
3. **AI Financial Assistant** - Floating chat powered by Google Gemini 2.5 Flash for real-time financial advice
4. **Budgets & Alerts** - Set spending limits with progress tracking and over-budget warnings
5. **Future Projection Simulator** - Model compound growth scenarios with custom parameters
6. **Recurring Transactions** - Automate income and expense tracking
7. **Document Vault** - Private, encrypted storage for financial documents

## 🛠 Tech Stack

- **Frontend**: TypeScript (97.8%), React/TanStack Start
- **Styling**: CSS (1.1%), Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini 2.5 Flash via Lovable AI Gateway
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **PDF Reports**: Client-side generation with jsPDF
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone https://github.com/kerry-ctrl-dev/kin-wealth-os.git
cd kin-wealth-os

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
LOVABLE_API_KEY=your_lovable_api_key
```

## 📁 Project Structure

```
src/
├── routes/           # TanStack Start file-based routing
├── components/       # Reusable React components
├── lib/             # Utilities (validation, finance, security, queries)
├── integrations/    # External service integrations (Supabase)
└── styles/          # Global styles and design tokens
```

## 📊 Database Schema

### Core Tables

- **profiles** - User profile data (name, email, avatar, phone)
- **assets** - Investment holdings (type, symbol, quantity, value)
- **income** - Income sources (amount, source, frequency, date)
- **snapshots** - Daily net worth snapshots for historical tracking
- **expenses** - Expense entries (amount, category, date, method)
- **budgets** - Monthly budget limits by category
- **recurring** - Recurring transactions (income/expense)
- **documents** - Financial documents with private storage

All tables use Row-Level Security (RLS) scoped to `auth.uid()`.

## 🔐 Security

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

### Key Security Features

- ✅ Environment variables for secrets (never hardcoded)
- ✅ 12+ character passwords with complexity requirements
- ✅ Input validation and sanitization
- ✅ Row-Level Security on all database tables
- ✅ HTTPS enforcement in production
- ✅ Client-side PDF generation (no server caching)
- ✅ Sanitized error messages (no information disclosure)
- ✅ CSP and HSTS headers configured

## 🧪 Testing

```bash
# Run tests
npm run test

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 📈 Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, etc.
- Example: `feat: add expense tracking to dashboard`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with descriptive commits
3. Update documentation if needed
4. Submit a PR with clear description
5. Request review from maintainers
6. Address feedback and merge when approved

## 📝 Documentation

- [Security Guidelines](./SECURITY.md) - Security practices and checklist
- [Route Structure](./src/routes/README.md) - TanStack Start routing conventions
- [API Documentation](./docs/API.md) - Server functions and integrations
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## 🐛 Reporting Issues

Found a bug? Please open an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, Node version)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the code style (ESLint configured)
4. Write clear commit messages
5. Submit a pull request

See [Contributing Guidelines](./CONTRIBUTING.md) for detailed information.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 📞 Support

- **Issues**: GitHub Issues
- **Security**: See SECURITY.md for reporting procedures
- **Questions**: Discussions tab in GitHub

## 🗺 Roadmap

- [ ] Q3 2026: AI Financial Assistant MVP
- [ ] Q4 2026: Expense tracking and budget management
- [ ] Q1 2027: Document vault and recurring transactions
- [ ] Q2 2027: Advanced analytics and projections
- [ ] Ongoing: Performance optimization and security audits

## 👨‍💻 Author

Created by [kerry-ctrl-dev](https://github.com/kerry-ctrl-dev)

---

**Made with ❤️ to help you achieve financial freedom**