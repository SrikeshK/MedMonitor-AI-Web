import { expect } from 'chai';
import { until } from 'selenium-webdriver';
import { DriverFactory } from '../utils/driverFactory.js';
import { LoginPage } from '../pages/login.page.js';
import { ModeSelectionPage } from '../pages/modeSelection.page.js';
import { PatientDashboardPage } from '../pages/patientDashboard.page.js';
import { MedicinesPage } from '../pages/medicines.page.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

describe('8. Inventory Workflows', function() {
  this.timeout(60000);
  let driver;
  let loginPage;
  let modePage;
  let dashboardPage;
  let medicinesPage;

  const searchSelector = 'input[data-testid="inventory-search"]';
  
  const aspirin = {
    name: 'Aspirin_QA',
    dosage: 325,
    unit: 'mg',
    slots: { morning: true },
    total: 100,
    limit: 10,
    startDate: '2026-06-15',
    endDate: '2026-12-15'
  };

  before(async function() {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    modePage = new ModeSelectionPage(driver);
    dashboardPage = new PatientDashboardPage(driver);
    medicinesPage = new MedicinesPage(driver);

    logger.info('Logging in for inventory tests...');
    await loginPage.navigate();
    await loginPage.login(config.credentials.patientEmail, config.credentials.defaultPassword);

    // Wait for either mode-selection OR direct dashboard redirect
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/mode-selection') || url.includes('/patient/dashboard');
    }, 30000, 'Waiting for post-login redirect');

    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('/mode-selection')) {
      await modePage.selectPatientMode(20000);
    }
    await dashboardPage.waitForDashboardLoad();

    // Add Aspirin_QA medicine first to guarantee search records exist
    logger.info('Adding Aspirin_QA for inventory verification...');
    await dashboardPage.navigateToMedicines();
    await driver.wait(until.urlContains('/patient/medicines'), config.timeout);
    await medicinesPage.openAddModal();
    await medicinesPage.addMedicine(aspirin);
    await driver.sleep(1500);

    // Navigate to Inventory page
    await dashboardPage.navigateToInventory();
    await driver.wait(until.urlContains('/patient/inventory'), config.timeout);
    await dashboardPage.waitForVisible(searchSelector);
    await driver.sleep(1000); // Settle animation
  });

  after(async function() {
    if (driver) {
      // Clean up added Aspirin_QA record
      try {
        logger.info('Cleaning up Aspirin_QA medicine card...');
        await dashboardPage.navigateToMedicines();
        await driver.wait(until.urlContains('/patient/medicines'), config.timeout);
        await medicinesPage.openEditModal(aspirin.name);
        await medicinesPage.deleteMedicine();
        await driver.sleep(1500);
      } catch (err) {
        logger.error('Failed to clean up Aspirin_QA', err);
      }
      await driver.quit();
    }
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      const name = this.currentTest.title.replace(/\s+/g, '_');
      await DriverFactory.takeScreenshot(driver, `FAIL_INVENTORY_${name}`);
    }
  });

  it('Test 8.1: Patient Inventory search input is visible', async function() {
    logger.info('Asserting search container...');
    const visible = await driver.findElement({ css: searchSelector }).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 8.2: Search input field accepts text input', async function() {
    logger.info('Typing query into search input...');
    await dashboardPage.type(searchSelector, 'Aspirin_QA');
    const val = await driver.findElement({ css: searchSelector }).getAttribute('value');
    expect(val).to.equal('Aspirin_QA');
  });

  it('Test 8.3: Filter list by exact medication name works', async function() {
    logger.info('Filtering list by exact drug name...');
    await dashboardPage.type(searchSelector, 'Aspirin_QA');
    await driver.sleep(500);
    const card = await driver.findElement({ xpath: '//h3[contains(text(), "Aspirin_QA")]' });
    expect(await card.isDisplayed()).to.be.true;
  });

  it('Test 8.4: Filter list by partial search string works', async function() {
    logger.info('Filtering list by partial query...');
    await dashboardPage.type(searchSelector, 'Aspirin');
    await driver.sleep(500);
    const card = await driver.findElement({ xpath: '//h3[contains(text(), "Aspirin_QA")]' });
    expect(await card.isDisplayed()).to.be.true;
  });

  it('Test 8.5: Inventory page displays summary stat card for Items Tracked', async function() {
    logger.info('Verifying Items Tracked stat badge...');
    const stat = await driver.findElement({ xpath: '//p[contains(text(), "Items Tracked")]' });
    expect(await stat.isDisplayed()).to.be.true;
  });

  it('Test 8.6: Inventory page displays summary stat card for Inventory Alerts', async function() {
    logger.info('Verifying Inventory Alerts stat badge...');
    const stat = await driver.findElement({ xpath: '//p[contains(text(), "Inventory Alerts")]' });
    expect(await stat.isDisplayed()).to.be.true;
  });

  it('Test 8.7: Search for non-existent drug shows empty search state illustration', async function() {
    logger.info('Searching for non-existent drug...');
    await dashboardPage.type(searchSelector, 'NonExistentDrugNameABC123');
    await driver.sleep(500);
    const emptyState = await driver.findElement({ css: 'div[data-testid="inventory-search-empty"]' });
    expect(await emptyState.isDisplayed()).to.be.true;
  });

  it('Test 8.8: Clear search input restores all stock items to view', async function() {
    logger.info('Restoring inventory view...');
    // Use React-compatible clear: JS setter with empty string + dispatch events
    const searchEl = await driver.findElement({ css: searchSelector });
    await driver.executeScript(
      "const el = arguments[0]; " +
      "const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; " +
      "setter.call(el, ''); " +
      "el.dispatchEvent(new Event('input', { bubbles: true })); " +
      "el.dispatchEvent(new Event('change', { bubbles: true }));",
      searchEl
    );
    const xpathLocator = '//h3[contains(text(), "Aspirin_QA")]';
    await dashboardPage.waitForVisible(xpathLocator);
    const card = await driver.findElement({ xpath: xpathLocator });
    expect(await card.isDisplayed()).to.be.true;
  });
});
