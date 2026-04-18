# Adveris Advisors LLP — Website Implementation Plan

## Overview

A premium, multi-page static website for **Adveris Advisors LLP**, a Bengaluru-based law, compliance, and company secretary firm. Inspired by the NKF.ch aesthetic but fully Adveris-branded with Indian Saffron + Navy palette, smooth animations, and world-class SEO. Built as a static site (Phase 1) with clean architecture to plug in Supabase auth in Phase 2 without a full rewrite.

---

## User Review Required

> [!IMPORTANT]
> **Office Address Missing**: You did not provide a specific street address. I will use **"Bengaluru, Karnataka – 560001, India"** as a placeholder. Please update this before going live.

> [!IMPORTANT]
> **Two Founder Names**: Confirmed founders are **Ashik G Swamy** and **Arthi**. The third founder will be shown as **"[Partner Name]"** placeholder. Please provide the full name when available.

> [!WARNING]
> **No Logo Provided**: I will generate a premium typographic logo using the Adveris name. You can replace it with a real logo file later — no code change needed, just swap the image file.

> [!NOTE]
> **NKF Reference**: You confirmed — NO NKF references anywhere. The website will be 100% original Adveris branding.

---

## Proposed Changes

### Project Structure

```
c:\Users\HP\Documents\Adveris - google\
  ├── index.html              # Home page
  ├── about.html              # About Us
  ├── team.html               # Our Team
  ├── services.html           # Practice Areas
  ├── insights.html           # Blog / Insights
  ├── careers.html            # Careers
  ├── contact.html            # Contact
  ├── css/
  │   ├── style.css           # Core design system
  │   └── animations.css      # Scroll & hover transitions
  ├── js/
  │   ├── main.js             # Core interactions, scroll dots, menu
  │   └── seo.js              # Structured data injection (JSON-LD)
  ├── assets/
  │   ├── logo.svg            # Generated typographic logo
  │   ├── favicon.ico
  │   └── images/             # Team avatars, service icons
  └── sitemap.xml             # SEO sitemap
```

---

### Design System

#### Color Palette
| Token | Value | Usage |
|---|---|---|
| `--saffron` | `#FF9933` | Primary accent, buttons, arrows, active states |
| `--saffron-dark` | `#E07B00` | Hover states |
| `--navy` | `#0D1B3E` | Headlines, deep backgrounds |
| `--navy-light` | `#1B2B5E` | Secondary navy |
| `--white` | `#FFFFFF` | Card backgrounds |
| `--off-white` | `#F8F6F1` | Page background tint |
| `--text-dark` | `#1A1A2E` | Body text |
| `--text-grey` | `#555566` | Secondary text |
| `--gradient-bg` | `saffron + navy blur` | Hero background (like NKF but Indian palette) |

#### Typography
- **Headings**: `Cormorant Garamond` (Google Fonts — elegant serif, like NKF Didot)
- **Body / UI**: `Inter` (Google Fonts — clean, modern sans-serif)
- **Labels / Nav**: `Inter` uppercase, tracked

---

### Pages

#### [NEW] index.html — Home
Sections:
1. **Hero** — Full-viewport. Blurred saffron-navy gradient background. "Your Trusted Advisory Partner in India." Scroll indicator.
2. **Services Strip** — 4 key services in a horizontal row with saffron icons
3. **About Snippet** — Who we are, values, "Learn More →" arrow link
4. **Our Team Preview** — 3 founder circular avatars
5. **Insights Preview** — Latest 3 blog cards
6. **Careers CTA** — Bold full-width navy band
7. **Footer** — Logo, nav links, contact, social icons, copyright

#### [NEW] about.html — About Us
- Firm story and founding mission
- Core values (4 pillars: Integrity, Expertise, Trust, Innovation)
- Why choose Adveris section
- India-specific regulatory context

#### [NEW] team.html — Our Team
- Ashik G Swamy — Founder & Managing Partner
- Arthi — Partner
- [Partner Name] — Partner (placeholder)
- Search and filter by practice area
- Circular professional avatars

#### [NEW] services.html — Practice Areas
All 8 services with:
- Icon (SVG outline)
- Headline
- 2–3 paragraph description with Indian law context
- Relevant acts/regulations cited

Services: Corporate Law, M&A, Regulatory Compliance (SEBI/RBI/MCA), Company Secretary Services, Contract Drafting, Labour & Employment Law, GST & Tax Compliance, Startup Legal Advisory

#### [NEW] insights.html — Blog / Insights
- 6 static articles covering hot Indian legal topics:
  - SEBI Circular Updates 2024
  - New Company Act Amendments
  - GST Compliance for Startups
  - DPIIT Registration Guide
  - ROC Filing Deadlines
  - LLP vs Private Limited: Which is Right?
