# Security Policy

## Client-Side Security & Privacy Architecture

JSONZero is designed exclusively for **local in-browser JSON processing**:
- All core JSON operations (formatting, inspection, diffing, transformation, conversion, testing, and worker operations) occur entirely within your browser runtime.
- **Zero JSON data** is ever transmitted to any backend, server, CDN, or third-party service.
- There are no user accounts, no analytics tracking, and no telemetry services.

## Reporting a Vulnerability

If you identify a security vulnerability in JSONZero, please report it responsibly.

**Do not** publicly disclose security vulnerabilities in public GitHub issues, discussions, or pull requests before they have been investigated and resolved.

### How to Report

1. Navigate to the [GitHub Security Advisories](https://github.com/desobuild/jsonzero/security/advisories/new) page for this repository.
2. Submit a private advisory detailing the vulnerability.
3. If GitHub Advisories are not accessible, contact the repository maintainers through their verified GitHub profiles. **Do not fabricate or send unverified email addresses.**

### What Information to Include

To help triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions.
- A **synthetic or sanitized** minimal reproduction payload.
- **Do NOT include real secrets, private API keys, credentials, tokens, personal data, or confidential JSON in your report.**
- Browser name, version, and operating system.

### Scope

#### In Scope
- Cross-Site Scripting (XSS) or DOM injection through malicious JSON parsing, inspection tree, or converter outputs.
- Unintended external network requests or data leakage.
- Service worker cache poisoning or offline vulnerability bypasses.
- Supply chain vulnerabilities in third-party client dependencies.

#### Out of Scope
- Attacks requiring physical device access or compromised local browser environments.
- Denial of Service caused by pasting arbitrarily large documents into client memory (handled via graceful error boundaries and workers).
- Attacks against third-party hosting infrastructure (e.g., Cloudflare Pages).
- Social engineering attacks.

## Supported Versions

Only the latest release receives security patches.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Response Timeline

We aim to:
- Acknowledge receipt within **48 hours**.
- Provide a triage status and mitigation plan within **7 days** for critical issues.
