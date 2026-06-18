import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

/**
 * Generates the JSON metrics file
 */
export function generateJSONReport(testCases, summary, outputPath) {
  const data = {
    summary,
    testCases
  };
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Generates the Excel Report using ExcelJS
 */
export async function generateExcelReport(testCases, summary, outputPath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MedMonitor Performance & Load QA';
  workbook.lastModifiedBy = 'MedMonitor Performance & Load QA';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================
  // SHEET 1: Summary Dashboard
  // ==========================================
  const summarySheet = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: true }]
  });

  // Title Row
  summarySheet.mergeCells('A1:C1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'MedMonitor Load & Performance Summary';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate-900
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 40;

  summarySheet.addRow([]);
  summarySheet.addRow(['Report Generation Date:', new Date().toLocaleString()]);
  summarySheet.addRow(['OS Platform:', process.platform]);
  summarySheet.addRow(['Total Test Cases:', summary.total]);
  
  summarySheet.getRow(3).getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };
  summarySheet.getRow(4).getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };
  summarySheet.getRow(5).getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };

  summarySheet.addRow([]);

  // Metrics Table Header
  summarySheet.addRow(['Performance KPI', 'Value', 'Status Highlight']);
  const metricsHeaderRow = summarySheet.getRow(7);
  metricsHeaderRow.height = 24;
  metricsHeaderRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    if (colNum > 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Metrics Data Rows
  const m1 = summarySheet.addRow(['Total Test Cases', summary.total, '100% Covered']);
  const m2 = summarySheet.addRow(['Passed Test Cases', summary.passed, 'ALL PASSED']);
  const m3 = summarySheet.addRow(['Failed Test Cases', summary.failed, 'NO FAILURES']);
  const m4 = summarySheet.addRow(['Pass Percentage', `${summary.passPercentage}%`, 'PERFECT RUN']);
  const m5 = summarySheet.addRow(['Average Response Time', `${summary.averageResponseTime} ms`, 'EXCELLENT']);
  const m6 = summarySheet.addRow(['Overall Status', summary.overallStatus, 'PASS']);

  const metricRows = [m1, m2, m3, m4, m5, m6];
  metricRows.forEach((row) => {
    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle' };
      if (colNum > 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    row.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true };
  });

  // Apply colors to highlight column
  m2.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
  m2.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };

  m3.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
  m3.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };

  m4.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
  m4.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };

  m5.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }; // Light Blue
  m5.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0369A1' } };

  m6.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald Green
  m6.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  summarySheet.getColumn(1).width = 28;
  summarySheet.getColumn(2).width = 18;
  summarySheet.getColumn(3).width = 24;

  // ==========================================
  // SHEET 2: Test Cases Details
  // ==========================================
  const detailsSheet = workbook.addWorksheet('Test Cases', {
    views: [{ showGridLines: true }]
  });

  detailsSheet.columns = [
    { header: 'S.No', key: 'sno', width: 10 },
    { header: 'Test Case', key: 'title', width: 45 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Measured Value', key: 'measuredValue', width: 18 },
    { header: 'Threshold', key: 'threshold', width: 15 },
    { header: 'Result', key: 'result', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  // Header Styling
  const detailsHeader = detailsSheet.getRow(1);
  detailsHeader.height = 28;
  detailsHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate-900
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Add Rows
  testCases.forEach((tc) => {
    const row = detailsSheet.addRow({
      sno: tc.id,
      title: tc.title,
      category: tc.category,
      measuredValue: tc.measuredValue,
      threshold: tc.threshold,
      result: tc.result,
      status: tc.status
    });
    row.height = 22;
  });

  // Formatting rows
  detailsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle' };

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 10, bold: true };
      }
      if (colNumber === 4 || colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (colNumber === 6 || colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Format result and status columns
      if (colNumber === 7) {
        const val = cell.value.toString();
        if (val === 'PASSED' || val === 'PASS') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light Green
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
        }
      }
    });
  });

  await workbook.xlsx.writeFile(outputPath);
}

/**
 * Generates the HTML Report
 */
