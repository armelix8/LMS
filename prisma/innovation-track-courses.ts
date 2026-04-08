/**
 * Innovation program Weeks 3–12 — seeded when missing (slug-guarded).
 * Images: /course-assets/innovation-week-NN/*.svg
 */

export type InnovationAssignmentSpec = {
  title: string;
  description: string;
  responseType: "FILE" | "TEXT";
};

export type InnovationLessonSpec = {
  title: string;
  sortOrder: number;
  durationMin: number;
  content: string;
  assignment?: InnovationAssignmentSpec;
};

export type InnovationCourseSpec = {
  slug: string;
  title: string;
  description: string;
  moduleTitle: string;
  lessons: InnovationLessonSpec[];
};

export const INNOVATION_TRACK_COURSES: InnovationCourseSpec[] = [
  {
    slug: "innovation-week-3-design-thinking",
    title: "Design Thinking & Innovation Methods",
    description:
      "Week 3 — Structured innovation for product design: design thinking, human-centered design, ideation, rapid prototyping mindset, personas, journey maps, and solution concept development with concept selection reporting.",
    moduleTitle: "Week 3 — Design Thinking & Innovation Methods",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 15,
        content: `## Week 3

You will learn **structured innovation methods** used in modern product design—moving from empathy and framing to ideation and testable concepts.

### Learning objectives

- Apply a **design thinking** mindset (problem framing, ideation, prototyping, testing).
- Practice **human-centered design**—evidence from people, not only opinions.
- Use **idea generation** methods that improve diversity and volume of options.
- Adopt a **rapid prototyping** mindset: cheap experiments before expensive builds.

### Deliverable

You will produce a **Concept Selection Report** with **three solution concepts**, feasibility and impact evaluation, and a reasoned recommendation.`,
      },
      {
        title: "Frameworks: design thinking, HCD, ideation & prototyping",
        sortOrder: 1,
        durationMin: 45,
        content: `## Core frameworks

![Double diamond — discover, define, develop, deliver](/course-assets/innovation-week-03/design-thinking-double-diamond.svg)

### Design thinking

Commonly described as **empathize → define → ideate → prototype → test**. The double diamond emphasizes **diverging** (explore) and **converging** (decide) at each stage.

### Human-centered design (HCD)

Design serves **real users** in context. Methods include interviews, observation, co-design, and accessibility-aware evaluation. See [Nielsen Norman Group — UX topics](https://www.nngroup.com/articles/) for research-backed articles.

### Idea generation

Use **time-boxed** brainstorms, **Crazy 8s**, **SCAMPER**, and **“How might we…”** prompts. Defer judgment during divergence; cluster and vote during convergence.

### Rapid prototyping mindset

Prototype to **learn**, not only to impress. Favor **paper, clickables, role-play, and low-fidelity models** before CAD or code-heavy builds.

### References

- [IDEO — Design thinking](https://designthinking.ideo.com/)  
- [Stanford d.school resources](https://dschool.stanford.edu/resources)`,
      },
      {
        title: "Toolkits: brainstorming & user journey mapping",
        sortOrder: 2,
        durationMin: 30,
        content: `## Practical toolkits

### Design Thinking Toolkit

Assemble: problem statement, hypothesis list, interview guide, ideation board, prototype log, test protocol. Many teams use **Miro**, **FigJam**, or **Mural** for remote collaboration.

### Brainstorming techniques

- **Brainwriting** — silent idea generation, reduces groupthink.  
- **Round robin** — build on others’ cards.  
- **Constraint cards** — “half the budget,” “no screen,” to force creativity.

### User journey mapping

Map **stages**, **user actions**, **thoughts**, **emotions**, **pain points**, and **opportunities**. Connect to **personas** (next lesson activities).

### References

- [Interaction Design Foundation — Journey mapping](https://www.interaction-design.org/literature/topics/customer-journey-map)  
- [Atlassian — Brainstorming techniques](https://www.atlassian.com/work-management/project-management/brainstorming)`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 60,
        content: `## Apply the methods

### 1. Define user personas

Create **2–3 personas** grounded in real segments (goals, constraints, context). Avoid fictional demographics with no behavioral insight.

### 2. Create user journey maps

Pick **one primary persona** and map their current journey for the problem you address. Highlight **moments of truth** and **failure points**.

### 3. Conduct idea brainstorming sessions

Run at least **one structured session** (60–90 min) with documented output: **30+ raw ideas**, clustered into **5–7 themes**, then **3 candidate solution concepts** for deeper evaluation.

Document photos or exports of boards in your final report appendix.`,
      },
      {
        title: "Assignment: Solution concept development",
        sortOrder: 4,
        durationMin: 120,
        content: `## Submit your Concept Selection Report

Upload **one PDF** (or ZIP) via the assignment below.

### Required

1. **Three distinct solution concepts** (one page each recommended) with sketch or diagram.  
2. **Feasibility** (technical, operational, regulatory touchpoints) and **impact** (user value, differentiation) for each.  
3. **Concept Selection Report** — compare concepts with a simple **scorecard** or **decision matrix**; state **recommended concept** and **why**.

### Quality bar

Evidence-based reasoning, explicit **assumptions**, and **next experiments** for the chosen concept.`,
        assignment: {
          title: "Concept Selection Report",
          description: `Upload **PDF or ZIP** containing:

- **Three solution concepts** (clear labels, visuals encouraged)
- **Evaluation** of feasibility and impact per concept
- **Concept Selection Report** with recommendation and rationale

Include appendix snapshots of journey map / brainstorm if helpful.`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-4-project-planning-feasibility",
    title: "Project Planning & Feasibility",
    description:
      "Week 4 — Convert ideas into structured plans: technical feasibility, roadmaps, resources, risk analysis, milestones, architecture outline, and a Prototype Development Plan / roadmap deliverable.",
    moduleTitle: "Week 4 — Project Planning & Feasibility",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 15,
        content: `## Week 4

You will learn how to turn concepts into **actionable development plans** with realistic **milestones**, **resources**, and **risk awareness**.

### Objectives

- Perform **technical feasibility** analysis at a prototype level.  
- Build a **project roadmap** with measurable milestones.  
- Plan **resources** (people, tools, budget envelope).  
- Apply **risk analysis** and mitigation ideas.  
- Submit a **Prototype Development Plan** with architecture, timeline, and budget estimate.`,
      },
      {
        title: "Feasibility, roadmap, resources & risk",
        sortOrder: 1,
        durationMin: 50,
        content: `## Planning foundations

![Milestone gates on a roadmap](/course-assets/innovation-week-04/project-roadmap-milestones.svg)

### Technical feasibility

Break the concept into **subsystems** (mechanical, electrical, software, supply). For each, note **TRL-style** maturity, **unknowns**, and **spikes** (time-boxed experiments).

### Roadmap

Sequence work into **milestones** with **exit criteria** (demo, test pass, stakeholder review). Avoid fake precision—use **ranges** where uncertainty is high.

### Resource planning

List **roles**, **equipment/lab time**, **BOM rough order of magnitude**, and **external dependencies** (components with long lead times).

### Risk analysis

Use a **risk register**: description, likelihood, impact, mitigation, owner. Include **integration risks** where hardware meets software.

### References

- [PMI — WBS concept overview](https://www.pmi.org/disciplined-agile/process/work-breakdown-structure)  
- [NASA — Technology readiness levels (overview)](https://www.nasa.gov/directorates/somd/small-spacecraft-technology-program/technology-readiness-levels-trl)`,
      },
      {
        title: "Templates & planning artifacts",
        sortOrder: 2,
        durationMin: 25,
        content: `## Templates

### Product development roadmap

Use a **now / next / later** lane or **Gantt-style** milestone view. Link each milestone to **demo artifacts**.

### Project planning

One-page **charter**: goal, scope, non-goals, stakeholders, success metrics, communication rhythm.

### Risk assessment

**5×5 matrix** (likelihood × impact) for prioritization; escalate top risks weekly.

Adapt UNIPOD templates if provided by your instructor.`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 50,
        content: `## Hands-on planning

1. **Define project architecture** — block diagram (hardware/software/data).  
2. **Create development milestones** — at least **4** with dates or week numbers and exit criteria.  
3. **Identify technical components** — sensors, MCU, mechanical interfaces, cloud services—mark **long-lead** items.

Capture outputs for inclusion in your **Prototype Development Roadmap** submission.`,
      },
      {
        title: "Assignment: Prototype Development Plan",
        sortOrder: 4,
        durationMin: 120,
        content: `## Deliverable

Submit **one PDF** covering **technical architecture**, **development timeline**, and **budget estimation** (ranges with assumptions).

Use clear diagrams and tables. Cite major cost drivers.`,
        assignment: {
          title: "Prototype Development Roadmap",
          description: `PDF or ZIP including:

1. **Technical architecture** (block diagram + narrative)
2. **Development timeline** with milestones
3. **Budget estimation** with assumptions (components, tools, services)

Title file clearly with team/project name.`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-5-cad-for-prototyping",
    title: "Computer-Aided Design for Prototyping",
    description:
      "Week 5 — Digital mechanical design: CAD fundamentals, parametric modeling, product design principles, fabrication-ready exports (STL/STEP/drawings). Complements the broader CAD course; focused on enclosure and prototype structure deliverables.",
    moduleTitle: "Week 5 — Computer-Aided Design (CAD)",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 5

Learn to design **physical components digitally** for prototyping: sketches, parametric features, assemblies, and **fabrication-ready exports**.

### Objectives

- Navigate a modern **CAD** workflow.  
- Apply **parametric modeling** and **design intent**.  
- Follow **product design** basics (draft, tolerances, access, assembly).  
- Prepare **STL / STEP / drawings** for shop and documentation.`,
      },
      {
        title: "CAD workflow & parametric modeling",
        sortOrder: 1,
        durationMin: 40,
        content: `## From sketch to solid

![Parametric CAD flow](/course-assets/innovation-week-05/parametric-cad-concept.svg)

### Software options

- **Autodesk Fusion 360** — [Learning hub](https://help.autodesk.com/view/fusion360/ENU/)  
- **Dassault SolidWorks** — [Official learning](https://www.solidworks.com/support/training)  
- **FreeCAD** — [Documentation](https://wiki.freecad.org/)

Pick **one** primary tool for the cohort unless your instructor specifies otherwise.

### Parametric modeling

Constraints (dimensions, equal, tangent) preserve **editability**. Name features and use **parameters** for wall thickness, screw patterns, and PCB keep-outs.

### Design for prototyping

Plan **print orientation**, **tool access**, **split lines** for enclosures, and **clearance** for fasteners and cables.`,
      },
      {
        title: "Drawings, STL & fabrication prep",
        sortOrder: 2,
        durationMin: 35,
        content: `## Documentation & export

### Technical drawings

Include **orthographic views**, **section views** where needed, **critical dimensions**, and **material/finish** notes.

### STL mesh

Check **manifold** geometry, **reasonable triangle count**, and **units** (mm). For FDM, consider **support strategy** in slicer—not only the CAD file.

### STEP / IGES

Use for **CNC**, **vendor quotes**, and **interchange** with other CAD tools.

### Reference

- [Autodesk — STL export tips](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-export-stl)`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 90,
        content: `## Design exercises

Model the following in your CAD tool (simplified geometry acceptable):

1. **Enclosure** for your prototype (lid feature, fasteners or snap-fit sketch).  
2. **Mechanical part** that interfaces with another component (mates/constraints).  
3. **Prototype structure** — frame, bracket, or housing that carries loads or aligns sensors.

Export **STL** for at least one part and produce **one drawing sheet** for review.`,
      },
      {
        title: "Assignment: CAD design submission",
        sortOrder: 4,
        durationMin: 150,
        content: `## Submission

Package **native CAD files** (or STEP assembly) **plus** PDF drawings **plus** STL folder in a **ZIP**, or follow instructor naming conventions.

### Deliverables checklist

- Complete **3D model** (assembly)  
- **Technical drawings** (PDF)  
- **STL** exports for printed/laser/CNC-bound parts`,
        assignment: {
          title: "CAD Design Submission",
          description: `Upload **ZIP** (preferred) or **PDF** if only drawings.

Include: native files or master STEP, STL folder, PDF drawings. README.txt with tool name & version.

Name: TeamName-Week5-CAD.zip`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-6-digital-fabrication",
    title: "Digital Fabrication",
    description:
      "Week 6 — Rapid prototyping with 3D printing, laser cutting, CNC, and material selection; hands-on fabrication and documentation via Prototype Fabrication Report.",
    moduleTitle: "Week 6 — Digital Fabrication",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 6

Operationalize **digital fabrication** for prototypes: process selection, parameters, and **physical validation**.

### Objectives

- Compare **3D printing**, **laser cutting**, and **CNC** for fit, finish, cost, and lead time.  
- Select **materials** for function and safety.  
- Fabricate and **document** first physical artifacts.`,
      },
      {
        title: "Processes & material selection",
        sortOrder: 1,
        durationMin: 40,
        content: `## Fabrication overview

![File to part flow](/course-assets/innovation-week-06/digital-fabrication-flow.svg)

### 3D printing

FDM vs SLA/resin trade-offs: strength, surface, fumes, support. Always follow **UNIPOD safety** from Week 2.

### Laser cutting

Kerf, power/speed, **material allow-list**, and **fire watch** discipline.

### CNC

Workholding, toolpaths, **feeds/speeds** starting points from vendor charts—tune under supervision.

### Materials

Match **environment** (UV, moisture), **mechanical** needs, and **electrical** (insulation, ESD). See [MatWeb](https://www.matweb.com/) for property lookups (verify with supplier datasheets).

### Reference

- [Fab Academy — processes index](https://academy.cba.mit.edu/classes/)`,
      },
      {
        title: "Documentation for fabrication",
        sortOrder: 2,
        durationMin: 20,
        content: `## Record what you built

Log for each part: **machine**, **material**, **key parameters**, **time**, **failures/iterations**, and **photos**. This becomes your **Prototype Fabrication Report** backbone.`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 120,
        content: `## Lab work

1. **Print** first prototype components (FDM or resin per lab).  
2. **Laser cut** panels or structural sheets as designed in Week 5.  
3. **Assemble** basic physical sub-system; note **interference** and **tolerance** learnings.

Photo-document each milestone.`,
      },
      {
        title: "Assignment: Prototype Fabrication Report",
        sortOrder: 4,
        durationMin: 90,
        content: `## Submit documentation

Include **photos** of fabricated parts and a concise **parameter summary**. If parts are large, focus photos on **critical features**.`,
        assignment: {
          title: "Prototype Fabrication Report",
          description: `PDF or ZIP with:

- **Fabrication documentation** (process log, parameters, iterations)
- **Photos** of fabricated parts
- Optional: STL/CAM file names referenced

Clearly label team/project.`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-7-electronics-embedded",
    title: "Electronics & Embedded Systems",
    description:
      "Week 7 — Circuits, sensors, actuators, microcontrollers, power; Arduino/ESP32 ecosystem; breadboard build and Electronics Prototype deliverable (MAKERGATE-style hardware context).",
    moduleTitle: "Week 7 — Electronics & Embedded Systems",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 7

Build **electronic prototypes**: theory-light, practice-heavy introduction suitable for **access control**, **IoT**, and **robotics** style projects.

### Objectives

- Understand **basic electronics** (voltage, current, Ohm’s law intuition, common components).  
- Connect **sensors** and **actuators** safely.  
- Program a **microcontroller** to read inputs and drive outputs.  
- Apply **power management** basics (regulation, current budget).`,
      },
      {
        title: "System building blocks",
        sortOrder: 1,
        durationMin: 40,
        content: `## Architecture

![MCU with sensors, actuators, power](/course-assets/innovation-week-07/embedded-system-blocks.svg)

### Microcontrollers

**Arduino** ecosystem: [Arduino docs](https://docs.arduino.cc/)  
**ESP32** (Wi-Fi/BLE): [Espressif docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)

### Sensors & actuators

Match **voltage levels** (3.3 V vs 5 V logic), use **level shifters** when needed, protect **inductive loads** with flyback where applicable.

### Power

Budget **peak current**, add **decoupling**, respect **battery** charge/discharge safety in lab.

### MAKERGATE / access control context

Typical pattern: **reader input** → **MCU** → **lock driver / relay** → **logging / cloud** (expanded in Week 8).`,
      },
      {
        title: "Tools & prototyping",
        sortOrder: 2,
        durationMin: 25,
        content: `## Learning materials

- **Breadboard prototyping** — clean power rails, short jumpers, ground discipline.  
- **Circuit design** — [KiCad](https://www.kicad.org/) for schematic capture (optional this week).  
- **Programming** — structured **sketch** or **ESP-IDF/Arduino** per instructor.

### References

- [SparkFun — tutorials](https://learn.sparkfun.com/)  
- [Adafruit learning](https://learn.adafruit.com/)`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 100,
        content: `## Build exercises

1. **Basic circuits** on breadboard (LED + resistor, button input).  
2. **Connect a sensor** (e.g. digital or analog) and print stable readings.  
3. **Program MCU** to trigger an **actuator** (LED strip segment, small motor with driver if provided).

Capture **wiring photo** and **serial log** screenshot for your report.`,
      },
      {
        title: "Assignment: Electronics prototype",
        sortOrder: 4,
        durationMin: 120,
        content: `## Deliverable

Demonstrate a **working circuit** aligned with your project direction and provide a **system architecture diagram** (block level).`,
        assignment: {
          title: "Electronics Prototype",
          description: `ZIP or PDF including:

1. **Photo(s)** of working breadboard/prototype
2. **Short video** (optional if upload limits—otherwise link in PDF) OR serial log screenshots
3. **System architecture diagram** (PNG/PDF embedded in report)
4. Brief **README**: pins used, voltage levels, known limitations

TeamName-Week7-Electronics.zip`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-8-software-integration",
    title: "Software Integration",
    description:
      "Week 8 — Integrate embedded firmware with APIs, IoT patterns, and data paths; build toward a working prototype system and integration report with code reference.",
    moduleTitle: "Week 8 — Software Integration",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 8

Connect **hardware** to **software systems**: firmware, connectivity, backend services, and **data visualization**.

### Objectives

- Structure **embedded** code for reliability (state, errors, reconnection).  
- Use **API** patterns (REST/MQTT) appropriately.  
- Understand **IoT** security basics (TLS, keys, device identity).  
- Produce a **System Integration Report** with **working demo** evidence.`,
      },
      {
        title: "Integration architecture",
        sortOrder: 1,
        durationMin: 40,
        content: `## Layers

![Device to cloud stack](/course-assets/innovation-week-08/iot-integration-stack.svg)

### Embedded programming

Modularize **drivers**, **network stack**, and **application logic**. Log structured events for debugging.

### API communication

REST for **request/response**; **MQTT** for telemetry-friendly pub/sub. See [MQTT.org](https://mqtt.org/) for primer.

### IoT basics

Provisioning, **OTA** risks, **least privilege** credentials, secure **OTA** only when instructor approves.

### Data visualization

Choose **one** minimal dashboard (Grafana, custom web, or platform) to show **live or near-live** signals.`,
      },
      {
        title: "References",
        sortOrder: 2,
        durationMin: 20,
        content: `## Further reading

- [OWASP IoT Top 10](https://owasp.org/www-project-internet-of-things/) — threat awareness  
- [Microsoft Azure IoT reference](https://learn.microsoft.com/en-us/azure/iot-fundamentals/) — architecture patterns  
- [JSON Web Tokens — introduction](https://jwt.io/introduction) — if using token-based APIs`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 100,
        content: `## Integration tasks

1. **Integrate hardware and software** — device posts sensor state or events to an endpoint or broker.  
2. **Build a simple control interface** — web page, serial CLI, or mobile tool per instructor.  
3. **Connect sensors to application logic** — threshold alerts, state machine, or access-style event (in/out).

Record **demo script** (30–60 s) steps.`,
      },
      {
        title: "Assignment: System Integration Report",
        sortOrder: 4,
        durationMin: 90,
        content: `## Submission

Include **architecture diagram**, **sequence** of messages, and **link to code repository** inside the PDF (GitHub/GitLab URL with **read access** or instructor-invited repo).`,
        assignment: {
          title: "System Integration Report",
          description: `PDF or ZIP with:

- **System Integration Report** (diagrams, endpoints, auth approach)
- Evidence of **working prototype** (screenshots, short description of demo)
- **Code repository URL** (and branch/tag if relevant)

Do not embed secrets—use .env.example pattern documented in report.`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-9-prototype-iteration",
    title: "Prototype Iteration",
    description:
      "Week 9 — Test-learn loops, user testing, performance tuning; User Testing Report with feedback analysis and design improvements.",
    moduleTitle: "Week 9 — Prototype Iteration",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 9

Improve prototypes using **structured testing** and **rapid iteration**.

### Objectives

- Apply **iteration** discipline (hypothesis → change → measure).  
- Plan **user tests** with tasks and success metrics.  
- **Optimize** performance where it matters (latency, reliability, UX).`,
      },
      {
        title: "Iteration & user testing",
        sortOrder: 1,
        durationMin: 40,
        content: `## Methods

![Build measure learn](/course-assets/innovation-week-09/iterate-test-learn.svg)

### Rapid iteration

Small batches, **version tags**, changelog notes. Prefer **feature flags** or **build variants** when possible.

### User testing

**Task-based** scripts: “Please show how you would…”; avoid leading. Capture **time-on-task**, **errors**, and **quotes**.

### Performance

Define **SLOs** that matter (e.g. door unlock latency, dashboard refresh). Measure before/after changes.

### Reference

- [Nielsen Norman — Usability testing](https://www.nngroup.com/articles/usability-testing-101/)`,
      },
      {
        title: "Synthesis & prioritization",
        sortOrder: 2,
        durationMin: 20,
        content: `## From feedback to backlog

Use **RICE**, **impact/effort**, or **Kano**-style tagging to prioritize fixes vs features. Document **what you deferred** and why.`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 80,
        content: `## Run tests

1. **User testing** session(s) with **at least 3** participants (or per instructor).  
2. **Collect feedback** (notes, recordings if consented).  
3. **Improve prototype** — implement top fixes; document before/after.`,
      },
      {
        title: "Assignment: User Testing Report",
        sortOrder: 4,
        durationMin: 90,
        content: `## Deliverable

**User Testing Report** with **feedback analysis** and **design improvements** summary.`,
        assignment: {
          title: "User Testing Report",
          description: `PDF with:

- Test plan & participant summary
- **Feedback analysis** (themes, severity)
- **Design improvements** implemented or planned (with evidence screenshots)
- Appendix: raw notes optional`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-10-market-validation",
    title: "Market Validation",
    description:
      "Week 10 — Customer validation, pricing experiments, early market tests; 20 customer interviews and Market Validation Report with PMF assessment.",
    moduleTitle: "Week 10 — Market Validation",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 10

Validate whether your prototype **solves a real problem** for a **willing-to-pay** audience.

### Objectives

- Design **customer validation** studies beyond casual feedback.  
- Explore **pricing models** ethically and rigorously.  
- Run **early market tests** (concierge, LOI, pre-order style per policy).`,
      },
      {
        title: "Validation methods",
        sortOrder: 1,
        durationMin: 40,
        content: `## Evidence

![Validation funnel](/course-assets/innovation-week-10/market-validation-funnel.svg)

### Customer validation

Combine **interviews** with **behaviors** (pilots, trials). Track **objections** and **must-have** signals.

### Pricing models

Subscription, usage-based, hardware + service, grants—map **who pays** vs **who benefits**.

### Early market testing

Use **pre-sales**, **letters of intent**, or **paid pilots** only with proper **legal/compliance** guidance from your institution.

### References

- [Lean Startup — validated learning](https://theleanstartup.com/principles)  
- [SaaS pricing — Price Intelligently blog](https://www.priceintelligently.com/blog) (concepts)`,
      },
      {
        title: "Interview discipline",
        sortOrder: 2,
        durationMin: 25,
        content: `## Twenty interviews

Minimum **20 structured conversations** for this week (build on Week 1 skills). Maintain **hypothesis log** and **insight tags**. Summarize **segments** that pull vs push away.`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 120,
        content: `## Field work

1. **Conduct 20 customer interviews** (or adjust per instructor waiver).  
2. **Prototype demonstrations** where feasible—observe reactions.  
3. Update **value proposition** and **pricing hypothesis**.`,
      },
      {
        title: "Assignment: Market Validation Report",
        sortOrder: 4,
        durationMin: 100,
        content: `## Deliverable

**Market Validation Report** with **customer feedback analysis** and **product–market fit assessment** (explicit criteria).`,
        assignment: {
          title: "Market Validation Report",
          description: `PDF with:

- Interview synthesis (N≥20 or noted exception)
- **Customer feedback analysis**
- **Product-market fit assessment** (criteria you used, conclusion, next tests)
- Optional: pricing experiment results`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-11-startup-financial-planning",
    title: "Startup & Financial Planning",
    description:
      "Week 11 — Business model, financial projections, IP awareness, registration paths; Startup Documentation with model, projections, and pitch deck.",
    moduleTitle: "Week 11 — Startup & Financial Planning",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 11

Foundational **startup** skills: how you **create**, **capture**, and **deliver** value—plus **numbers** that hold under questions.

### Objectives

- Develop a coherent **business model**.  
- Build **financial projections** with clear assumptions.  
- Understand **IP** types and when to seek counsel.  
- Map **registration** options at high level (jurisdiction-specific).`,
      },
      {
        title: "Business model & IP",
        sortOrder: 1,
        durationMin: 40,
        content: `## Strategy artifacts

![Business Model Canvas schematic](/course-assets/innovation-week-11/business-model-canvas.svg)

### Business Model Canvas

Use the official canvas from [Strategyzer](https://www.strategyzer.com/canvas/business-model-canvas) in workshops.

### Financial projections

**12–24 month** cash-focused view: revenue drivers, COGS, OPEX, headcount, CAPEX. Run **sensitivity** on top 2–3 assumptions.

### Intellectual property

Patents, trademarks, trade secrets, copyright—**high-level** awareness. See [WIPO](https://www.wipo.int/portal/en/index.html) for global primer; engage **qualified counsel** before filings.

### Startup registration

Structures differ by country (LLC, Ltd, nonprofit, university spinout). Follow **local advisor** guidance.`,
      },
      {
        title: "Templates & ethics",
        sortOrder: 2,
        durationMin: 20,
        content: `## Templates

Use instructor-provided **financial planning spreadsheet** if available. Disclose **assumptions** explicitly—avoid false precision.

Discuss **ethical pricing**, **data privacy**, and **labor** expectations in your narrative.`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 60,
        content: `## Build the pack

1. Complete **Business Model Canvas** digitally.  
2. Fill **financial projection** template (3 scenarios: base, upside, downside).  
3. Draft **pitch deck** outline (10–12 slides) mapping to canvas and financial story.`,
      },
      {
        title: "Assignment: Startup Documentation",
        sortOrder: 4,
        durationMin: 120,
        content: `## Deliverable

ZIP with **PDF business model write-up**, **financial workbook** (xlsx/csv export to PDF summary), and **pitch deck** (PDF or PPTX).`,
        assignment: {
          title: "Startup Documentation",
          description: `ZIP containing:

1. **Business model** (PDF — canvas + narrative)
2. **Financial projections** (spreadsheet + 1-page PDF summary)
3. **Pitch deck** (PDF or PPTX)

No confidential secrets; mark assumptions clearly.`,
          responseType: "FILE",
        },
      },
    ],
  },
  {
    slug: "innovation-week-12-demo-day-preparation",
    title: "Demo Day Preparation",
    description:
      "Week 12 — Pitch craft, storytelling, live demonstration, rehearsals; final submission with prototype evidence, pitch, and program report.",
    moduleTitle: "Week 12 — Demo Day Preparation",
    lessons: [
      {
        title: "Welcome & learning objectives",
        sortOrder: 0,
        durationMin: 12,
        content: `## Week 12

Prepare for **investor- and stakeholder-grade** demonstration.

### Objectives

- Structure a **compelling pitch** (problem, insight, solution, traction, ask).  
- Apply **storytelling** techniques without hype.  
- Design a **reliable product demo** with backups.  
- Complete **final program documentation**.`,
      },
      {
        title: "Pitch, story & demo design",
        sortOrder: 1,
        durationMin: 40,
        content: `## Readiness

![Demo day pillars](/course-assets/innovation-week-12/demo-day-readiness.svg)

### Pitching

Classic flow: **hook** → **problem** → **solution** → **demo** → **business** → **team** → **ask**. Timebox ruthlessly.

### Storytelling

Use **concrete users**, **before/after**, and **one memorable metric**.

### Product demonstration

**Happy path** rehearsed 10+ times. **Fallback** video or screenshots if live risk is high.

### References

- [Sequoia — Writing a business plan (pitch outline)](https://www.sequoiacap.com/article/writing-a-business-plan/)  
- [Y Combinator — Pitch advice](https://www.ycombinator.com/library)`,
      },
      {
        title: "Rehearsal logistics",
        sortOrder: 2,
        durationMin: 25,
        content: `## Run rehearsals

Assign **roles**: presenter, demo operator, Q&A lead. Practice **clock-stops** at 30s intervals. Prepare **two sharp answers** for likely investor questions on risk and competition.`,
      },
      {
        title: "Practical activities",
        sortOrder: 3,
        durationMin: 80,
        content: `## Practice

1. **Pitch rehearsals** with peer feedback forms.  
2. **Demo Day setup** dry run (cables, accounts, offline assets).  
3. **Final polish** on slides and prototype stability.`,
      },
      {
        title: "Assignment: Final demonstration package",
        sortOrder: 4,
        durationMin: 120,
        content: `## Final submission

Package **working prototype evidence**, **final pitch deck**, and **final program report** summarizing the 12-week journey, outcomes, and next steps.`,
        assignment: {
          title: "Final Prototype Demonstration",
          description: `ZIP or separate uploads per instructor:

1. **Working prototype** evidence (photos, short video link in PDF, or live URL with credentials in sealed appendix)
2. **Final pitch presentation** (PDF)
3. **Final program report** (PDF) — retrospective, metrics, learnings, roadmap

Label: TeamName-Week12-Final.zip`,
          responseType: "FILE",
        },
      },
    ],
  },
];
