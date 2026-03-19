# Bedrock Staffing — Pricing Direction

## Pricing Philosophy

- **Land free, expand paid**: Let teams try with zero friction, convert when they hit team-size or feature thresholds.
- **Per-user pricing**: Aligns cost with team growth; simple to understand.
- **No per-module upselling**: Every plan gets the full workflow. Paid plans add scale, automation, and support.

---

## Model A: Freemium + Per-User SaaS (Recommended for market entry)

| Plan | Price | Users | Key Features |
|------|-------|-------|-------------|
| **Starter** | Free | Up to 3 | Full workflow (candidates, jobs, companies, placements), client portal, CSV import/export, email notifications |
| **Professional** | $49/user/mo | Unlimited | Everything in Starter + automation rules, advanced reporting, saved views, audit trail, priority support |
| **Enterprise** | Custom | Unlimited | Everything in Pro + SSO/SAML, custom integrations, SLA, dedicated account manager, on-premise option |

**Why this works**:
- Free tier is generous enough to be useful (solo recruiter or 2-person firm)
- $49/user is competitive vs. Bullhorn ($99+) and JobAdder ($70+)
- Enterprise captures large firms with compliance/security needs

**Revenue math** (example):
- 10-person firm on Pro = $490/mo = $5,880/yr
- 25-person firm on Pro = $1,225/mo = $14,700/yr
- 50-person firm on Enterprise = custom ($2,000–5,000/mo range)

---

## Model B: Flat-Rate Tiers (Simpler, good for internal-use positioning)

| Plan | Price | Users | Key Features |
|------|-------|-------|-------------|
| **Solo** | Free | 1 | Full workflow, basic reporting |
| **Team** | $149/mo | Up to 10 | Everything + automation, saved views, client portal, audit trail |
| **Agency** | $349/mo | Up to 30 | Everything + advanced reporting, priority support, CSV bulk ops |
| **Enterprise** | $799/mo | Unlimited | Everything + SSO, custom integrations, SLA |

**Why this works**:
- Simpler mental model — "what tier am I?"
- No per-user math anxiety
- Good for firms that want predictable costs

**Trade-off**: Less revenue upside from large teams (a 25-person firm pays $349 vs. $1,225 in Model A).

---

## Model C: Placement-Based Pricing (Revenue-aligned, advanced)

| Plan | Price | Inclusions |
|------|-------|-----------|
| **Starter** | Free | Up to 5 placements/mo, 3 users |
| **Growth** | $99/mo + $25/placement | Unlimited users, automation, reporting |
| **Scale** | $299/mo + $15/placement | Everything + priority support, audit trail |
| **Enterprise** | Custom | Volume discounts, SLA, integrations |

**Why this works**:
- Aligns Bedrock's revenue with customer success (more placements = more revenue for both)
- Lower base cost = easier adoption
- Natural upsell as firms grow

**Trade-off**: Harder to predict costs; some firms may resist variable pricing. Requires placement tracking to be airtight.

---

## Internal-Use vs. SaaS-Ready Considerations

### For internal use (single-firm deployment)
- Use Model B (flat-rate) — simplest to justify as a line item
- Consider a one-time license option: $2,500 for self-hosted perpetual license
- No client portal needed (or optional)
- Key value prop: "Replace your spreadsheets for less than your monthly coffee budget"

### For SaaS (multi-tenant, many firms)
- Use Model A (per-user freemium) — maximizes revenue per customer
- Free tier drives word-of-mouth and organic growth
- Client portal is a key differentiator
- Key value prop: "Grow your firm with software that scales with you"

---

## Recommended Launch Strategy

1. **Launch with Model A** (Freemium + Per-User)
2. **Starter tier is permanently free** — this is the acquisition engine
3. **Professional is the target conversion** — aim for 15–25% of free users upgrading within 90 days
4. **Enterprise is sales-led** — no self-serve; inbound demo requests only
5. **Annual discount**: 20% off for annual billing ($49 → $39/user/mo)
6. **Do NOT implement Stripe yet** — use the waitlist + demo flow to validate pricing before building billing infrastructure

---

## Pricing Page Copy

### Headline
"Simple, transparent pricing"

### Subheadline
"Start free. Upgrade when you're ready."

### CTA (Starter)
"Get Started Free"

### CTA (Professional)
"Request Demo"

### CTA (Enterprise)
"Contact Sales"
