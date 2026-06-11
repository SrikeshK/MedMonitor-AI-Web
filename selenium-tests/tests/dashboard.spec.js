import { expect } from 'chai';
import { until } from 'selenium-webdriver';
import { DriverFactory } from '../utils/driverFactory.js';
import { LoginPage } from '../pages/login.page.js';
import { ModeSelectionPage } from '../pages/modeSelection.page.js';
import { DashboardPage } from '../pages/dashboard.page.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

describe('3. Dashboard Workflows', function() {
  this.timeout(60000);
  let driver;
  let loginPage;
  let modePage;
  let dashboardPage;

  before(async function() {
    this.timeout(120000);
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    modePage = new ModeSelectionPage(driver);
    dashboardPage = new DashboardPage(driver);

    logger.info('Logging in for dashboard tests...');
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
    await dashboardPage.waitForPatientDashboard();
    await driver.sleep(1500); // Wait for animations to settle
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      const name = this.currentTest.title.replace(/\s+/g, '_');
      await DriverFactory.takeScreenshot(driver, `FAIL_DASH_${name}`);
    }
  });

  it('Test 3.1: Patient Dashboard container renders correctly', async function() {
    logger.info('Asserting patient dashboard visibility...');
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.patientDashboardContainer)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.2: Patient Dashboard streak badge is visible', async function() {
    logger.info('Asserting streak badge visibility...');
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.streakBadge)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.3: Patient Dashboard streak count format check', async function() {
    logger.info('Verifying streak count format...');
    const text = await dashboardPage.getText(dashboardPage.streakBadge);
    expect(text).to.match(/\d+ Days?/);
  });

  it('Test 3.4: Quick Add Med card render check', async function() {
    logger.info('Verifying Quick Add Medicine card loads...');
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.quickAddMed)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.5: Quick Care Circle card render check', async function() {
    logger.info('Verifying Quick Care Circle card loads...');
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.quickCareCircle)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.6: Quick Inventory card render check', async function() {
    logger.info('Verifying Quick Inventory card loads...');
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.quickInventory)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.7: Quick Analytics card render check', async function() {
    logger.info('Verifying Quick Analytics card loads...');
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.quickAnalytics)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.8: Caregiver Dashboard Managed Patients widget visibility', async function() {
    logger.info('Navigating to caregiver dashboard...');
    await driver.get(`${config.baseUrl}/mode-selection`);
    await driver.wait(until.urlContains('/mode-selection'), 15000);
    // Use JS click to bypass motion animations on mode selection buttons
    await dashboardPage.waitForVisible(modePage.caregiverPortalBtn, 15000);
    await dashboardPage.jsClick(modePage.caregiverPortalBtn);
    await driver.wait(until.urlContains('/caregiver/dashboard'), 20000);
    await dashboardPage.waitForCaregiverDashboard();
    await driver.sleep(2000); // Wait for animations and data to settle

    logger.info('Checking Managed Patients widget...');
    await dashboardPage.waitForVisible(dashboardPage.statsCardPatients, 15000);
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.statsCardPatients)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.9: Caregiver Dashboard Active Alerts widget visibility', async function() {
    logger.info('Checking Active Alerts widget...');
    await dashboardPage.waitForVisible(dashboardPage.statsCardAlerts, 10000);
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.statsCardAlerts)).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 3.10: Caregiver Dashboard Live Activity feed visibility', async function() {
    logger.info('Checking Live Activity feed...');
    await dashboardPage.waitForVisible(dashboardPage.activityFeed, 10000);
    const visible = await driver.findElement(dashboardPage.getLocator(dashboardPage.activityFeed)).isDisplayed();
    expect(visible).to.be.true;
  });
});
