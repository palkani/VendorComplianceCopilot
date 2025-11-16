import { db } from "./db";
import { documentTypes } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clear existing document types
  await db.execute(sql`TRUNCATE TABLE document_types CASCADE`);

  // Seed document types
  const docTypes = [
    {
      name: "ISO 9001 Certification",
      description: "Quality management system certification",
      applicableCategories: ["Packaging", "Raw Material", "Component Supplier"],
      isRequired: true,
      expiryRequired: true,
      defaultValidityDays: 365,
    },
    {
      name: "Safety Data Sheet (SDS)",
      description: "Material safety data sheet",
      applicableCategories: ["Raw Material", "Component Supplier"],
      isRequired: true,
      expiryRequired: false,
    },
    {
      name: "Insurance Certificate",
      description: "General liability insurance certificate",
      applicableCategories: ["Logistics", "Services"],
      isRequired: true,
      expiryRequired: true,
      defaultValidityDays: 365,
    },
    {
      name: "Environmental Compliance",
      description: "Environmental management certification",
      applicableCategories: ["Packaging", "Raw Material", "Component Supplier"],
      isRequired: false,
      expiryRequired: true,
      defaultValidityDays: 730,
    },
    {
      name: "Carrier License",
      description: "Commercial carrier license",
      applicableCategories: ["Logistics"],
      isRequired: true,
      expiryRequired: true,
      defaultValidityDays: 365,
    },
  ];

  for (const docType of docTypes) {
    await db.insert(documentTypes).values(docType);
  }

  console.log(`Seeded ${docTypes.length} document types`);
  console.log("Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
