#!/usr/bin/env node

/**
 * Manual script to run the abandoned streaks cleanup
 * This can be called manually or scheduled with cron
 * 
 * Usage:
 * node run-cleanup.js
 * 
 * For cron scheduling (1st and 16th of every month at 2 AM):
 * 0 2 1,16 * * /usr/bin/node /path/to/run-cleanup.js
 */

const fetch = require('node-fetch');

async function runCleanup() {
  try {
    console.log('Starting abandoned streaks cleanup...');
    console.log('Timestamp:', new Date().toISOString());
    
    // Replace with your actual domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cleanupUrl = `${baseUrl}/api/cleanup/abandoned-streaks`;
    
    const response = await fetch(cleanupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Cleanup completed successfully');
      console.log(`📊 Deleted ${result.deletedCount} abandoned streaks`);
      if (result.errors && result.errors.length > 0) {
        console.log('⚠️  Errors encountered:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.error('❌ Cleanup failed:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Failed to run cleanup:', error.message);
  }
}

runCleanup();