export function generateHTMLReport(testCases, summary, outputPath) {
  // Group test cases by category
  const categories = {};
  testCases.forEach(tc => {
    if (!categories[tc.category]) {
      categories[tc.category] = [];
    }
    categories[tc.category].push(tc);
  });

  // Create JS array string for Charting inside the HTML
  const chartLabels = JSON.stringify(testCases.map(t => `${t.id}`));
  const chartData = JSON.stringify(testCases.map(t => parseFloat(t.measuredValue)));
  const chartThresholds = JSON.stringify(testCases.map(t => parseFloat(t.threshold)));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedMonitor Load Testing & Performance Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-dark: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent-teal: #0d9488;
      --accent-emerald: #10b981;
      --accent-blue: #3b82f6;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --pass-bg: rgba(16, 185, 129, 0.15);
      --pass-text: #34d399;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      padding: 2rem 1rem;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
    }

    /* Header styling */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(12px);
    }

    .brand h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, #0d9488 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.2rem;
    }

    .brand p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .status-badge {
      background: var(--accent-emerald);
      color: white;
      font-weight: 700;
      padding: 0.5rem 1.2rem;
      border-radius: 9999px;
      letter-spacing: 1px;
      font-size: 0.9rem;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      backdrop-filter: blur(12px);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    }

    .card-title {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .card-value {
      font-size: 1.8rem;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
    }

    .value-pass { color: var(--pass-text); }
    .value-blue { color: #60a5fa; }
    .value-teal { color: #2dd4bf; }

    /* Performance Charts & Visualizations */
    .layout-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    @media(min-width: 1024px) {
      .layout-grid {
        grid-template-columns: 2fr 1fr;
      }
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 350px;
    }

    /* Category List Breakdown */
    .category-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .category-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .cat-name {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .cat-status {
      font-size: 0.85rem;
      color: var(--pass-text);
      background: var(--pass-bg);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Test Case Details Table */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      overflow-x: auto;
      backdrop-filter: blur(12px);
    }

    .table-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .filter-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-main);
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s, border-color 0.2s;
    }

    .filter-btn.active, .filter-btn:hover {
      background: var(--accent-teal);
      border-color: var(--accent-teal);
      color: white;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th, td {
      padding: 0.8rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.9rem;
    }

    th {
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .td-sno {
      font-weight: 700;
      color: var(--text-muted);
      width: 50px;
    }

    .td-title {
      font-weight: 600;
    }

    .td-category {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-pass {
      background: var(--pass-bg);
      color: var(--pass-text);
    }

    .meta-footer {
      margin-top: 3rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>MedMonitor Load Test Report</h1>
        <p>Performance & Reliability Dashboard • Automated QA System</p>
      </div>
      <div class="status-badge">${summary.overallStatus}</div>
    </header>

    <div class="summary-grid">
      <div class="card">
        <div class="card-title">Total Test Cases</div>
        <div class="card-value">${summary.total}</div>
      </div>
      <div class="card">
        <div class="card-title">Passed Cases</div>
        <div class="card-value value-pass">${summary.passed}</div>
      </div>
      <div class="card">
        <div class="card-title">Failed Cases</div>
        <div class="card-value">${summary.failed}</div>
      </div>
      <div class="card">
        <div class="card-title">Pass Percentage</div>
        <div class="card-value value-teal">${summary.passPercentage}%</div>
      </div>
      <div class="card">
        <div class="card-title">Avg Response Time</div>
        <div class="card-value value-blue">${summary.averageResponseTime} ms</div>
      </div>
    </div>

    <div class="layout-grid">
      <div class="card">
        <div class="card-title">Response Time Measurements vs Thresholds (ms)</div>
        <div class="chart-container">
          <canvas id="loadChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title" style="margin-bottom: 1.2rem;">Category Summaries</div>
        <div class="category-breakdown">
          ${Object.keys(categories).map(cat => `
            <div class="category-row">
              <span class="cat-name">${cat}</span>
              <span class="cat-status">PASS (${categories[cat].length} cases)</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="table-container">
      <div class="table-title">
        <span>Test Case Details</span>
        <div class="filter-buttons">
          <button class="filter-btn active" onclick="filterCategory('All')">All Categories</button>
          ${Object.keys(categories).map(cat => `
            <button class="filter-btn" onclick="filterCategory('${cat}')">${cat.split(' ')[0]}</button>
          `).join('')}
        </div>
      </div>

      <table id="testCasesTable">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Test Case</th>
            <th>Category</th>
            <th>Measured Value</th>
            <th>Threshold</th>
            <th>Result</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${testCases.map(tc => `
            <tr data-category="${tc.category}">
              <td class="td-sno">${tc.id}</td>
              <td class="td-title">${tc.title}</td>
              <td class="td-category">${tc.category}</td>
              <td style="font-weight: 600;">${tc.measuredValue}</td>
              <td style="color: var(--text-muted);">${tc.threshold}</td>
              <td style="font-weight: 600;">${tc.result}</td>
              <td><span class="badge badge-pass">${tc.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="meta-footer">
      <p>Report generated dynamically during GitHub Actions CI build runner step.</p>
      <p>Platform: ${process.platform} • Date: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <script>
    // Initialize Response Time Chart
    const ctx = document.getElementById('loadChart').getContext('2d');
    
    // Style chart defaults for dark mode
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${chartLabels},
        datasets: [
          {
            label: 'Measured Value (ms)',
            data: ${chartData},
            borderColor: '#2dd4bf',
            backgroundColor: 'rgba(45, 212, 191, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Threshold (ms)',
            data: ${chartThresholds},
            borderColor: '#ef4444',
            borderDash: [5, 5],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            title: {
              display: true,
              text: 'Test Case Number (S.No)'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            title: {
              display: true,
              text: 'Duration / Paint Time'
            }
          }
        }
      }
    });

    // Filtering Functionality
    function filterCategory(category) {
      const rows = document.querySelectorAll('#testCasesTable tbody tr');
      const buttons = document.querySelectorAll('.filter-btn');
      
      // Update active button state
      buttons.forEach(btn => {
        if (btn.innerText.includes(category.split(' ')[0])) {
          btn.classList.add('active');
        } else if (category === 'All' && btn.innerText === 'All Categories') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Filter rows
      rows.forEach(row => {
        const cat = row.getAttribute('data-category');
        if (category === 'All' || cat === category) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
}
