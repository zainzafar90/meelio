import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import { Pool } from "pg";

import { users } from "./schema/user.schema";
import { providers } from "./schema/provider.schema";
import { categories } from "./schema/category.schema";

config();

if (!process.env.DB_URL) {
  throw new Error("DB_URL is not set");
}

const NUMBER_OF_USERS = 1;

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

const schema = {
  users,
};

const db = drizzle(pool, {
  schema: {
    users,
    providers,
    categories,
  },
});

async function main() {
  try {
    console.log("🌱 Starting seed process...");

    // await cleanupDatabase(db);

    console.log("🌱 Seeding Initiated...");

    const defaultProviders = [
      {
        name: "meelio",
        displayName: "Meelio",
        enabled: true,
        clientId: "",
        clientSecret: "",
        scopes: [],
        authUrl: "",
        tokenUrl: "",
        userInfoUrl: "",
      },
      {
        name: "googletasks",
        displayName: "Google Tasks",
        enabled: false,
        clientId: "",
        clientSecret: "",
        scopes: ["https://www.googleapis.com/auth/tasks"],
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      },
      {
        name: "todoist",
        displayName: "Todoist",
        enabled: false,
        clientId: "",
        clientSecret: "",
        scopes: ["data:read", "data:write"],
        authUrl: "https://todoist.com/oauth/authorize",
        tokenUrl: "https://todoist.com/oauth/access_token",
        userInfoUrl: "",
      },
    ];

    for (const provider of defaultProviders) {
      await db.insert(providers).values(provider).onConflictDoNothing();
    }
    console.log("✅ Providers seeded:", defaultProviders.length);

    const hashedPassword =
      "$2a$08$1DdxLqST2pLfpcdOZZ.eRuWJ1H/DGD33e8RK5jilXHUICxPXsnJIK"; // securePassword123

    // await seed(db, schema).refine((funcs) => ({
    //   users: {
    //     count: NUMBER_OF_USERS,
    //     columns: {
    //       name: funcs.fullName(),
    //       email: funcs.weightedRandom([
    //         {
    //           value: funcs.default({ defaultValue: "admin@tallymatic.com" }),
    //           weight: 1,
    //         },
    //         {
    //           value: funcs.email(),
    //           weight: 0,
    //         },
    //       ]),
    //       password: funcs.default({ defaultValue: hashedPassword }),
    //       isEmailVerified: funcs.boolean(),
    //       role: funcs.valuesFromArray({ values: ["user"] }),
    //       createdAt: funcs.date({
    //         minDate: "2023-01-01",
    //         maxDate: "2024-12-16",
    //       }),
    //     },
    //   },
    // }));

    const seededUsers = await db.select().from(users);
    console.log("✅ Users seeded:", seededUsers.length);

    const systemCategories = [
      { userId: null, name: "Inbox", icon: "📥", type: "system" },
    ];

    for (const category of systemCategories) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }
    console.log("✅ System categories seeded:", systemCategories.length);

    console.log("✅ All data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    console.log("🌱 Closing database connection...");
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});

// async function cleanupDatabase(db: any) {
//   console.log("🗑️  Cleaning up existing data...");

//   const tables = [
//     { name: "users", schema: users },
//     { name: "providers", schema: providers },
//     { name: "categories", schema: categories },
//   ];

//   try {
//     await db.execute(sql`SET session_replication_role = 'replica'`);

//     for (const table of tables) {
//       try {
//         await db.execute(
//           sql.raw(`TRUNCATE TABLE "${table.name}" RESTART IDENTITY CASCADE`)
//         );
//         console.log(`✓ Cleaned ${table.name}`);
//       } catch (error) {
//         console.log(`ℹ️ Skipping ${table.name} - ${(error as Error).message}`);
//       }
//     }

//     await db.execute(sql`SET session_replication_role = 'origin'`);

//     console.log("✨ Database cleaned");
//   } catch (error) {
//     console.error("Error during cleanup:", error);
//     throw error;
//   }
// }
