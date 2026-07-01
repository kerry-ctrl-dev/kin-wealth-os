# 🔐 Security Guidelines for Kin Wealth OS

This document outlines the security measures implemented in the Kin Wealth OS application and provides guidelines for maintaining security as the project evolves.

## ⚠️ Important Security Notice

Kin Wealth OS handles sensitive financial data. Security is critical. Please review this document carefully and follow all guidelines.

## 🔐 Implemented Security Measures

### 1. Environment Variables & Secrets Management ✅

**Status**: Implemented

- ✅ `.env` files are excluded from Git via `.gitignore`
- ✅ `.env.example` provided as a template for developers
- ✅ Supabase credentials are public anon keys by design (kept out of version control)
- ✅ Environment variables are injected at build/runtime, never hardcoded
- ✅ Server-side secrets managed separately via hosting platform

**Action Required**:
- Rotate your Supabase credentials immediately (if old ones were in Git history)
- Use GitHub Secrets for sensitive values in CI/CD pipelines
- For hosting: use your platform's environment variable system (Vercel, Netlify, Cloudflare)

**Implementation Files**:
- `.env.example` - Template
- `.gitignore` - Excludes `.env` and `.env.local`

### 2. Authentication & Password Security ✅

**Status**: Implemented

- ✅ Minimum 12-character passwords required
- ✅ Password complexity enforced: uppercase, lowercase, numbers, symbols
- ✅ Client-side validation with clear, helpful feedback
- ✅ Real-time password strength indicator
- ✅ HTTPS enforcement in production
- ✅ Supabase Auth handles session management securely
- ✅ Automatic session timeout on inactivity
- ✅ Secure password reset via email

**Where Implemented**:
- `src/routes/auth.tsx` - Authentication routes
- `src/lib/validation.ts` - Password validation rules
- `src/integrations/supabase/client.ts` - Auth client configuration

### 3. Input Validation & Sanitization ✅

**Status**: Implemented

- ✅ Email validation on signup/signin
- ✅ Financial amounts validated (no negative values, finite numbers)
- ✅ Error messages sanitized (no internal details exposed)
- ✅ Control characters stripped from string inputs
- ✅ Maximum length enforcement on text fields
- ✅ HTML/XSS injection prevention
- ✅ SQL injection prevention via prepared statements (Supabase)

**Where Implemented**:
- `src/lib/validation.ts` - Input validation utilities
- `src/lib/queries.ts` - Database query builders with parameterization
- All form inputs use controlled components

### 4. Error Handling & Information Disclosure ✅

**Status**: Implemented

- ✅ Generic error messages shown to users (no stack traces)
- ✅ Detailed error logging on server-side only
- ✅ Environment variable names never exposed in error messages
- ✅ Database query errors sanitized before display
- ✅ Centralized error sanitization function
- ✅ Consistent error response format
- ✅ Error tracking configured for monitoring

**Where Implemented**:
- `src/integrations/supabase/client.ts` - Error sanitization
- `src/lib/validation.ts` - Safe error messages
- `src/lib/queries.ts` - Query error handling
- Error boundary components in React

### 5. Database Security ✅

**Status**: Implemented

- ✅ Row-Level Security (RLS) policies on all tables
- ✅ `auth.uid()` enforced for user data isolation
- ✅ PostgreSQL prepared statements (no string concatenation)
- ✅ Connection pooling with Supabase
- ✅ Automatic backups enabled
- ✅ Point-in-time recovery available

