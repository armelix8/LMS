import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { isDatabaseUnavailableError } from "../lib/database-error";
import { seedInnovationTrackCourses } from "./seed-innovation-track";
import { seedPDPProgram } from "./seed-pdp-program";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@unipod.local" },
    update: { password, role: "ADMIN" },
    create: {
      email: "admin@unipod.local",
      name: "Platform Admin",
      password,
      role: "ADMIN",
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@unipod.local" },
    update: { password, role: "INSTRUCTOR" },
    create: {
      email: "instructor@unipod.local",
      name: "Demo Instructor",
      password,
      role: "INSTRUCTOR",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@unipod.local" },
    update: { password, role: "STUDENT" },
    create: {
      email: "student@unipod.local",
      name: "Demo Student",
      password,
      role: "STUDENT",
    },
  });

  const existing = await prisma.course.findFirst({
    where: { slug: "introduction-to-unipod-learn" },
  });

  if (!existing) {
    const course = await prisma.course.create({
      data: {
        title: "Introduction to UNIPOD Learn",
        slug: "introduction-to-unipod-learn",
        description:
          "A sample published course with modules, lessons, and Markdown content. Use the demo student account to enroll and track progress.",
        published: true,
        instructorId: instructor.id,
        modules: {
          create: [
            {
              title: "Getting started",
              sortOrder: 0,
              lessons: {
                create: [
                  {
                    title: "How this LMS works",
                    sortOrder: 0,
                    durationMin: 8,
                    content: `## Welcome

This platform uses **Next.js**, **PostgreSQL**, **Prisma**, and **NextAuth** with JWT sessions.

### What you can do

- Browse the **course catalog**
- **Enroll** with one click
- Mark lessons **complete** and see progress on your dashboard

> Tip: Instructors create modules and lessons from the instructor console.`,
                  },
                  {
                    title: "Your learning path",
                    sortOrder: 1,
                    durationMin: 5,
                    content: `Lessons are grouped into **modules**. Complete them in order or jump via the sidebar.

Use **Mark complete** to record progress—your dashboard summarizes completion across all enrolled courses.`,
                  },
                ],
              },
            },
            {
              title: "Going deeper",
              sortOrder: 1,
              lessons: {
                create: [
                  {
                    title: "Extending the platform",
                    sortOrder: 0,
                    durationMin: 12,
                    content: `## Next steps for your team

- Add **quizzes** or **assignments** with new Prisma models
- Integrate **SCORM** or **LTI** if you need external tools
- Connect an **S3-compatible** bucket for video uploads

\`\`\`bash
npm run db:seed
\`\`\`

Run the seed anytime to refresh demo accounts (passwords reset).`,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId: student.id, courseId: course.id },
      },
      create: {
        userId: student.id,
        courseId: course.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });
  }

  const cadSlug = "computer-aided-design";
  const existingCad = await prisma.course.findFirst({
    where: { slug: cadSlug },
  });

  if (!existingCad) {
    const cadCourse = await prisma.course.create({
      data: {
        title: "Computer-Aided Design",
        slug: cadSlug,
        description:
          "Professional introduction to CAD for engineering and digital fabrication: 2D/3D modeling, constraints, exports, and design-to-part workflow. Inspired by themes from MIT’s FAB Academy Computer Design class (https://academy.cba.mit.edu/classes/computer_design/index.html). Includes video lessons, diagrams, a graded quiz, and written assignments.",
        published: true,
        instructorId: instructor.id,
        modules: {
          create: [
            {
              title: "Foundations",
              sortOrder: 0,
              lessons: {
                create: [
                  {
                    title: "Introduction to computer-aided design",
                    sortOrder: 0,
                    durationMin: 22,
                    videoUrl:
                      "https://www.youtube.com/embed/J1jDc2rTJlg",
                    content: `## What CAD does for you

**Computer-aided design (CAD)** is how you author precise geometry, capture design intent with dimensions and constraints, and produce files that CAM tools, slicers, and drawing rooms can consume.

This course aligns with ideas from MIT’s Center for Bits and Atoms [Computer Design class](https://academy.cba.mit.edu/classes/computer_design/index.html)—from digital representation through fabrication-aware modeling.

### Raster vs vector in practice

![Diagram comparing raster pixels and smooth vector curves](/course-assets/computer-aided-design/cad-vector-vs-raster.png)

- Use **vector** workflows (sketches, paths, solids) when you need scalable geometry and clean exports (DXF, STEP, etc.).
- Use **raster** imagery when the goal is texture, photos, or pixel-based engraving—and control **resolution** and physical size explicitly.

### Learning outcomes

By the end of this module you will be able to explain the role of CAD in a typical **design → export → machine** pipeline and choose appropriate representations for a given process.`,
                    quiz: {
                      create: {
                        title: "Check-in: CAD representations",
                        passPercent: 70,
                        requiredForCompletion: true,
                        questions: {
                          create: [
                            {
                              prompt:
                                "Which representation scales to any size without losing edge sharpness for laser or vinyl cutting?",
                              sortOrder: 0,
                              options: {
                                create: [
                                  {
                                    text: "Vector paths defined by curves and lines",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "A high-resolution JPEG photograph",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "A plain text README file",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "A CSV spreadsheet of measurements only",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "What is the primary purpose of parametric constraints in a 2D CAD sketch?",
                              sortOrder: 1,
                              options: {
                                create: [
                                  {
                                    text: "Lock design intent so edits stay consistent (e.g. tangency, equal length)",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Increase the file size for archival purposes",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "Replace the need for any dimensions",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "Disable exporting to DXF or STEP",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "Which file type is most commonly associated with triangular mesh geometry for 3D printing?",
                              sortOrder: 2,
                              options: {
                                create: [
                                  {
                                    text: "STL (stereolithography mesh)",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "MP3 audio",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "DOCX document",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "GIF animation only",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    title: "Sketches, planes, and units",
                    sortOrder: 1,
                    durationMin: 18,
                    content: `## Working cleanly in 3D CAD

Most solid modelers start from **sketches on planes** (front, top, custom construction planes). Consistent **units** (mm vs inches) and **origin** placement prevent expensive mistakes at the machine.

### Good habits

- Name sketches and bodies when the model grows.
- Avoid “floating” geometry—anchor the first sketch to the origin when possible.
- Document **material thickness** and **stock size** in the model properties or a companion note.`,
                  },
                ],
              },
            },
            {
              title: "2D CAD and manufacturing data",
              sortOrder: 1,
              lessons: {
                create: [
                  {
                    title: "Parametric 2D sketches",
                    sortOrder: 0,
                    durationMin: 28,
                    videoUrl:
                      "https://www.youtube.com/embed/mMUhsZXn7Es",
                    content: `## Dimensions and constraints

Parametric sketches combine **geometry** with **constraints** (parallel, perpendicular, tangent, equal) and **driven dimensions**. Changing one dimension should update the whole profile predictably.

![Example parametric sketch with dimensions and constraints](/course-assets/computer-aided-design/cad-parametric-sketch.png)

### Fabrication checks

Before exporting a 2D profile:

- Close all contours meant to be cut as loops.
- Remove duplicate edges and zero-length segments.
- Match **inside vs outside** of the toolpath to your intended part (especially with kerf compensation).`,
                  },
                  {
                    title: "Exports and the path to the machine",
                    sortOrder: 1,
                    durationMin: 20,
                    content: `## From CAD file to G-code or laser jobs

Your CAD package exports neutral geometry; **CAM**, **nesting**, or **slicer** software turns that into machine-specific instructions.

![Design to part pipeline: CAD → export → CAM/slicer → machine → part](/course-assets/computer-aided-design/cad-design-to-part-pipeline.png)

### Common interchange formats

| Context | Typical formats |
|--------|-----------------|
| 2D cutting / drafting | DXF, SVG, PDF (vector) |
| 3D printing | STL, 3MF |
| Engineering handoff | STEP, IGES |

Always keep the **native CAD file** (e.g. .f3d, .sldprt) as the source of truth.`,
                    assignments: {
                      create: [
                        {
                          title: "Describe your design-to-machine workflow",
                          sortOrder: 0,
                          maxPoints: 100,
                          requiredForCompletion: false,
                          responseType: "TEXT",
                          description: `In **150–300 words**, outline the steps you would take to go from a finished 2D CAD profile to a laser-cut or CNC-routed part. Mention at least: export format, one software step after CAD, and one physical setup step (fixturing, zeroing, or material).

This is not graded for “correct” software choice—focus on clarity and sequence.`,
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: "3D solid modeling",
              sortOrder: 2,
              lessons: {
                create: [
                  {
                    title: "Solids, features, and design intent",
                    sortOrder: 0,
                    durationMin: 26,
                    videoUrl:
                      "https://www.youtube.com/embed/ONGrkeC13nA",
                    content: `## Feature-based modeling

**Extrude**, **revolve**, **sweep**, and **loft** build solids from sketches. The **history tree** (or timeline) records intent—editing an early sketch should propagate when the model is well built.

### Design for additive or subtractive

- **Additive (3D printing):** mind overhangs, minimum feature size, and build orientation.
- **Subtractive (milling):** think in terms of reachable faces and tool diameter.`,
                  },
                  {
                    title: "Meshes, solids, and when to use each",
                    sortOrder: 1,
                    durationMin: 16,
                    content: `## Meshes vs B-rep

**Boundary representation (B-rep)** solids preserve precise faces and are ideal for engineering change. **Meshes** approximate surfaces with triangles—standard for slicers but poor for tight tolerances unless carefully controlled.

Convert to mesh only when the downstream tool requires it, and use an appropriate **tolerance** (chord height / angular deviation).`,
                    quiz: {
                      create: {
                        title: "3D representations quick quiz",
                        passPercent: 70,
                        requiredForCompletion: false,
                        questions: {
                          create: [
                            {
                              prompt:
                                "Which statement best describes a watertight manifold mesh for FDM printing?",
                              sortOrder: 0,
                              options: {
                                create: [
                                  {
                                    text: "A closed volume with consistent face orientation and no holes in the surface",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Any PNG heightmap image",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "A single open surface with no thickness",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "A Word document with dimensions typed in",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "Why keep the native CAD file, not only STL exports?",
                              sortOrder: 1,
                              options: {
                                create: [
                                  {
                                    text: "To preserve parametric history and enable controlled design changes",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Because STL files are always larger and therefore better",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "Native files cannot be edited, so they are safer",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "STEP files cannot be opened in any CAD tool",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
            {
              title: "Drawings, revision, and practice",
              sortOrder: 3,
              lessons: {
                create: [
                  {
                    title: "Engineering drawings and revision control",
                    sortOrder: 0,
                    durationMin: 14,
                    content: `## Communicating beyond the model

**Drawings** still matter: orthographic views, sections, datums, tolerances, and a **title block** tie the CAD model to inspection and procurement.

### Revision hygiene

Use revision tables or version tags (Rev A, B…) and record **what changed** and **why**. Your shop and your future self depend on traceability.`,
                  },
                  {
                    title: "Course reflection: CAD in your projects",
                    sortOrder: 1,
                    durationMin: 12,
                    content: `## Apply the workflow

You now have a structured picture of CAD for both **documentation** and **fabrication**. Pick one real or hypothetical part (a bracket, enclosure, or fixture) and mentally walk through: sketch → solid → export → machine → inspection.

Submit the short assignment below when ready.`,
                    assignments: {
                      create: [
                        {
                          title: "CAD reflection brief",
                          sortOrder: 0,
                          maxPoints: 100,
                          requiredForCompletion: false,
                          responseType: "TEXT",
                          description: `**Brief (150–250 words):** Describe one part you would model in CAD for a digital fabrication lab. Include: (1) main 2D sketch elements or 3D features you would use, (2) which export format you would send to the machine and why, and (3) one tolerance or fit concern you would watch for.

Optional: link to the [MIT CBA Computer Design class page](https://academy.cba.mit.edu/classes/computer_design/index.html) for extra reading.`,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId: student.id, courseId: cadCourse.id },
      },
      create: {
        userId: student.id,
        courseId: cadCourse.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });
  }

  const discoverySlug = "problem-discovery-market-research-week-1";
  const existingDiscovery = await prisma.course.findFirst({
    where: { slug: discoverySlug },
  });

  if (!existingDiscovery) {
    const discoveryCourse = await prisma.course.create({
      data: {
        title: "Problem Discovery & Market Research",
        slug: discoverySlug,
        description:
          "Week 1 of a professional innovation curriculum. Learners identify real-world problems, validate market need, and apply customer discovery methods. Covers innovation ecosystems, problem framing, market research, value propositions, and culminates in a graded Customer Discovery Report with structured deliverables.",
        published: true,
        instructorId: instructor.id,
        modules: {
          create: [
            {
              title: "Week 1 — Problem Discovery & Market Research",
              sortOrder: 0,
              lessons: {
                create: [
                  {
                    title: "Welcome & learning objectives",
                    sortOrder: 0,
                    durationMin: 15,
                    content: `## Purpose of this week

You will learn how to **identify real-world problems** and **validate whether your ideas address genuine market needs**—before investing heavily in solutions.

### Learning objectives

By the end of Week 1 you should be able to:

- Describe how innovation ecosystems connect entrepreneurs, institutions, capital, and users.
- Apply structured techniques to surface and frame problems worth solving.
- Plan and execute **market research** and **customer discovery** activities.
- Articulate a clear **value proposition** grounded in evidence.
- Produce a **Customer Discovery Report** with documented interviews and market insight.

### How to succeed

Work through the lessons in order. Complete the **practical activities** as you go—they feed directly into your final assignment. Block time for **at least ten customer interviews**; quality of insight matters more than perfect polish.`,
                  },
                  {
                    title: "Introduction to Innovation Ecosystems",
                    sortOrder: 1,
                    durationMin: 25,
                    content: `## What is an innovation ecosystem?

An **innovation ecosystem** is the network of actors, resources, and institutions that shape how ideas become products, services, or ventures. It typically includes:

- **Universities and research labs** — knowledge creation and talent.
- **Industry and startups** — execution, scaling, and market feedback.
- **Government and policy** — regulation, funding, and infrastructure.
- **Investors and support organizations** — capital, mentorship, accelerators.
- **Customers and communities** — demand, legitimacy, and use cases.

### Why it matters for you

Understanding your ecosystem helps you find **partners**, **funding paths**, **talent**, and **early adopters**. It also explains *why* some regions or sectors move faster than others—and where your idea might fit.

### Reflection

Identify **three stakeholders** in your local or sector ecosystem who could influence your problem space. Note whether they are primarily sources of **insight**, **resources**, or **distribution**.`,
                  },
                  {
                    title: "Problem Identification Techniques",
                    sortOrder: 2,
                    durationMin: 30,
                    content: `## From vague frustration to a sharp problem statement

Strong ventures start with **problems that are painful, frequent, and valuable to solve**. Weak ideas often skip this step.

### Techniques you can use

1. **Jobs-to-be-done framing** — What progress is the user trying to make? What forces push or pull them away from current options?
2. **5 Whys** — Trace symptoms down to root causes; avoid stopping at the first plausible answer.
3. **Stakeholder mapping** — Who experiences the pain, who pays, who blocks, who benefits?
4. **Observation and contextual inquiry** — Watch work happen in context; note workarounds and hacks.
5. **Problem canvas (lightweight)** — Capture context, trigger, desired outcome, and obstacles in one view.

### Quality checks

A useful problem statement is **specific**, **evidence-seeking** (not opinion), and **free of embedded solutions**. Compare:

- Weak: “People need a better app.”
- Stronger: “Small shop owners spend 6+ hours weekly reconciling cash and mobile payments because their tools don’t export in one format.”

### Your next step

Draft **two alternative problem statements** for the same situation. Pick the one that is easiest to validate with interviews.`,
                  },
                  {
                    title: "Market Research Fundamentals",
                    sortOrder: 3,
                    durationMin: 35,
                    content: `## Market research in early-stage discovery

**Market research** helps you estimate **who** the market is, **how big** it might be, **how it segments**, and **what alternatives** already exist. At this stage, favor **directional truth** over false precision.

### Primary vs secondary research

- **Secondary** — industry reports, public data, competitor websites, patents, news, academic papers. Fast and cheap; watch for bias and age of data.
- **Primary** — interviews, surveys, experiments. Slower but closest to ground truth for *your* context.

### Core questions

- **Market size (TAM/SAM/SOM)** — rough ranges are fine early on.
- **Segments** — who buys first? who is underserved?
- **Competitive landscape** — direct, indirect, and “do nothing” alternatives.
- **Trends and regulation** — what could accelerate or kill demand?

### Toolkit mindset

Use a simple **research log**: source, date, claim, confidence (high/medium/low), and implication for your hypothesis. You will reuse this in your **Market Landscape Analysis** deliverable.`,
                  },
                  {
                    title: "Customer Discovery Methodology",
                    sortOrder: 4,
                    durationMin: 40,
                    content: `## Talking to customers without selling

**Customer discovery** is structured learning—not a pitch. Your goal is to **test hypotheses** about problems, behaviors, and willingness to adopt change.

### Interview principles

- **Hypotheses first** — What do you believe, and what would prove you wrong?
- **Open questions** — “Tell me about the last time…” beats “Would you use…?”
- **Listen > talk** — aim for them to speak most of the time.
- **No leading** — avoid putting words in their mouth.
- **Ethics** — consent, privacy, honest purpose; especially if recording.

### After each interview

Capture: **role/context**, **pain points**, **current solutions**, **workarounds**, **quotes**, and **surprises**. Tag insights as **supports**, **contradicts**, or **neutral** relative to your hypotheses.

### The assignment bar

For the **Customer Discovery Report**, you will conduct **ten customer interviews** minimum, document **problem statements**, and map **current solutions**. Treat this lesson as your field guide for how those conversations should run.`,
                  },
                  {
                    title: "Value Proposition Design",
                    sortOrder: 5,
                    durationMin: 30,
                    content: `## Connecting insight to a credible promise

A **value proposition** explains **which customers** you serve, **which jobs** you help them get done, and **why your approach** is preferable to alternatives—backed by discovery evidence.

### Useful structures

- **For [segment]** who **[need or constraint]**, our **[offer]** provides **[key benefit]** unlike **[alternatives]** because **[reason to believe]**.
- **Value proposition canvas** — pains, gains, and jobs on one side; pain relievers and gain creators on the other. **Only fill the right side after** you have interview evidence.

### Common mistakes

- Leading with features instead of **outcomes**.
- Targeting “everyone.”
- Ignoring **switching costs** and **status quo** (“doing nothing” is often your real competitor).

### Deliverable link

Your report will include a **Problem Definition Document** and **Market Landscape Analysis**; bring them together here in a **one-page value proposition** you could show to a mentor or investor.`,
                  },
                  {
                    title: "Learning materials & reference frameworks",
                    sortOrder: 6,
                    durationMin: 20,
                    content: `## Curated references for this week

Use these as **lenses**, not checklists to complete blindly. Adapt language to your sector and region.

### Core readings & ideas

- **Lean Startup methodology** — Build–Measure–Learn; emphasize **validated learning** over activity for its own sake.
- **Customer discovery framework** — Hypotheses, interviews, synthesis, pivot or persevere.
- **Market research toolkit** — Secondary sources, competitor scans, sizing estimates, segmentation hypotheses.
- **Problem–solution fit canvas** — Align problem evidence, proposed solution, and riskiest assumptions before scaling effort.

### Suggested workflow

1. Frame hypotheses and **segment** your early adopters.
2. Run parallel **secondary** scan and **primary** interviews.
3. Update canvases weekly; **kill or revise** weak assumptions quickly.

> Tip: Keep a single **insight repository** (document or board) so your final report writes faster.`,
                  },
                  {
                    title: "Practical activities",
                    sortOrder: 7,
                    durationMin: 120,
                    content: `## Apply the week’s concepts

Complete these activities before submitting your **Customer Discovery Report**. They are designed to produce artifacts you can paste or attach in your deliverables.

### Activity 1 — Stakeholder mapping

Identify **all relevant stakeholders** for your problem space: users, buyers, influencers, regulators, partners. Note **interest** (high/low) and **influence** (high/low). Decide **who to interview first**.

### Activity 2 — Target customer segment

Write a **one-paragraph segment definition**: situation, constraints, behaviors, and why this group feels the pain acutely. Avoid demographics alone; add **context and triggers**.

### Activity 3 — Competitor & alternative scan

List **direct competitors**, **indirect alternatives**, and **non-consumption / workarounds**. For each, capture what job they serve and their **weak points** (from public sources plus interviews where possible).

### Activity 4 — Initial problem validation interviews

Before your full set of ten interviews, run **2–3 pilot conversations** to refine your script and hypotheses. Adjust your questions based on what felt vague or biased.

### Checklist before the assignment

- [ ] Interview guide and consent approach ready  
- [ ] Research log started  
- [ ] Updated problem statement after pilots  
- [ ] Plan for reaching ten interviews`,
                  },
                  {
                    title: "Assignment: Customer Discovery Report",
                    sortOrder: 8,
                    durationMin: 180,
                    content: `## Summative assessment

Submit your work using the **assignment panel below** (file upload). Package your deliverables in **one PDF or ZIP** unless your instructor specifies otherwise.

### Required work

1. **Ten (10) customer interviews** minimum — include dates, roles (anonymized if needed), and synthesized themes (not raw transcripts required unless asked).
2. **Documented problem statements** — show evolution from early guesses to evidence-backed wording.
3. **Current solutions in the market** — map what people use today and why it falls short.

### Deliverables inside your submission

| Deliverable | What to include |
|-------------|-----------------|
| **Problem Definition Document** | Context, stakeholders, evidence quotes, refined problem statement, assumptions & risks |
| **Market Landscape Analysis** | Segments, competitors/alternatives, rough sizing, trends, regulatory notes if relevant |
| **Customer Discovery Report** | Interview summary, insights vs hypotheses, value proposition draft, recommended next experiments |

### Quality expectations

Write for a **professional reviewer**: clear headings, concise synthesis, and explicit **sources of evidence**. Cite whether claims come from **interviews**, **secondary data**, or **observation**.

When your file is uploaded, your instructor will review and approve it before you can mark this lesson complete (if required for completion is enabled).`,
                    assignments: {
                      create: [
                        {
                          sortOrder: 0,
                          title: "Customer Discovery Report",
                          description: `Submit **one PDF or ZIP** containing:

**1. Customer Discovery Report (main narrative)**  
- Evidence from **at least 10 customer interviews** (synthesis + optional appendix)  
- **Problem statements** before and after discovery  
- **Current solutions** in the market and gaps  

**2. Problem Definition Document**  
- Stakeholder map summary, context, and a sharp problem statement  

**3. Market Landscape Analysis**  
- Segments, competitors and alternatives, trends, and implications  

Use clear section headings. Anonymize participants as needed. If you reference external data, include citations or links in an appendix.`,
                          maxPoints: 100,
                          requiredForCompletion: true,
                          responseType: "FILE",
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: discoveryCourse.id,
        },
      },
      create: {
        userId: student.id,
        courseId: discoveryCourse.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });
  }

  const makerspaceSlug = "makerspace-orientation-safety-week-2";
  const existingMakerspace = await prisma.course.findFirst({
    where: { slug: makerspaceSlug },
  });

  if (!existingMakerspace) {
    const makerspaceCourse = await prisma.course.create({
      data: {
        title: "Makerspace Orientation & Safety",
        slug: makerspaceSlug,
        description:
          "Week 2 — UNIPOD labs and fabrication equipment. Build operational knowledge of lab zones, safety procedures, equipment families (3D printing, laser, CNC, electronics, hand tools), booking workflows, and complete Lab Safety Certification (quiz + compliance documentation). Includes diagrams, external references, and supervised demonstration checklist.",
        published: true,
        instructorId: instructor.id,
        modules: {
          create: [
            {
              title: "Week 2 — Makerspace Orientation & Safety",
              sortOrder: 0,
              lessons: {
                create: [
                  {
                    title: "Welcome & learning objectives",
                    sortOrder: 0,
                    durationMin: 15,
                    content: `## Week 2 focus

You will gain **operational knowledge** of the UNIPOD labs and fabrication equipment so you can work **safely**, **confidently**, and in line with **local standard operating procedures (SOPs)**.

### Learning objectives

By the end of this week you should be able to:

- Navigate the **UNIPOD lab layout** and understand zone purposes (intake, digital fab, bench, electronics, storage).
- Apply core **safety procedures**: PPE, housekeeping, incident reporting, and emergency response at a conceptual level—then **confirm details on site** with staff.
- Follow **equipment usage guidelines** for additive, subtractive, electronics, and hand-tool workflows.
- Describe a typical **design → prepare → run → inspect** fabrication path.
- Complete **Lab Safety Certification**: pass the **safety quiz** and submit **safety compliance documentation** as directed.

### Important

This online module **does not replace** in-person induction, supervised demonstrations, or signed approvals from UNIPOD staff. **Always follow posted signage and instructor authority** in the physical lab.`,
                  },
                  {
                    title: "UNIPOD lab orientation",
                    sortOrder: 1,
                    durationMin: 25,
                    content: `## Knowing your way around

Every makerspace is slightly different; UNIPOD may combine **induction**, **digital fabrication**, **bench work**, **electronics**, and **materials storage** in a layout tuned to local building codes and workflows.

### Conceptual zone map

The diagram below is **illustrative**—use it to learn typical **functions** of areas you will see on a tour. Your site may label zones differently.

![Conceptual map of lab zones: intake, digital fabrication, bench, electronics, storage](/course-assets/makerspace-orientation-week-2/lab-zones-map.svg)

### On your lab tour, confirm

- **Exits**, **fire equipment**, **first aid**, and **eyewash** (if installed) locations  
- **Machine supervision rules** (who must be present, booking windows)  
- **Waste streams** (resin, swarf, batteries, general recycling)  
- **Where to report** faults, near-misses, and injuries  

### Reference

- [Fab Foundation](https://fabfoundation.org/) — global fab lab network context  
- [MIT Center for Bits and Atoms — Academy classes](https://academy.cba.mit.edu/classes/) — fabrication education themes`,
                  },
                  {
                    title: "Safety procedures",
                    sortOrder: 2,
                    durationMin: 35,
                    content: `## Safety is procedural

Safety is not a one-time briefing—it is **repeated practice**: correct PPE, disciplined machine use, clean aisles, and honest reporting when something goes wrong.

### PPE layers (task-dependent)

![PPE layers: eyes, hearing, hands, clothing — illustrative](/course-assets/makerspace-orientation-week-2/safety-ppe-layers.svg)

Match PPE to **machine SOP** and **material** (e.g. laser vs CNC vs soldering). If unsure, **ask staff** before starting.

### Housekeeping

- Clear **trip hazards**; keep cables and air lines managed.  
- Return tools to **designated storage**; label in-progress work if policy allows.  
- **No food or drink** at sensitive benches if your lab prohibits it.  

### Incidents & near-misses

Report **immediately** so the lab can mitigate recurrence. A near-miss is valuable data—not blame.

### External references (general education)

- [U.S. OSHA — Young workers / safety basics](https://www.osha.gov/youngworkers)  
- [UK HSE — woodworking & workshop hazards (concepts)](https://www.hse.gov.uk/woodworking/index.htm)  
- [CCOHS — machine guarding concepts](https://www.ccohs.ca/oshanswers/safety_haz/guarding.html)  

> These links support **general awareness**. UNIPOD’s **local rules** always take precedence.`,
                  },
                  {
                    title: "Equipment usage guidelines",
                    sortOrder: 3,
                    durationMin: 40,
                    content: `## Using equipment responsibly

**No self-authorization:** you use a machine only after **training**, **booking** (if required), and **SOP acknowledgment** per UNIPOD policy.

### Cross-cutting rules

1. **Read the SOP** for the specific model in front of you—not a generic YouTube video.  
2. **Inspect** the machine: damage, loose fasteners, debris in laser bed, CNC workholding, printer nozzle condition.  
3. **Never bypass** interlocks, enclosures, or exhaust unless an authorized maintenance procedure says otherwise.  
4. **Stay with** equipment during critical operations unless your lab explicitly allows unattended prints with fire monitoring.  
5. **Shut down** cleanly: homing where needed, vacuums off, materials stored, log entry if your lab uses a logbook.  

### By family (high level)

| Family | Primary risks | Mindset |
|--------|----------------|---------|
| **3D printing** | Burns, entanglement, fumes/resin | Monitor; respect hot ends and beds |
| **Laser** | Fire, fumes, beam / reflection | Approved materials only; watch cut |
| **CNC** | Entanglement, ejection, noise | Secure workpiece; correct feeds/speeds |
| **Electronics** | Shock, ESD damage, solder fume | Power discipline; ventilation |
| **Hand tools** | Cuts, slips | Sharp control; stable workholding |

### Learning materials on site

Manufacturer PDFs, quick-start cards, and **equipment-specific checklists** should be available at UNIPOD—locate them during your tour.`,
                  },
                  {
                    title: "Introduction to fabrication workflows",
                    sortOrder: 4,
                    durationMin: 25,
                    content: `## From idea to physical part

Most digital fabrication follows a **chain of decisions**: what you are making, with what material, on which machine, under which risk controls.

### Workflow overview

![Design to fabrication workflow: brief, design, setup, supervised run, inspect](/course-assets/makerspace-orientation-week-2/fabrication-workflow.svg)

### Practical meaning

- **Brief & risk check** — size, material, time, skill level, supervision.  
- **Design / CAM** — correct units, kerf compensation (laser), toolpaths (CNC), slicer settings (3D).  
- **Material & setup** — stock thickness verified, fixtures tight, zero/reference correct.  
- **Supervised machine run** — stay alert; know pause/stop.  
- **Inspect & log** — dimensional check, surface finish, document lessons learned.  

### Reference

- [Fab Academy — class index](https://academy.cba.mit.edu/classes/) for deeper fabrication modules when you progress beyond orientation.`,
                  },
                  {
                    title: "Learning materials & systems",
                    sortOrder: 5,
                    durationMin: 20,
                    content: `## What to read before you touch machines

### Makerspace safety handbook

UNIPOD should provide a **local safety handbook** (PDF or printed). If you have not received it, request it from lab administration. It normally covers:

- Authorized users and escalation paths  
- PPE matrices per zone  
- Emergency procedures and contacts  
- Waste and chemical handling (if applicable)  

### Equipment manuals

Use **manufacturer manuals** for the **exact model** installed (firmware, maintenance intervals, consumables). Keep a shortcut folder or QR codes at each station if your lab uses them.

### Lab booking system training

Book time so teams do not collide and machines stay supervised. **Use your institution’s official booking tool**—ask staff for the link or walkthrough.

> Replace this paragraph with your live link when available: e.g. internal portal or shared calendar labeled “UNIPOD Lab Booking.”

### Supplementary reading

- [Fab Foundation — resources](https://fabfoundation.org/resources/)  
- [NIOSH — 3D printing emissions (research context)](https://www.cdc.gov/niosh/topics/3dprinting/default.html)`,
                  },
                  {
                    title: "Practical activities — equipment demonstrations",
                    sortOrder: 6,
                    durationMin: 120,
                    content: `## Supervised demonstrations

Complete these **in the physical lab** with authorized UNIPOD staff. This lesson records what you should **observe** and **practice**; competency sign-off follows local policy.

### Overview by equipment family

![Equipment families: 3D printers, laser and CNC, electronics, hand tools](/course-assets/makerspace-orientation-week-2/equipment-families.svg)

### 3D printers

Observe: loading filament/resin, bed prep, start/pause/stop, cool-down, basic fault indicators.  
Practice: supervised first-layer check or equivalent per SOP.

### Laser cutters

Observe: exhaust/enclosure, material allow-list, job origin, fire watch expectations.  
Practice: supervised test cut on approved scrap.

### CNC machines

Observe: workholding, spindle start sequence, feed hold, chip management.  
Practice: **no** hands near spindle; demonstrate clamp inspection checklist verbally with staff.

### Electronics lab

Observe: ESD bench rules, soldering station setup, fume routing, PSU current limiting.  
Practice: continuity check on a de-energized practice board if provided.

### Hand tools & bench fabrication

Observe: marking, sawing, filing, drilling, clamping—**body position** and **sharp edge** control.  
Practice: measure-mark-cut sequence on practice stock under supervision.

### Record for your certification

Keep brief **notes** (date, station, staff initials if required) to attach or reference in your **Safety compliance certification** submission in the next lesson.`,
                  },
                  {
                    title: "Lab Safety Certification",
                    sortOrder: 7,
                    durationMin: 45,
                    content: `## Final certification for Week 2

To complete this course you must:

1. **Pass the safety quiz** below (multiple choice; **80%** required).  
2. **Submit documentation** for **Safety compliance certification** (file upload)—typically a **signed UNIPOD form**, scan of **instructor sign-off**, or **PDF checklist** your lab defines.  
3. Demonstrations of **proper equipment handling** are completed **in person**; your uploaded document should confirm **staff attestation** or **checklist completion** per UNIPOD policy.

### Deliverables (in your uploaded file)

- Evidence of **safety compliance certification** (template provided by UNIPOD).  
- Optional appendix: **demonstration log** (dates, equipment families, staff initials).

If you are unsure which template to use, ask your instructor **before** uploading.

---

Use the **Start quiz** / quiz panel in the lesson UI, then use the **assignment** section to upload your certification file.`,
                    quiz: {
                      create: {
                        title: "UNIPOD lab safety quiz",
                        passPercent: 80,
                        requiredForCompletion: true,
                        questions: {
                          create: [
                            {
                              prompt:
                                "Before operating any CNC or laser equipment for the first time at UNIPOD, what is always required?",
                              sortOrder: 0,
                              options: {
                                create: [
                                  {
                                    text: "Authorized training and adherence to the machine-specific SOP",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Only watching an online video at home",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "A signed waiver with no supervised induction",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "Permission from any other student in the room",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "You notice a small fire in the laser bed area. What is the best first response?",
                              sortOrder: 1,
                              options: {
                                create: [
                                  {
                                    text: "Follow UNIPOD emergency procedure: alert others, use trained response (extinguisher/stop), evacuate if needed",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Open the enclosure wide to air it out before telling anyone",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "Leave the building without notifying staff",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "Pour water generously over the machine interior",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "Why should loose clothing, jewelry, or long untied hair be controlled around rotating machinery?",
                              sortOrder: 2,
                              options: {
                                create: [
                                  {
                                    text: "They can be caught by spindles or moving parts, causing severe entanglement injuries",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "They mainly affect the color of the finished part",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "They are only a concern for woodworking, not CNC",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "They improve machine accuracy",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "When soldering or using flux with fume potential, what is the preferred approach?",
                              sortOrder: 3,
                              options: {
                                create: [
                                  {
                                    text: "Use local exhaust / fume extraction per lab SOP and position your breathing zone away from the plume",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Work as close as possible to inhale detail for quality control",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "Disable any fan to keep components hot longer",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "Only solder outdoors regardless of policy",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "A near-miss occurs (almost injury, no harm). What should you do?",
                              sortOrder: 4,
                              options: {
                                create: [
                                  {
                                    text: "Report it promptly to UNIPOD staff so risks can be mitigated",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Ignore it if nobody was hurt",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "Only tell classmates in a group chat",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "Wait until the end of the semester",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                            {
                              prompt:
                                "For 3D printing, when is leaving equipment unattended acceptable?",
                              sortOrder: 5,
                              options: {
                                create: [
                                  {
                                    text: "Only when explicitly allowed by UNIPOD SOP and any fire-monitoring requirements are met",
                                    isCorrect: true,
                                    sortOrder: 0,
                                  },
                                  {
                                    text: "Whenever the first layer looks good",
                                    isCorrect: false,
                                    sortOrder: 1,
                                  },
                                  {
                                    text: "Never — all printers must always be watched by two people",
                                    isCorrect: false,
                                    sortOrder: 2,
                                  },
                                  {
                                    text: "Only on weekends regardless of policy",
                                    isCorrect: false,
                                    sortOrder: 3,
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                    assignments: {
                      create: [
                        {
                          sortOrder: 0,
                          title: "Safety compliance certification",
                          description: `Upload **one PDF** (or ZIP if multiple scans) that includes:

**1. Safety compliance certification**  
Use the **official UNIPOD template** (signed PDF, or instructor/staff sign-off scan). If no template exists yet, include a **one-page letter** from authorized staff confirming you completed induction and supervised demonstrations for Week 2.

**2. Demonstration attestation (brief)**  
List **equipment families** you were demonstrated (3D printer, laser, CNC, electronics, hand tools) with **dates** and **staff initials** if your lab requires them.

**3. Optional**  
Photo of completed **PPE / housekeeping checklist** if issued separately.

Files must be legible. Instructor approval is required before this lesson can be marked complete.`,
                          maxPoints: 100,
                          requiredForCompletion: true,
                          responseType: "FILE",
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: makerspaceCourse.id,
        },
      },
      create: {
        userId: student.id,
        courseId: makerspaceCourse.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });
  }

  const demoLabName = "UNIPOD Digital Fabrication Lab";
  const demoLabLocation = "UNIPOD Campus - Building A";
  let demoLab = await prisma.lab.findFirst({
    where: { name: demoLabName, location: demoLabLocation },
  });
  if (!demoLab) {
    demoLab = await prisma.lab.create({
      data: {
        name: demoLabName,
        description:
          "Demo lab space for fabrication workflows, prototyping, and safety training.",
        location: demoLabLocation,
        capacity: 30,
        labType: "THREE_D_PRINTING",
        status: "ACTIVE",
      },
    });
  }

  const demoFacilities = [
    {
      name: "3D Printing Workstation A",
      type: "3D Printer",
      availabilityStatus: "AVAILABLE" as const,
      usageRules:
        "Use only after orientation. PLA/PETG only. Booking required for print jobs over 2 hours.",
    },
    {
      name: "Laser Cutting Bay 1",
      type: "Laser Cutter",
      availabilityStatus: "AVAILABLE" as const,
      usageRules:
        "Approved materials only. Operator must remain present during active cuts.",
    },
    {
      name: "Electronics Bench E-02",
      type: "Electronics Bench",
      availabilityStatus: "AVAILABLE" as const,
      usageRules:
        "Observe ESD policy and keep bench clear after use. Shared tools must be returned.",
    },
  ];

  for (const facility of demoFacilities) {
    const existing = await prisma.facility.findFirst({
      where: { labId: demoLab.id, name: facility.name },
    });
    if (!existing) {
      await prisma.facility.create({
        data: {
          labId: demoLab.id,
          name: facility.name,
          type: facility.type,
          availabilityStatus: facility.availabilityStatus,
          usageRules: facility.usageRules,
        },
      });
    }
  }

  const demoEquipment = [
    {
      name: "Prusa i3 MK4 - Unit 01",
      category: "3D Printer",
      brand: "Prusa",
      model: "i3 MK4",
      serialNumber: "UPD-PRUSA-MK4-01",
      condition: "Good",
      status: "AVAILABLE" as const,
      description: "FDM printer for rapid prototype production.",
    },
    {
      name: "OMTech CO2 Laser 60W",
      category: "Laser Cutter",
      brand: "OMTech",
      model: "60W CO2",
      serialNumber: "UPD-LASER-60W-01",
      condition: "Good",
      status: "AVAILABLE" as const,
      description: "CO2 laser cutter for acrylic, wood, and cardboard projects.",
    },
  ];

  for (const equipment of demoEquipment) {
    const existing = await prisma.equipment.findFirst({
      where: { serialNumber: equipment.serialNumber },
    });
    if (!existing) {
      await prisma.equipment.create({
        data: {
          labId: demoLab.id,
          name: equipment.name,
          category: equipment.category,
          brand: equipment.brand,
          model: equipment.model,
          serialNumber: equipment.serialNumber,
          condition: equipment.condition,
          status: equipment.status,
          description: equipment.description,
        },
      });
    }
  }

  await seedInnovationTrackCourses(prisma, instructor.id, student.id);
  await seedPDPProgram(prisma);

  console.log("Seed complete.");
  console.log("  admin@unipod.local / instructor@unipod.local / student@unipod.local");
  console.log("  Password: ChangeMe123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    if (isDatabaseUnavailableError(e)) {
      console.error(
        "\nCannot reach PostgreSQL. Check DATABASE_URL in .env (VPN, firewall, or server down).\n",
      );
      console.error("Local database with Docker:");
      console.error("  docker compose up -d");
      console.error("Set DATABASE_URL to:");
      console.error(
        '  postgresql://unipod:unipod@localhost:5432/unipod?schema=public',
      );
      console.error("Then apply schema and seed:");
      console.error("  npx prisma migrate deploy");
      console.error("  npm run db:seed\n");
      console.error("(Use `npx prisma db push` instead of migrate if you have no migrations yet.)\n");
    } else {
      console.error(e);
    }
    void prisma.$disconnect();
    process.exit(1);
  });
