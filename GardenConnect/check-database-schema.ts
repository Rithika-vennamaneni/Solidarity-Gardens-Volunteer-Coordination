/**
 * Database Schema Checker
 * Run this to check if your database has been migrated to V2 schema
 * 
 * Usage: npx tsx check-database-schema.ts
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Check volunteers table columns
    console.log('📋 VOLUNTEERS TABLE:');
    const volunteerColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'volunteers'
      ORDER BY ordinal_position
    `;
    
    console.log('Columns found:');
    volunteerColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const hasAvailability = volunteerColumns.some(col => col.column_name === 'availability');
    const hasOldDays = volunteerColumns.some(col => col.column_name === 'available_days');
    
    console.log(`\n  ✓ Has 'availability' column: ${hasAvailability ? '✅ YES' : '❌ NO'}`);
    console.log(`  ✓ Has old 'available_days' column: ${hasOldDays ? '⚠️  YES (needs migration)' : '✅ NO'}`);

    // Check gardens table columns
    console.log('\n📋 GARDENS TABLE:');
    const gardenColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'gardens'
      ORDER BY ordinal_position
    `;
    
    console.log('Columns found:');
    gardenColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const hasNeedsSchedule = gardenColumns.some(col => col.column_name === 'needs_schedule');
    const hasOldDaysNeeded = gardenColumns.some(col => col.column_name === 'days_needed');
    
    console.log(`\n  ✓ Has 'needs_schedule' column: ${hasNeedsSchedule ? '✅ YES' : '❌ NO'}`);
    console.log(`  ✓ Has old 'days_needed' column: ${hasOldDaysNeeded ? '⚠️  YES (needs migration)' : '✅ NO'}`);

    // Check matches table columns
    console.log('\n📋 MATCHES TABLE:');
    const matchColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'matches'
      ORDER BY ordinal_position
    `;
    
    console.log('Columns found:');
    matchColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const hasMatchDetails = matchColumns.some(col => col.column_name === 'match_details');
    const hasStatus = matchColumns.some(col => col.column_name === 'status');
    
    console.log(`\n  ✓ Has 'match_details' column: ${hasMatchDetails ? '✅ YES' : '❌ NO'}`);
    console.log(`\n  ✓ Has 'status' column: ${hasStatus ? '✅ YES' : '❌ NO'}`);

    // Overall assessment
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCHEMA STATUS:');
    console.log('='.repeat(60));

    if (hasAvailability && hasNeedsSchedule && hasMatchDetails && hasStatus) {
      console.log('✅ Database is FULLY MIGRATED to V2 schema!');
      console.log('\nYou can use the V2 components safely.');
    } else if (!hasAvailability && !hasNeedsSchedule) {
      console.log('❌ Database is NOT MIGRATED - still using V1 schema');
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   1. Run the migration script: database-schema-v2.sql in Neon Console');
      console.log('   2. OR use the old components (revert to V1)');
      console.log('\n   Migration file: GardenConnect/database-schema-v2.sql');
    } else {
      console.log('⚠️  Database is PARTIALLY MIGRATED');
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   Complete the migration by running: database-schema-v2.sql');
    }

    // Check for existing data
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATA COUNT:');
    console.log('='.repeat(60));

    const volunteerCount = await sql`SELECT COUNT(*) as count FROM volunteers`;
    const gardenCount = await sql`SELECT COUNT(*) as count FROM gardens`;
    const matchCount = await sql`SELECT COUNT(*) as count FROM matches`;

    console.log(`Volunteers: ${volunteerCount[0].count}`);
    console.log(`Gardens: ${gardenCount[0].count}`);
    console.log(`Matches: ${matchCount[0].count}`);

    if (volunteerCount[0].count > 0 || gardenCount[0].count > 0) {
      console.log('\n⚠️  You have existing data!');
      console.log('   Make sure to run the data migration part of the script');
      console.log('   to convert old format to new format.');
    }

  } catch (error: any) {
    console.error('\n❌ Error checking schema:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

checkSchema().then(() => {
  console.log('\n✅ Schema check complete!\n');
  process.exit(0);
});