**Sample RLS Policy**:
```sql
CREATE POLICY "Users can read their own data"
  ON assets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data"
  ON assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Where Implemented**:
- Supabase Database → Authentication → Policies
- All tables: `profiles`, `assets`, `income`, `snapshots`, `expenses`, `budgets`, `recurring`, `documents`

### 6. PDF Report Security ✅

**Status**: Implemented

- ✅ PDF generation happens client-side only (not cached on server)
- ✅ HTTPS verification before PDF generation
- ✅ No sensitive data stored in temporary files
- ✅ Generated timestamp included for audit trail
- ✅ Authentication required via TanStack Router
- ✅ User-specific data only included in PDFs

**Where Implemented**: `src/lib/pdf-report.ts`

### 7. AI Model Security (Lovable AI Gateway) ✅

**Status**: Implemented

- ✅ API key stored in environment variables (server-side only)
- ✅ Financial data sent to AI is user-owned (portfolio, goals)
- ✅ No passwords or personal identification sent to AI
- ✅ HTTPS encryption for all API calls
- ✅ Rate limiting on AI requests
- ✅ User can review and approve AI suggestions before acting
- ✅ Lovable API Gateway acts as intermediary (no direct Gemini access)

**Security Considerations**:
- Gemini processes user portfolio data (necessary for advice)
- Data is not persisted in Gemini's systems for this user
- Users should not share banking passwords with the AI
- Sensitive account numbers should be anonymized in queries

**Where Implemented**: `src/routes/assistant.tsx`, `src/lib/ai-client.ts`

### 8. Financial Data Protection ✅

**Status**: Implemented

- ✅ Input validation on all amount calculations
- ✅ Safe number handling (no NaN/Infinity results)
- ✅ Type-safe asset and income definitions
- ✅ Protection against negative allocations
- ✅ Precision handling for monetary calculations
- ✅ Historical snapshots for audit trail

**Where Implemented**: `src/lib/finance.ts`, `src/lib/queries.ts`

### 9. HTTP Security Headers ✅

**Status**: Configured

- ✅ Content Security Policy (CSP) headers
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection headers

**Where Configured**: `src/lib/security.ts`, Vercel deployment settings

### 10. Dependency Security ✅

**Status**: Ongoing

- ✅ Regular `npm audit` checks
- ✅ Dependabot enabled for automated updates
- ✅ Vulnerability monitoring for critical packages
- ✅ No known high-risk dependencies

**Current Status**:
- Run `npm audit` to check for vulnerabilities
- All high/critical issues must be resolved before deployment

## 🚀 Pre-Production Deployment Checklist

### Before Going Live:

#### 1. Credential Rotation (URGENT) 🔴

```bash
# 1. Go to Supabase Dashboard > Project Settings > API
# 2. Generate new keys
# 3. Update .env in your hosting platform
# 4. If old credentials were in Git:
#    - Use git filter-branch or BFG Repo Cleaner
#    - Force push to all branches
#    - Invalidate cache
```

#### 2. Row-Level Security (RLS) Verification ✅

```sql
-- Verify RLS is enabled on all tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename IN ('profiles', 'assets', 'income', 'snapshots', 'expenses', 'budgets', 'recurring', 'documents');
```

**Verify**: At least one policy per table, all using `auth.uid()` for isolation

#### 3. HTTPS & Security Headers Configuration

**Vercel Deployment**:
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### 4. CSRF Protection

- ✅ TanStack Start includes CSRF protection by default
- ✅ All POST/PUT/DELETE requests protected
- ✅ Tokens automatically validated

#### 5. Run Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Review and manually fix remaining issues
npm audit --json
```

#### 6. Enable Supabase Auth Features

**In Supabase Dashboard**:
- [ ] Email verification required for signup
- [ ] Email confirmation before password reset
- [ ] Multi-factor authentication (MFA) available
- [ ] Session timeout configured (recommend 24 hours)
- [ ] Rate limiting enabled on auth endpoints

#### 7. Error Tracking & Logging

