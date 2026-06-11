import { expect } from 'chai';
import { until } from 'selenium-webdriver';
import { DriverFactory } from '../utils/driverFactory.js';
import { LoginPage } from '../pages/login.page.js';
import { ModeSelectionPage } from '../pages/modeSelection.page.js';
import { PatientDashboardPage } from '../pages/patientDashboard.page.js';
import { CaregiverDashboardPage } from '../pages/caregiverDashboard.page.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

describe('2. Navigation Workflows', function() {
  this.timeout(45000);
  let driver;
  let loginPage;
  let modePage;
  let dashboardPage;
  let caregiverDashboard;

  before(async function() {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    modePage = new ModeSelectionPage(driver);
    dashboardPage = new PatientDashboardPage(driver);
    caregiverDashboard = new CaregiverDashboardPage(driver);

    logger.info('Logging in for navigation tests...');
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
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      const name = this.currentTest.title.replace(/\s+/g, '_');
      await DriverFactory.takeScreenshot(driver, `FAIL_NAV_${name}`);
    }
  });

  it('Test 2.1: Navigation via Patient sidebar to Dashboard page', async function() {
    logger.info('Navigating to Patient Dashboard via sidebar...');
    await dashboardPage.click(dashboardPage.sidebarDashboard);
    await driver.wait(until.urlContains('/patient/dashboard'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/dashboard');
  });

  it('Test 2.2: Navigation via Patient sidebar to Medicines page', async function() {
    logger.info('Navigating to Medicines page...');
    await dashboardPage.click(dashboardPage.sidebarMedicines);
    await driver.wait(until.urlContains('/patient/medicines'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/medicines');
  });

  it('Test 2.3: Navigation via Patient sidebar to Alerts page', async function() {
    logger.info('Navigating to Alerts page...');
    await dashboardPage.click(dashboardPage.sidebarAlerts);
    await driver.wait(until.urlContains('/patient/alerts'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/alerts');
  });

  it('Test 2.4: Navigation via Patient sidebar to Analytics page', async function() {
    logger.info('Navigating to Analytics page...');
    await dashboardPage.click(dashboardPage.sidebarAnalytics);
    await driver.wait(until.urlContains('/patient/analytics'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/analytics');
  });

  it('Test 2.5: Navigation via Patient sidebar to Reports page', async function() {
    logger.info('Navigating to Reports page...');
    await dashboardPage.click(dashboardPage.sidebarReports);
    await driver.wait(until.urlContains('/patient/reports'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/reports');
  });

  it('Test 2.6: Navigation via Patient sidebar to Inventory page', async function() {
    logger.info('Navigating to Inventory page...');
    await dashboardPage.click(dashboardPage.sidebarInventory);
    await driver.wait(until.urlContains('/patient/inventory'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/inventory');
  });

  it('Test 2.7: Navigation via Patient sidebar to Care Circle page', async function() {
    logger.info('Navigating to Care Circle page...');
    await dashboardPage.click(dashboardPage.sidebarCareCircle);
    await driver.wait(until.urlContains('/patient/care-circle'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/care-circle');
  });

  it('Test 2.8: Direct navigation to Patient Profile page loads the profile screen', async function() {
    logger.info('Navigating directly to Patient Profile page...');
    await dashboardPage.visit('/patient/profile');
    await driver.wait(until.urlContains('/patient/profile'), config.timeout);
    expect(await dashboardPage.getCurrentPath()).to.equal('/patient/profile');
  });

  it('Test 2.9: Navigation via Caregiver sidebar to Patients registry', async function() {
    logger.info('Navigating to Caregiver Mode first...');
    await driver.get(`${config.baseUrl}/mode-selection`);
    await driver.wait(until.urlContains('/mode-selection'), 15000);
    await modePage.selectCaregiverMode();
    await driver.wait(until.urlContains('/caregiver/dashboard'), 15000);
    
    logger.info('Navigating to Caregiver Patients list...');
    await caregiverDashboard.click(caregiverDashboard.sidebarPatients);
    await driver.wait(until.urlContains('/caregiver/patients'), config.timeout);
    expect(await caregiverDashboard.getCurrentPath()).to.equal('/caregiver/patients');
  });

  it('Test 2.10: Navigation via Caregiver sidebar to Alerts feed', async function() {
    logger.info('Navigating to Caregiver Alerts feed...');
    await caregiverDashboard.click(caregiverDashboard.sidebarAlerts);
    await driver.wait(until.urlContains('/caregiver/alerts'), config.timeout);
    expect(await caregiverDashboard.getCurrentPath()).to.equal('/caregiver/alerts');
  });
});