- Category filter: Corporate, Compliance, Tax, Startup

#### [NEW] careers.html — Careers
- Why join Adveris section
- Open roles (3 placeholder roles: CS, Legal Associate, Compliance Analyst)
- Application form (name, email, role, resume upload — Phase 1: mailto link)
- Culture & values

#### [NEW] contact.html — Contact
- Contact form (Name, Email, Phone, Service Enquiry, Message)
- Phone: +91 97393 82704
- Email: csashikgswamy@gmail.com
- Location: Bengaluru, Karnataka
- Embedded Google Maps placeholder
- Office hours

---

### Animations & Transitions

- **Page load**: Fade-in with slight upward translate on hero text
- **Scroll animations**: Elements fade + slide up as they enter viewport (IntersectionObserver API — no library dependency)
- **Side nav dots**: Fixed vertical dots on left; active section highlighted in saffron
- **Full-screen menu**: Overlay opens with slide-down + stagger animation on menu items
- **Arrow links**: Long saffron arrow (`————→`) slides right on hover
- **Cards**: Subtle lift (translateY -4px + shadow) on hover
- **Service icons**: Saffron fill pulse on hover

---

### SEO Strategy

#### Technical SEO (built in to every page)
- Unique `<title>` and `<meta description>` per page
- Canonical URLs
- `Open Graph` + `Twitter Card` meta tags
- `JSON-LD` structured data: `LegalService`, `Organization`, `LocalBusiness`, `Person`
- `sitemap.xml` with all pages
- `robots.txt`
- Semantic HTML5 (`<article>`, `<section>`, `<nav>`, `<main>`, `<aside>`)
- Image `alt` attributes on all images
- Heading hierarchy (single `<h1>` per page)
- Page speed: no render-blocking scripts, fonts preloaded

#### Keyword Strategy (All-India, not location-locked)
Primary:
- "Company Secretary Services India"
- "Corporate Law Firm India"
- "MCA Compliance Services"
- "SEBI Compliance Consultant India"
- "LLP Registration India"
- "Startup Legal Advisory India"
- "GST Compliance Services India"
- "M&A Legal Advisory India"

Long-tail (high intent):
- "Company Secretary for Startup India"
- "ROC Filing Services India"
- "DPIIT Startup Registration Help"
- "Legal Advisory for Private Limited Company"
- "Labour Law Compliance Consultant India"
- "Contract Drafting Services India"
- "Annual Compliance Services for Companies"
- "RBI FEMA Compliance India"

Local secondary (Bengaluru):
- "Corporate Law Firm Bengaluru"
- "Company Secretary Bangalore"
- "Startup Legal Support Bangalore"

---

### Phase 2 Readiness

The site is built with clear hook points for Phase 2:
- Login buttons in nav already present (hidden, CSS class `phase2-hidden`)
- Auth modals stubbed in HTML (hidden)
- Role system designed: `admin`, `employee`, `customer`
- All form submissions logged to console (swap in Supabase calls)
- Folder structure supports adding `/portal/` subdirectory cleanly

---

## Deployment Plan (Step-by-Step to Go Live)

### Phase 1 — Static Launch (~₹800/year total)
1. **Buy domain**: `adverisadvisors.in` via BigRock or GoDaddy (~₹800/year)
2. **GitHub**: Create free account → push code to repo
3. **Netlify**: Connect GitHub repo → auto-deploys on every push
4. **Custom domain**: Point your domain to Netlify (5-min setup)
5. **SSL**: Netlify provides free HTTPS automatically
6. **Netlify CMS**: Enable to allow non-developer content updates
7. **Google Search Console**: Submit sitemap for faster indexing

### Phase 2 — Portal Launch (~₹0–₹2,000/month)
1. **Supabase**: Free project (50K users, 500MB DB)
2. **Auth**: Email/password + magic link (Supabase Auth)
3. **DB tables**: users, roles, documents, reviews, audit_log
4. **Edge Functions**: Document review triggers + email via Resend
5. **Row Level Security**: Supabase RLS enforces role permissions without code
6. **Google Workspace**: For professional email (csashik@adverisadvisors.in)

---

## Verification Plan

### Automated
- Open all 7 pages in browser and confirm no JS errors
- Check all nav links work correctly
- Validate HTML with W3C validator

### Visual
- Desktop (1440px), Tablet (768px), Mobile (375px) screenshots
- Check all animations trigger correctly
- Verify saffron + navy palette consistency across all pages

### SEO
- Run Lighthouse audit → target 95+ score
- Validate JSON-LD with Google Rich Results Test
- Confirm sitemap.xml is accessible
