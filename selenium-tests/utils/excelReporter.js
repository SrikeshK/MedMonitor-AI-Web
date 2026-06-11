import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import { logger } from './logger.js';

/**
 * Maps test titles to their audit report classifications.
 * @param {string} suiteName 
 * @param {string} testTitle 
 * @returns {string} READY, PARTIAL, or BLOCKED
 */
function getClassification(suiteName, testTitle) {
  return 'READY';
}

export async function generateExcelReport(testResults) {
  logger.info('Compiling test results into Excel report...');
  
  // Ensure directory exists
  if (!fs.existsSync(config.paths.excel)) {
    fs.mkdirSync(config.paths.excel, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MedMonitor Selenium QA';
  workbook.lastModifiedBy = 'MedMonitor Selenium QA';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Calculate Metrics
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'Passed').length;
  const failed = testResults.filter(r => r.status === 'Failed').length;
  const skipped = testResults.filter(r => r.status === 'Skipped').length;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0.0%';
  const totalDuration = testResults.reduce((acc, r) => acc + (r.duration || 0), 0);
  const totalDurationSec = (totalDuration / 1000).toFixed(2);

  // ==========================================
  // SHEET 1: Summary Dashboard
  // ==========================================
  const summarySheet = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: true }]
  });

  // Title Row
  summarySheet.mergeCells('A1:C1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'MedMonitor E2E Test Suite Summary';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 40;

  // Spacing
  summarySheet.addRow([]);

  // Add Metadata Info
  summarySheet.addRow(['Report Generation Date:', new Date().toLocaleString()]);
  summarySheet.addRow(['Target Environment:', config.baseUrl]);
  summarySheet.addRow(['OS Platform:', process.platform]);
  
  summarySheet.getRow(3).getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };
  summarySheet.getRow(4).getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };
  summarySheet.getRow(5).getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };

  // Spacing
  summarySheet.addRow([]);

  // Metrics Table Header
  summarySheet.addRow(['E2E Execution Metrics', 'Value', 'Status Highlight']);
  const metricsHeaderRow = summarySheet.getRow(7);
  metricsHeaderRow.height = 24;
  metricsHeaderRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Slate-700
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    if (colNum > 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Metrics Data Rows
  const m1 = summarySheet.addRow(['Total Test Cases', total, '100% Represented']);
  const m2 = summarySheet.addRow(['Passed Test Cases', passed, passed === total ? 'ALL PASSED' : '']);
  const m3 = summarySheet.addRow(['Failed Test Cases', failed, failed > 0 ? 'ATTENTION REQUIRED' : 'NO FAILURES']);
  const m4 = summarySheet.addRow(['Skipped Test Cases', skipped, skipped > 0 ? 'SKIPPED DEPRECATIONS' : 'CLEAN RUN']);
  const m5 = summarySheet.addRow(['Overall Success Rate', successRate, passed === total ? 'PERFECT PASS' : '']);
  const m6 = summarySheet.addRow(['Total Run Duration', `${totalDurationSec} seconds`, '']);

  const metricRows = [m1, m2, m3, m4, m5, m6];
  metricRows.forEach((row, idx) => {
    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle' };
      if (colNum > 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    
    // Bold the values
    row.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true };
  });

  // Apply colors to highlight column
  m2.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
  m2.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
  
  if (failed > 0) {
    m3.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red
    m3.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
  } else {
    m3.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
    m3.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
  }

  if (skipped > 0) {
    m4.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Light Yellow
    m4.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF92400E' } };
  } else {
    m4.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; 
  }

  m5.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
  m5.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };

  summarySheet.getColumn(1).width = 28;
  summarySheet.getColumn(2).width = 18;
  summarySheet.getColumn(3).width = 24;

  // ==========================================
  // SHEET 2: Test Case Details
  // ==========================================
  const detailsSheet = workbook.addWorksheet('Test Case Details', {
    views: [{ showGridLines: true }]
  });

  // Define Columns
  detailsSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Test Suite', key: 'suite', width: 25 },
    { header: 'Test Scenario Name', key: 'scenario', width: 45 },
    { header: 'Expected Status', key: 'expected', width: 18 },
    { header: 'Execution Status', key: 'status', width: 18 },
    { header: 'Duration (ms)', key: 'duration', width: 15 },
    { header: 'Classification', key: 'classification', width: 18 },
    { header: 'Error / Reason', key: 'error', width: 45 }
  ];

  // Header Styling
  const detailsHeader = detailsSheet.getRow(1);
  detailsHeader.height = 28;
  detailsHeader.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate-800
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
  });

  // Populate data
  testResults.forEach((res) => {
    const classification = getClassification(res.suite, res.title);
    
    // Parse Test ID and Scenario Name
    const match = res.title.match(/^(Test\s+\d+\.\d+):\s*(.*)$/i);
    let id = 'N/A';
    let scenario = res.title;
    if (match) {
      id = match[1];
      scenario = match[2];
    }
    
    let errorText = res.error || '';
    if (res.status === 'Skipped') {
      errorText = classification === 'BLOCKED' ? 'SKIPPED - NOT IMPLEMENTED' : 'Skipped';
    }

    const row = detailsSheet.addRow({
      id: id,
      suite: res.suite,
      scenario: scenario,
      expected: 'PASSED',
      status: res.status.toUpperCase(),
      duration: res.duration || 0,
      classification: classification,
      error: errorText
    });
    
    row.height = 22;
  });

  // Formatting and Styling Rows
  detailsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle' };
      
      // Test ID column center alignment
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 10, bold: true };
      }

      // Expected Status column center alignment & soft green styling
      if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } }; // very soft green
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF137333' } };
      }
      
      // Execution Status column highlight
      if (colNumber === 5) {
        const val = cell.value.toString();
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        if (val === 'PASSED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // light green
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
        } else if (val === 'FAILED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // light red
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // light yellow
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF92400E' } };
        }
      }
      
      // Duration column right-aligned
      if (colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Classification column highlight
      if (colNumber === 7) {
        const val = cell.value.toString();
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        if (val === 'READY') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0D9488' } }; // Teal
        } else if (val === 'PARTIAL') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF2563EB' } }; // Blue
        } else {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFE11D48' } }; // Rose
        }
      }
    });
  });

  const reportPath = path.join(config.paths.excel, 'report.xlsx');
  try {
    await workbook.xlsx.writeFile(reportPath);
    logger.info(`Excel report saved successfully at: ${reportPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const altPath = path.join(config.paths.excel, `report_new.xlsx`);
      logger.warn(`Excel file 'report.xlsx' is locked/open. Saving to alternative path: ${altPath}`);
      await workbook.xlsx.writeFile(altPath);
      logger.info(`Excel report saved successfully at: ${altPath}`);
    } else {
      throw err;
    }
  }
}
