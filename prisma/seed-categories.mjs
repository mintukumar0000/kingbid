// Seed categories + empty boards. No listings — consent-only per guardrails.

import { PrismaClient } from "@prisma/client";

const LAUNCH_CATEGORIES = [
  { slug: "ai-agents", name: "AI agents & AI tools", description: "Autonomous agents, copilots, and general-purpose AI products." },
  { slug: "ai-coding", name: "AI coding assistants", description: "Dev tools, IDE plugins, and AI pair programmers." },
  { slug: "no-code", name: "No-code / low-code", description: "Visual builders and automation without writing code." },
  { slug: "browser-extensions", name: "Chrome & browser extensions", description: "Extensions for Chrome, Firefox, Safari, and Edge." },
  { slug: "newsletters", name: "Newsletters & creators", description: "Paid and free newsletters, creator brands, and media." },
  { slug: "indie-saas", name: "Indie SaaS", description: "Bootstrapped software businesses and micro-SaaS." },
  { slug: "mobile-apps", name: "Mobile apps", description: "iOS and Android apps from indie studios." },
  { slug: "desktop-apps", name: "Mac & desktop apps", description: "Native desktop software for Mac, Windows, and Linux." },
  { slug: "design", name: "Design tools & studios", description: "Design software, templates, and creative agencies." },
  { slug: "marketing", name: "Marketing & growth", description: "SEO, ads, analytics, and growth automation." },
  { slug: "ecommerce", name: "E-commerce & Shopify apps", description: "Stores, marketplaces, and Shopify ecosystem tools." },
  { slug: "career", name: "Career & job search", description: "Job boards, résumé tools, and hiring products." },
  { slug: "fashion", name: "Fashion & shopping", description: "Retail, try-on tech, and style platforms." },
  { slug: "fitness", name: "Fitness & health", description: "Workout, nutrition, and wellness apps." },
  { slug: "fintech", name: "Finance & fintech", description: "Personal finance, investing, and B2B fintech." },
  { slug: "productivity", name: "Productivity & notes", description: "Task managers, notes, and personal OS tools." },
  { slug: "writing", name: "Writing & content", description: "Writing assistants, CMS, and content workflows." },
  { slug: "video", name: "Video & creator tools", description: "Editing, streaming, and creator monetization." },
  { slug: "open-source", name: "Open-source projects", description: "OSS libraries, tools, and dev infrastructure." },
  { slug: "agencies", name: "Freelancers & agencies", description: "Studios, consultants, and service businesses." },
  { slug: "local-business", name: "Local businesses", description: "City and regional businesses by location." },
  { slug: "trending-lol", name: "Trending .lol projects", description: "Pay-to-rank micro-sites and viral .lol experiments.", isMeta: true },
];

const prisma = new PrismaClient();

async function main() {
  for (const cat of LAUNCH_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        isMeta: cat.isMeta ?? false,
      },
      update: {
        name: cat.name,
        description: cat.description,
        isMeta: cat.isMeta ?? false,
      },
    });

    const existingBoard = await prisma.board.findFirst({
      where: { categoryId: category.id, region: null },
    });
    if (!existingBoard) {
      await prisma.board.create({ data: { categoryId: category.id, region: null } });
    }
  }

  const global = await prisma.board.findFirst({ where: { categoryId: null, region: null } });
  if (!global) await prisma.board.create({ data: { categoryId: null, region: null } });

  console.log(`Seeded ${LAUNCH_CATEGORIES.length} categories with empty boards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
