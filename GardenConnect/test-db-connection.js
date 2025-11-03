// Quick database connection test
// Run with: node test-db-connection.js

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    console.log('   Make sure you have a .env file with DATABASE_URL set');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found');
  console.log('   URL:', process.env.DATABASE_URL.substring(0, 40) + '...\n');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test 1: Basic connection
    console.log('📡 Test 1: Basic connection...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connection successful!');
    console.log('   Server time:', result[0].current_time, '\n');
    
    // Test 2: Check if tables exist
    console.log('📋 Test 2: Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found!');
      console.log('   You need to run the database-schema.sql script');
      console.log('   Go to: https://console.neon.tech/ → SQL Editor\n');
    } else {
      console.log('✅ Found', tables.length, 'tables:');
      tables.forEach(t => console.log('   -', t.table_name));
      console.log('');
    }
    
    // Test 3: Check volunteers table
    const hasVolunteers = tables.some(t => t.table_name === 'volunteers');
    if (hasVolunteers) {
      console.log('👥 Test 3: Checking volunteers table...');
      const volunteers = await sql`SELECT COUNT(*) as count FROM volunteers`;
      console.log('✅ Volunteers table exists');
      console.log('   Total volunteers:', volunteers[0].count);
      
      if (volunteers[0].count > 0) {
        const recent = await sql`
          SELECT id, name, email, created_at 
          FROM volunteers 
          ORDER BY created_at DESC 
          LIMIT 3
        `;
        console.log('   Recent volunteers:');
        recent.forEach(v => {
          console.log(`   - ${v.name} (${v.email}) - ${v.created_at}`);
        });
      }
      console.log('');
    } else {
      console.log('❌ Test 3: volunteers table NOT FOUND');
      console.log('   Run database-schema.sql to create tables\n');
    }
    
    // Test 4: Check gardens table
    const hasGardens = tables.some(t => t.table_name === 'gardens');
    if (hasGardens) {
      console.log('🌱 Test 4: Checking gardens table...');
      const gardens = await sql`SELECT COUNT(*) as count FROM gardens`;
      console.log('✅ Gardens table exists');
      console.log('   Total gardens:', gardens[0].count, '\n');
    } else {
      console.log('❌ Test 4: gardens table NOT FOUND');
      console.log('   Run database-schema.sql to create tables\n');
    }
    
    // Test 5: Check matches table
    const hasMatches = tables.some(t => t.table_name === 'matches');
    if (hasMatches) {
      console.log('🔗 Test 5: Checking matches table...');
      const matches = await sql`SELECT COUNT(*) as count FROM matches`;
      console.log('✅ Matches table exists');
      console.log('   Total matches:', matches[0].count, '\n');
    } else {
      console.log('❌ Test 5: matches table NOT FOUND');
      console.log('   Run database-schema.sql to create tables\n');
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Database connection: ✅ Working');
    console.log('Tables found:', tables.length);
    console.log('volunteers table:', hasVolunteers ? '✅' : '❌');
    console.log('gardens table:', hasGardens ? '✅' : '❌');
    console.log('matches table:', hasMatches ? '✅' : '❌');
    
    if (!hasVolunteers || !hasGardens || !hasMatches) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('1. Go to: https://console.neon.tech/');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of database-schema.sql');
      console.log('5. Click "Run" to create the tables');
    } else {
      console.log('\n✅ All systems ready!');
      console.log('You can now run: npm run dev');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your DATABASE_URL is correct');
    console.log('2. Make sure your Neon database is active');
    console.log('3. Check your internet connection');
    console.log('4. Verify the database exists in Neon dashboard\n');
    process.exit(1);
  }
}

testConnection();
