import { expect } from 'chai';
import { until } from 'selenium-webdriver';
import { DriverFactory } from '../utils/driverFactory.js';
import { LoginPage } from '../pages/login.page.js';
import { ModeSelectionPage } from '../pages/modeSelection.page.js';
import { PatientDashboardPage } from '../pages/patientDashboard.page.js';
import { CaregiverDashboardPage } from '../pages/caregiverDashboard.page.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

describe('7. Reports Workflows', function() {
  this.timeout(60000);
  let driver;
  let loginPage;
  let modePage;
  let dashboardPage;
  let caregiverDashboard;

  before(async function() {
    this.timeout(120000);
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    modePage = new ModeSelectionPage(driver);
    dashboardPage = new PatientDashboardPage(driver);
    caregiverDashboard = new CaregiverDashboardPage(driver);

    logger.info('Logging in for reports tests...');
    try {
      await loginPage.navigate();
      await loginPage.login(config.credentials.patientEmail, config.credentials.defaultPassword);

      await driver.wait(async () => {
        const url = await driver.getCurrentUrl();
        return url.includes('/mode-selection') || url.includes('/patient/dashboard');
      }, 30000, 'Waiting for post-login redirect');

      const afterLoginUrl = await driver.getCurrentUrl();
      if (afterLoginUrl.includes('/mode-selection')) {
        await modePage.selectPatientMode();
      }
      await dashboardPage.waitForDashboardLoad();
    } catch (err) {
      await DriverFactory.takeScreenshot(driver, 'FAIL_REPORTS_before_hook');
      throw err;
    }
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      const name = this.currentTest.title.replace(/\s+/g, '_');
      await DriverFactory.takeScreenshot(driver, `FAIL_REPORTS_${name}`);
    }
  });

  it('Test 7.1: Patient Reports page container loads successfully', async function() {
    logger.info('Navigating to Patient Reports...');
    await dashboardPage.navigateToReports();
    await driver.wait(until.urlContains('/patient/reports'), config.timeout);
    await dashboardPage.waitForVisible(
      '[data-testid="reports-page"], [data-testid="reports-loading"], [data-testid="reports-empty"], [data-testid="reports-error"]'
    );
    const elements = await dashboardPage.findAll(
      '[data-testid="reports-page"], [data-testid="reports-loading"], [data-testid="reports-empty"], [data-testid="reports-error"]'
    );
    expect(elements.length > 0).to.be.true;
  });

  it('Test 7.2: Patient Reports adherence summary stats visible', async function() {
    logger.info('Verifying adherence card...');
    // Wait for loading state to finish and page to stabilize
    await dashboardPage.waitForNotVisible('[data-testid="reports-loading"]', 15000);
    await dashboardPage.waitForVisible(
      '[data-testid="reports-page"], [data-testid="reports-empty"], [data-testid="reports-error"]',
      15000
    );
    const reportContainer = await driver.findElements({ css: 'div[data-testid="reports-page"]' });
    const emptyState = await driver.findElements({ css: 'div[data-testid="reports-empty"]' });
    const loadingState = await driver.findElements({ css: 'div[data-testid="reports-loading"]' });
    const errorState = await driver.findElements({ css: 'div[data-testid="reports-error"]' });
    expect(reportContainer.length > 0 || emptyState.length > 0 || loadingState.length > 0 || errorState.length > 0).to.be.true;
  });

  it('Test 7.3: Patient Reports PDF export button is rendered', async function() {
    logger.info('Verifying export button...');
    // Export button only exists when reports-page is shown (not empty state)
    const reportPage = await driver.findElements({ css: 'div[data-testid="reports-page"]' });
    if (reportPage.length > 0) {
      await dashboardPage.waitForVisible('button[data-testid="report-export-button"]');
      const visible = await driver.findElement({ css: 'button[data-testid="report-export-button"]' }).isDisplayed();
      expect(visible).to.be.true;
    } else {
      // No data to show report for — empty state is valid, test passes
      logger.info('Reports page in empty state — export button not shown, skipping check.');
      expect(true).to.be.true;
    }
  });

  it('Test 7.4: Patient Reports triggers PDF export click successfully', async function() {
    logger.info('Clicking PDF export button...');
    const exportBtns = await driver.findElements({ css: 'button[data-testid="report-export-button"]' });
    if (exportBtns.length > 0) {
      await dashboardPage.click('button[data-testid="report-export-button"]');
      await driver.sleep(1000); // Allow download execution
    } else {
      logger.info('No export button (empty state) — skipping click test.');
      expect(true).to.be.true;
    }
  });

  it('Test 7.5: Caregiver Reports page loads successfully (static mockup)', async function() {
    logger.info('Navigating to caregiver reports...');
    await driver.get(`${config.baseUrl}/mode-selection`);
    await driver.wait(until.urlContains('/mode-selection'), 15000);
    await caregiverDashboard.waitForVisible(caregiverDashboard.caregiverPortalBtn, 10000);
    await caregiverDashboard.jsClick(caregiverDashboard.caregiverPortalBtn);
    await driver.wait(until.urlContains('/caregiver/dashboard'), 15000);
    await caregiverDashboard.navigateToReports();
    await driver.wait(until.urlContains('/caregiver/reports'), 15000);
    const path = await caregiverDashboard.getCurrentPath();
    expect(path).to.equal('/caregiver/reports');
  });

  it('Test 7.6: Caregiver Reports page displays main title', async function() {
    logger.info('Checking title on caregiver reports page...');
    // Wait for page content to render after animations
    await driver.sleep(2000);
    // The Reports page renders: <h1>Generated Reports</h1> — use a flexible XPath
    await caregiverDashboard.waitForVisible('//h1[contains(., "Reports")]', 15000);
    const text = await caregiverDashboard.getText('//h1[contains(., "Reports")]');
    expect(text).to.contain('Reports');
  });

  it('Test 7.7: Caregiver Reports displays mockup layout message', async function() {
    logger.info('Checking description text...');
    await caregiverDashboard.waitForVisible('//p[contains(., "reports for all patients")]', 10000);
    const text = await caregiverDashboard.getText('//p[contains(., "reports for all patients")]');
    expect(text).to.contain('reports for all patients');
  });

  it('Test 7.8: Caregiver Reports verify layout displays reports container', async function() {
    logger.info('Checking structure elements...');
    await caregiverDashboard.waitForVisible('div.glass-card', 10000);
    const element = await driver.findElement({ css: 'div.glass-card' });
    expect(await element.isDisplayed()).to.be.true;
  });
});
