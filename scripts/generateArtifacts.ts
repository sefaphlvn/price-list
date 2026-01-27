/**
 * Generate Artifacts Script
 * Runs after data collection to generate derived data files
 *
 * Usage: npx tsx scripts/generateArtifacts.ts
 */

import { generateLatest } from './lib/generators/latest';
import { generateSearchIndex } from './lib/generators/searchIndex';
import { generateStats } from './lib/generators/stats';
import { generateInsights } from './lib/generators/insights';
import { generateEvents } from './lib/generators/events';
import { generateArchitecture } from './lib/generators/architecture';
import { generateGaps } from './lib/generators/gaps';
import { generatePromos } from './lib/generators/promos';
import { generateLifecycle } from './lib/generators/lifecycle';

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Generate Artifacts');
  console.log('='.repeat(60));
  console.log('');

  const startTime = Date.now();
  const results: { name: string; success: boolean; error?: string }[] = [];

  // Generate latest.json
  try {
    await generateLatest();
    results.push({ name: 'latest.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateLatest] Error:', msg);
    results.push({ name: 'latest.json', success: false, error: msg });
  }
  console.log('');

  // Generate search-index.json
  try {
    await generateSearchIndex();
    results.push({ name: 'search-index.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateSearchIndex] Error:', msg);
    results.push({ name: 'search-index.json', success: false, error: msg });
  }
  console.log('');

  // Generate stats/precomputed.json
  try {
    await generateStats();
    results.push({ name: 'stats/precomputed.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateStats] Error:', msg);
    results.push({ name: 'stats/precomputed.json', success: false, error: msg });
  }
  console.log('');

  // Generate insights
  try {
    await generateInsights();
    results.push({ name: 'insights/latest.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateInsights] Error:', msg);
    results.push({ name: 'insights/latest.json', success: false, error: msg });
  }
  console.log('');

  // Generate events (Intel Mode)
  try {
    await generateEvents();
    results.push({ name: 'intel/events.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateEvents] Error:', msg);
    results.push({ name: 'intel/events.json', success: false, error: msg });
  }
  console.log('');

  // Generate architecture (Intel Mode)
  try {
    await generateArchitecture();
    results.push({ name: 'intel/architecture.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateArchitecture] Error:', msg);
    results.push({ name: 'intel/architecture.json', success: false, error: msg });
  }
  console.log('');

  // Generate gaps (Intel Mode)
  try {
    await generateGaps();
    results.push({ name: 'intel/gaps.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateGaps] Error:', msg);
    results.push({ name: 'intel/gaps.json', success: false, error: msg });
  }
  console.log('');

  // Generate promos (Intel Mode)
  try {
    await generatePromos();
    results.push({ name: 'intel/promos.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generatePromos] Error:', msg);
    results.push({ name: 'intel/promos.json', success: false, error: msg });
  }
  console.log('');

  // Generate lifecycle (Intel Mode)
  try {
    await generateLifecycle();
    results.push({ name: 'intel/lifecycle.json', success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[generateLifecycle] Error:', msg);
    results.push({ name: 'intel/lifecycle.json', success: false, error: msg });
  }
  console.log('');

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Time: ${elapsed}s`);
  console.log(`Total: ${results.length} artifacts`);
  console.log(`Success: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed artifacts:');
    failed.forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }

  // Exit with error code if any artifact failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
