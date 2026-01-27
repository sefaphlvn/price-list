/**
 * Data Health Check Script
 * Validates collected data and generates a health report
 *
 * Usage: npx tsx scripts/healthCheck.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface IndexData {
  lastUpdated: string;
  brands: {
    [brandId: string]: {
      name: string;
      availableDates: string[];
      latestDate: string;
      totalRecords: number;
    };
  };
}

interface StoredData {
  collectedAt: string;
  brand: string;
  brandId: string;
  rowCount: number;
  rows: any[];
}

interface HealthReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'error';
  summary: {
    totalBrands: number;
    totalVehicles: number;
    lastUpdate: string;
    dataDate: string;
  };
  brands: {
    id: string;
    name: string;
    status: 'ok' | 'warning' | 'error';
    vehicleCount: number;
    latestDate: string;
    issues: string[];
  }[];
  issues: string[];
  warnings: string[];
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Data Health Check');
  console.log('='.repeat(60));
  console.log('');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    summary: {
      totalBrands: 0,
      totalVehicles: 0,
      lastUpdate: '',
      dataDate: '',
    },
    brands: [],
    issues: [],
    warnings: [],
  };

  // Check if index exists
  if (!fs.existsSync(indexPath)) {
    report.status = 'error';
    report.issues.push('index.json not found');
    outputReport(report);
    process.exit(1);
  }

  const index: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  report.summary.lastUpdate = index.lastUpdated;

  const brandIds = Object.keys(index.brands);
  report.summary.totalBrands = brandIds.length;

  if (brandIds.length === 0) {
    report.status = 'error';
    report.issues.push('No brands found in index');
    outputReport(report);
    process.exit(1);
  }

  let latestDate = '';
  let totalVehicles = 0;

  for (const brandId of brandIds) {
    const brandInfo = index.brands[brandId];
    const brandReport = {
      id: brandId,
      name: brandInfo.name,
      status: 'ok' as 'ok' | 'warning' | 'error',
      vehicleCount: 0,
      latestDate: brandInfo.latestDate,
      issues: [] as string[],
    };

    console.log(`[${brandInfo.name}]`);

    // Check if latest data file exists
    const [year, month, day] = brandInfo.latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      brandReport.status = 'error';
      brandReport.issues.push(`Data file not found: ${filePath}`);
      report.issues.push(`${brandInfo.name}: Data file not found`);
    } else {
      const storedData: StoredData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      brandReport.vehicleCount = storedData.rowCount;
      totalVehicles += storedData.rowCount;

      // Check for empty data
      if (storedData.rowCount === 0) {
        brandReport.status = 'warning';
        brandReport.issues.push('No vehicles in data file');
        report.warnings.push(`${brandInfo.name}: No vehicles`);
      }

      // Check for price anomalies
      const prices = storedData.rows
        .map((r: any) => r.priceNumeric)
        .filter((p: number) => p > 0);

      if (prices.length > 0) {
        const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Warning if min price is suspiciously low
        if (minPrice < 100000) {
          brandReport.issues.push(`Suspiciously low price: ${minPrice}`);
          report.warnings.push(`${brandInfo.name}: Suspiciously low price (${minPrice})`);
          if (brandReport.status === 'ok') brandReport.status = 'warning';
        }

        // Warning if max price is suspiciously high
        if (maxPrice > 50000000) {
          brandReport.issues.push(`Suspiciously high price: ${maxPrice}`);
          report.warnings.push(`${brandInfo.name}: Suspiciously high price (${maxPrice})`);
          if (brandReport.status === 'ok') brandReport.status = 'warning';
        }

        console.log(`  Vehicles: ${brandReport.vehicleCount}`);
        console.log(`  Price range: ${minPrice.toLocaleString('tr-TR')} - ${maxPrice.toLocaleString('tr-TR')}`);
        console.log(`  Average: ${Math.round(avgPrice).toLocaleString('tr-TR')}`);
      }

      // Check for missing fields
      const missingFields = storedData.rows.filter((r: any) =>
        !r.model || !r.priceNumeric || r.priceNumeric === 0
      );
      if (missingFields.length > 0) {
        brandReport.issues.push(`${missingFields.length} rows with missing data`);
        report.warnings.push(`${brandInfo.name}: ${missingFields.length} rows with missing data`);
        if (brandReport.status === 'ok') brandReport.status = 'warning';
      }
    }

    if (brandReport.issues.length > 0) {
      console.log(`  Issues: ${brandReport.issues.join(', ')}`);
    } else {
      console.log('  Status: OK');
    }

    // Track latest date across all brands
    if (!latestDate || brandInfo.latestDate > latestDate) {
      latestDate = brandInfo.latestDate;
    }

    report.brands.push(brandReport);
    console.log('');
  }

  report.summary.totalVehicles = totalVehicles;
  report.summary.dataDate = latestDate;

  // Determine overall status
  if (report.issues.length > 0) {
    report.status = 'error';
  } else if (report.warnings.length > 0) {
    report.status = 'warning';
  }

  // Check if data is stale (more than 2 days old)
  const latestDateObj = new Date(latestDate);
  const daysSinceUpdate = Math.floor((Date.now() - latestDateObj.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate > 2) {
    report.warnings.push(`Data is ${daysSinceUpdate} days old`);
    if (report.status === 'healthy') report.status = 'warning';
  }

  outputReport(report);

  // Save health report
  const reportPath = path.join(dataDir, 'health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Health report saved to ${reportPath}`);

  // Exit with appropriate code
  if (report.status === 'error') {
    process.exit(1);
  }
}

function outputReport(report: HealthReport): void {
  console.log('='.repeat(60));
  console.log('Health Report');
  console.log('='.repeat(60));
  console.log(`Status: ${report.status.toUpperCase()}`);
  console.log(`Brands: ${report.summary.totalBrands}`);
  console.log(`Vehicles: ${report.summary.totalVehicles}`);
  console.log(`Data Date: ${report.summary.dataDate}`);

  if (report.issues.length > 0) {
    console.log('\nIssues:');
    report.issues.forEach(i => console.log(`  - ${i}`));
  }

  if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    report.warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
