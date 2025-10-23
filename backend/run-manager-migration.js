require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Use the original superuser connection for migrations
  const connectionString = process.env.DATABASE_URL_SUPER || process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('Running manager system migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '012_add_manager_system.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Migration already applied (columns exist)');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

