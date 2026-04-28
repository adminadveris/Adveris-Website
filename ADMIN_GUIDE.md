# Admin Guide: Updating Website Content

Welcome to the Adveris Advisors Admin Guide. This document explains how to update the website's dynamic content (Services, Team, Careers, etc.) by modifying the central JSON files in the `data/` folder.

> [!IMPORTANT]
> **No Coding Required**: You do not need to edit HTML files to update these sections. Simply editing the corresponding JSON file will automatically update the website.

---

## 📂 Where are the data files?
All editable content is located in the `data/` directory at the root of the project:
- `data/about.json` — "Why Adveris" and "Core Values" sections.
- `data/services.json` — Practice Areas and their details.
- `data/team.json` — All Partners and Professionals.
- `data/careers.json` — Current job openings.
- `data/insights.json` — Blog posts and legal articles.
- `data/testimonials.json` — Client reviews on the homepage.

---

## 🛠 How to Update Content (Field-by-Field)

### 1. Updating Services (Practice Areas)
**File**: `data/services.json`
- **`id`**: Numeric ID (e.g., "01", "02"). This is used for link anchors.
- **`title`**: The main name of the service.
- **`summary`**: A short description for the homepage card.
- **`bullets`**: A list of specific sub-services displayed on the services page.
```json
{
  "id": "13",
  "title": "New Practice Area",
  "summary": "Short description for the homepage card.",
  "bullets": [
    "Specific service 1",
    "Specific service 2"
  ]
}
```

### 2. Updating Team Members
**File**: `data/team.json`
- **`id`**: Unique lowercase identifier (e.g., "john-doe").
- **`name`**: Full name of the professional.
- **`role`**: Job title (e.g., "Partner — Compliance").
- **`initial`**: 1 or 2 letters for the avatar circle (e.g., "AS").
- **`team`**: Use `"core"` for Partners, `"staff"` for Associates, or `"specialised"` for Advisors.
- **`homepageSummary`**: A one-sentence blurb for the homepage preview.
- **`bio`**: An **array** of paragraphs. Each string is a new paragraph.
- **`tags`**: Skill/Role tags (e.g., ["Partner", "CS"]).
- **`location`**: Office location (optional).
- **`email`**: Professional email address (optional).
```json
{
  "id": "jane-doe",
  "name": "Jane Doe",
  "role": "Partner",
  "initial": "JD",
  "team": "core",
  "homepageSummary": "Expert in M&A advisory...",
  "bio": [
    "Paragraph 1 text...",
    "Paragraph 2 text..."
  ],
  "tags": ["Partner", "Legal"],
  "location": "Bengaluru, Karnataka",
  "email": "jane@adverisadvisors.com"
}
```

### 3. Updating Job Openings
**File**: `data/careers.json`
- **`id`**: Unique identifier (e.g., "legal-assoc").
- **`title`**: Role title.
- **`description`**: Detailed job description.
- **`type`**: Employment type (e.g., "Full Time").
- **`experience`**: Experience range (e.g., "2–4 Years").
- **`qualification`**: Required degrees (e.g., "LLB Required").
```json
{
  "id": "intern",
  "title": "Legal Intern",
  "description": "Short description of the role...",
  "type": "Internship",
  "experience": "Fresher",
  "qualification": "Final Year Law Student"
}
```

### 4. Updating "About Us" Content
**File**: `data/about.json`
- **`whyAdveris`**: List with `title` and `text` for the "Our Story" section.
- **`values`**: List with `title` and `text` for the "Core Values" cards.

### 5. Updating Insights (Blog)
**File**: `data/insights.json`
- **`category`**: Display label (e.g., "Corporate").
- **`title`**: Article title.
- **`summary`**: Short preview text.
- **`date`**: Publication month/year.
- **`readTime`**: Estimated reading time (e.g., "5 min read").
- **`catId`**: Lowercase category for filtering (e.g., "corporate").

### 6. Updating Testimonials
**File**: `data/testimonials.json`
- **`date`**: Date of testimonial.
- **`text`**: The actual review content.
- **`name`**: Client name.
- **`role`**: Client company or title.
- **`initial`**: Letter for the testimonial avatar.

---

## ⚠️ Best Practices & Troubleshooting

1.  **JSON Syntax**: Ensure every item in a list (except the last one) is followed by a comma `,`.
2.  **Quotes**: All text and property names MUST be inside double quotes `"`.
3.  **No HTML**: Do not use HTML tags inside the JSON text.
4.  **Hard Refresh**: If you don't see your changes, try **Ctrl + F5** (Windows) or **Cmd + Shift + R** (Mac).
