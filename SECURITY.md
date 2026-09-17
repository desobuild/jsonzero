# Security Policy

## Design Principles

JSONZero is designed for **local JSON processing**. All core JSON operations happen entirely in the browser. No JSON data is transmitted to any server for normal functionality.

## Reporting a Vulnerability

If you discover a security vulnerability in JSONZero, please report it responsibly.

**Do not** publicly disclose the vulnerability in a GitHub Issue before it has been addressed.

### How to Report

1. Open a **private security advisory** via GitHub's Security tab on this repository.
2. Provide a clear description of the vulnerability.
3. Include steps to reproduce the issue if possible.
4. Allow reasonable time for the issue to be addressed before public disclosure.

### What Qualifies

- XSS vulnerabilities in JSON rendering
- Data exfiltration through dependencies
- Privacy violations (unintended network requests)
- Supply chain attacks via dependencies

### What Does Not Qualify

- Issues requiring physical access to the user's machine
- Attacks against the hosting infrastructure (Cloudflare)
- Social engineering attacks

## Supported Versions

Only the latest released version receives security updates.

## Response Timeline

We aim to acknowledge security reports within **48 hours** and provide a fix or mitigation plan within **7 days** for critical issues.
