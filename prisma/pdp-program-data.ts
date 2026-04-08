/** Content for Prototype Development Program (PDP) — 12-week, 3-month structure. */

export const PDP_SLUG = "prototype-development-program";

export const PDP_COVER_IMAGE_URL =
  "/images/programs/pdp-prototype-development-cover.png";

export const PDP_TITLE = "Prototype Development Program (PDP)";

export const PDP_DESCRIPTION = `A structured twelve-week journey from problem discovery to demo day. Participants move through ideation and validation, hands-on technical development in the UNIPOD makerspace, then iteration, market validation, and startup readiness—with clear deliverables each month.

The path blends customer discovery, design thinking, CAD, digital fabrication, electronics, software integration, and business skills. Cohorts progress through three month-long phases; linked LMS courses align with the innovation track where weeks 3–12 match your weekly themes.`;

export const PDP_PHASES: {
  sortOrder: number;
  title: string;
  description: string;
  /** Innovation track course slugs to attach (optional). */
  courseSlugs: string[];
  assignments: {
    title: string;
    description: string;
    maxPoints: number;
    requiredForCompletion: boolean;
    responseType: "TEXT" | "FILE";
  }[];
}[] = [
  {
    sortOrder: 0,
    title: "Month 1 — Ideation, validation & planning",
    description: `Weeks 1–4 (problem → plan)

**Week 1 — Problem discovery & market research**  
Learning objectives: identify real problems and validate that ideas address genuine needs.  
Topics: innovation ecosystems, problem identification, market research, customer discovery, value proposition design.  
Practical: stakeholder mapping, target segment, competitors, validation interviews.  
**Deliverables:** Customer Discovery Report (10 interviews, problem statements, current solutions); Problem Definition Document; Market Landscape Analysis.

**Week 2 — Makerspace orientation & safety**  
UNIPOD lab orientation, safety, equipment usage, fabrication workflows. Demonstrations: 3D printers, laser cutters, CNC, electronics lab, hand tools.  
**Deliverables:** Lab Safety Certification (quiz + demonstration).

**Week 3 — Design thinking & innovation methods**  
Design thinking, human-centered design, ideation, rapid prototyping mindset. Activities: personas, journey maps, brainstorming.  
**Deliverables:** Solution Concept Development (three concepts, feasibility/impact); Concept Selection Report.

**Week 4 — Project planning & feasibility**  
Technical feasibility, roadmap, resources, risk, milestones.  
**Deliverables:** Prototype Development Plan (architecture, timeline, budget); Prototype Development Roadmap.

_Linked courses (weeks 3–4) align with the LMS innovation track; weeks 1–2 are delivered through onboarding and lab sessions._`,
    courseSlugs: [
      "innovation-week-3-design-thinking",
      "innovation-week-4-project-planning-feasibility",
    ],
    assignments: [
      {
        title: "Month 1 — Discovery & planning portfolio",
        description: `Submit a single document that includes:

1. **Customer Discovery Report** — Summarize at least 10 customer interviews: problem statements, how people solve the problem today, and gaps.
2. **Problem Definition & market landscape** — Clear problem statement and competitor/alternative scan.
3. **Concept selection** — Your three solution concepts with a short feasibility and impact comparison and your chosen direction.
4. **Prototype Development Roadmap** — Technical architecture outline, milestone timeline, and rough budget.

Use headings for each section. PDF upload preferred if you combine multiple artifacts.`,
        maxPoints: 100,
        requiredForCompletion: true,
        responseType: "FILE",
      },
    ],
  },
  {
    sortOrder: 1,
    title: "Month 2 — Technical development",
    description: `Weeks 5–8 (design → build → integrate)

**Week 5 — CAD** — Parametric modeling, product design principles, files for fabrication (Fusion 360, SolidWorks, or FreeCAD).  
**Deliverables:** 3D model, technical drawings, STL exports.

**Week 6 — Digital fabrication** — 3D printing, laser cutting, CNC, materials. Print and assemble first physical parts.  
**Deliverables:** Fabrication report with photos and documentation.

**Week 7 — Electronics & embedded** — Circuits, sensors, microcontrollers (e.g. Arduino/ESP32), power.  
**Deliverables:** Working circuit, system architecture diagram.

**Week 8 — Software integration** — Embedded logic, APIs, IoT basics, visualization; connect hardware to application logic.  
**Deliverables:** Working integrated prototype, link to code repository.

_Linked courses follow the innovation track weeks 5–8._`,
    courseSlugs: [
      "innovation-week-5-cad-for-prototyping",
      "innovation-week-6-digital-fabrication",
      "innovation-week-7-electronics-embedded",
      "innovation-week-8-software-integration",
    ],
    assignments: [
      {
        title: "Month 2 — Build & integration checkpoint",
        description: `Describe your **CAD and fabrication** progress, **electronics** prototype, and **software integration** status.

Include: screenshots or photos of CAD and fabricated parts; a simple architecture diagram; link to your repository or folder for code; known risks and next steps for Month 3.

Minimum ~600 words or equivalent structured bullets.`,
        maxPoints: 100,
        requiredForCompletion: true,
        responseType: "TEXT",
      },
    ],
  },
  {
    sortOrder: 2,
    title: "Month 3 — Prototyping & business readiness",
    description: `Weeks 9–12 (iterate → validate → pitch)

**Week 9 — Prototype iteration** — User testing, feedback, performance improvements.  
**Deliverables:** User Testing Report (feedback analysis, design changes).

**Week 10 — Market validation** — Customer validation, pricing experiments, ~20 interviews, demos.  
**Deliverables:** Market Validation Report; product–market fit assessment.

**Week 11 — Startup & financial planning** — Business model, projections, IP, registration.  
**Deliverables:** Business model, financial projections, pitch deck outline.

**Week 12 — Demo Day preparation** — Pitching, storytelling, product demo rehearsal.  
**Deliverables:** Final prototype demonstration, pitch, program report.

_Linked courses follow innovation track weeks 9–12._`,
    courseSlugs: [
      "innovation-week-9-prototype-iteration",
      "innovation-week-10-market-validation",
      "innovation-week-11-startup-financial-planning",
      "innovation-week-12-demo-day-preparation",
    ],
    assignments: [
      {
        title: "Month 3 — Demo Day & final report",
        description: `Provide:

1. **Demo summary** — What you demonstrated, audience reaction, top learnings.
2. **Pitch** — Slides or script (link or attachment).
3. **Final program report** — Reflection on outcomes vs. Month 1 plan; what you would do next.

Upload PDF or ZIP if needed for slides and media.`,
        maxPoints: 100,
        requiredForCompletion: true,
        responseType: "FILE",
      },
    ],
  },
];
