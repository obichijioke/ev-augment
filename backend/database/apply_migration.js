const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Create Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile) {
  try {
    console.log(`Applying migration: ${migrationFile}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, "migrations", migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc("exec_sql", { sql: statement });

          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error);
            console.error("Statement:", statement);
            // Continue with other statements
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err);
          console.error("Statement:", statement);
        }
      }
    }

    console.log(`Migration ${migrationFile} completed`);
  } catch (error) {
    console.error("Error applying migration:", error);
    throw error;
  }
}

// Alternative method using direct SQL execution
async function applyMigrationDirect(migrationFile) {
  try {
    console.log(`Applying migration directly: ${migrationFile}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, "migrations", migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // For direct execution, we'll need to use a PostgreSQL client
    // This is a simplified version - in production, use a proper migration tool
    console.log(
      "Migration SQL loaded. Please execute the following SQL manually in your Supabase SQL editor:"
    );
    console.log("=".repeat(80));
    console.log(migrationSQL);
    console.log("=".repeat(80));
  } catch (error) {
    console.error("Error reading migration:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const migrationFile = process.argv[2] || "002_forum_schema_fixes_safe.sql";

  console.log("Safe Forum Schema Migration Tool");
  console.log("=================================");
  console.log("This migration safely handles existing schema elements.");
  console.log("");

  try {
    // Use direct method since RPC might not be available
    await applyMigrationDirect(migrationFile);

    console.log("\nSafe migration preparation completed!");
    console.log("This migration will:");
    console.log("- Check for existing columns before adding them");
    console.log("- Handle the forum_comments -> forum_replies rename safely");
    console.log("- Create new tables only if they don't exist");
    console.log("- Add indexes only if they don't exist");
    console.log("");
    console.log(
      "Please copy the SQL above and execute it in your Supabase SQL editor."
    );
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { applyMigration, applyMigrationDirect };