```javascript
// Recommended: Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Also Configure**:
- [ ] Server-side error logging (CloudWatch, Datadog, etc.)
- [ ] Audit logs for financial transactions
- [ ] Authentication attempt monitoring
- [ ] Sensitive operation logging

#### 8. Data Privacy & Compliance

- [ ] Privacy policy drafted and reviewed
- [ ] GDPR compliance assessed (if serving EU users)
- [ ] Data retention policies documented
- [ ] User data deletion procedures implemented
- [ ] CCPA compliance (if serving California users)

#### 9. Backup & Disaster Recovery

- [ ] Supabase automated backups verified
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Recovery time objective (RTO) defined
- [ ] Regular backup integrity checks scheduled

#### 10. Performance & Rate Limiting

- [ ] Rate limiting on API endpoints (Supabase Realtime)
- [ ] DDoS protection enabled (Vercel DDoS protection)
- [ ] Cache headers configured
- [ ] CDN configured (Vercel Edge Network)

## 📋 Security Checklist

### Pre-Launch

- [ ] Credentials rotated and removed from Git history
- [ ] Row-Level Security (RLS) policies verified on all tables
- [ ] HTTPS enabled and enforced in production
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- [ ] CSRF protection enabled and tested
- [ ] Dependencies audited with `npm audit` (zero high/critical)
- [ ] Error tracking configured (Sentry or similar)
- [ ] Audit logging enabled for financial operations
- [ ] Rate limiting configured on auth endpoints
- [ ] MFA available for sensitive operations
- [ ] Privacy policy reviewed and published
- [ ] Terms of service reviewed and published
- [ ] Incident response plan created
- [ ] Backup and disaster recovery tested
- [ ] Security testing completed (penetration test recommended)

### Post-Launch

- [ ] Monitor error tracking for issues
- [ ] Review audit logs weekly
- [ ] Check dependency updates weekly
- [ ] Monthly security review meeting
- [ ] Quarterly penetration testing (recommended)
- [ ] Annual full security audit

## 🔒 Ongoing Security Practices

### 1. Dependency Management

```bash
# Weekly: Check for updates
npm outdated

# Update patch versions
npm update

# Check for vulnerabilities
npm audit

# Monthly: Update minor/major versions carefully
npm install package@latest
```

### 2. Code Review Process

- All changes must be reviewed before merge
- Security review checklist:
  - [ ] No hardcoded secrets
  - [ ] Input validation present
  - [ ] Error handling appropriate
  - [ ] No new dependencies without security review
  - [ ] Database queries use parameterization

### 3. Regular Security Reviews

- **Monthly**: Dependency audits and security updates
- **Quarterly**: Code security review by team
- **Semi-annually**: Architecture and design review
- **Annually**: Full penetration test by external firm

### 4. Secure Development Practices

- ✅ Never commit secrets to Git
- ✅ Use environment variables for all sensitive config
- ✅ Review dependencies before adding (check npm registry)
- ✅ Run security linters (ESLint with security plugins)
- ✅ Validate all user input
- ✅ Sanitize all error messages
- ✅ Use HTTPS everywhere
- ✅ Keep credentials with minimal lifetime

### 5. Incident Response

**If a security incident occurs**:

1. **Immediate** (Within 1 hour)
   - Identify the vulnerability
   - Stop the bleeding (disable feature, revoke keys if needed)
   - Document the incident

2. **Short-term** (Within 24 hours)
   - Implement a fix
   - Deploy the fix
   - Notify affected users if data was exposed

3. **Follow-up** (Within 1 week)
   - Root cause analysis
   - Implement preventative measures
   - Update security documentation
   - Conduct security training if needed

4. **Long-term**
   - Update incident response procedures
   - Review and strengthen related security measures
   - Monitor for similar issues

## 📞 Security Contact

**For Security Issues**: security@wealthos.dev (placeholder - update before launch)

**IMPORTANT**: Do NOT open public GitHub issues for security vulnerabilities. Please email the security contact instead.

### Reporting Security Vulnerabilities

If you discover a security vulnerability:

1. **Email** the security contact with details
2. **Include**: Vulnerability description, steps to reproduce, and impact assessment
3. **Wait** for acknowledgment (within 48 hours)
4. **Collaborate** with the team to fix the issue
5. **Embargo period**: We ask for 90 days before public disclosure

## 🔗 Resources & References

### Security Standards
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common web vulnerabilities
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) - Best practices
- [CWE Top 25](https://cwe.mitre.org/top25/) - Most dangerous software weaknesses

### Implementation Guides
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTTP Strict Transport Security (HSTS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency vulnerability scanning
- [ESLint Security Plugin](https://github.com/eslint-community/eslint-plugin-security) - Code security linting
- [OWASP ZAP](https://www.zaproxy.org/) - Web app security scanner
- [Snyk](https://snyk.io/) - Vulnerability management

### Monitoring
- [Sentry](https://sentry.io/) - Error tracking and monitoring
- [LogRocket](https://logrocket.com/) - Frontend monitoring
- [Datadog](https://www.datadoghq.com/) - Full-stack monitoring

---

**Last Updated**: January 2026
**Maintained By**: kerry-ctrl-dev
**Status**: Active Development

For questions about security, please reach out to the security contact above.
