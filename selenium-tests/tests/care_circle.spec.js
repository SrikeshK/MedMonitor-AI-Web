import { expect } from 'chai';
import { until } from 'selenium-webdriver';
import { DriverFactory } from '../utils/driverFactory.js';
import { LoginPage } from '../pages/login.page.js';
import { ModeSelectionPage } from '../pages/modeSelection.page.js';
import { PatientDashboardPage } from '../pages/patientDashboard.page.js';
import { CareCirclePage } from '../pages/careCircle.page.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

describe('9. Care Circle Workflows', function() {
  this.timeout(60000);
  let driver;
  let loginPage;
  let modePage;
  let dashboardPage;
  let careCirclePage;

  const member1 = {
    name: `Jane Doe_${Date.now()}`,
    relation: 'Sister',
    phone: '+15550199',
    email: 'jane.doe@family.com'
  };

  const member2 = {
    name: `John Doe_${Date.now()}`,
    relation: 'Brother',
    phone: '+15550299',
    email: 'john.doe@family.com'
  };

  before(async function() {
    this.timeout(120000);
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    modePage = new ModeSelectionPage(driver);
    dashboardPage = new PatientDashboardPage(driver);
    careCirclePage = new CareCirclePage(driver);

    try {
      logger.info('Logging in for Care Circle tests...');
      await loginPage.navigate();
      await loginPage.login(config.credentials.patientEmail, config.credentials.defaultPassword);

      // Wait for either mode-selection OR direct dashboard redirect (if already authed)
      await driver.wait(async () => {
        const url = await driver.getCurrentUrl();
        return url.includes('/mode-selection') || url.includes('/patient/dashboard');
      }, 30000, 'Waiting for post-login redirect');

      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes('/mode-selection')) {
        await modePage.selectPatientMode();
      }
      await dashboardPage.waitForDashboardLoad();
    } catch (err) {
      logger.error(`Error in before hook: ${err.message}`);
      await DriverFactory.takeScreenshot(driver, 'FAIL_CARE_BEFORE_ALL');
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
      await DriverFactory.takeScreenshot(driver, `FAIL_CARE_${name}`);
    }
  });

  it('Test 9.1: Care Circle page container renders correctly', async function() {
    logger.info('Navigating to Care Circle...');
    await dashboardPage.navigateToCareCircle();
    await driver.wait(until.urlContains('/patient/care-circle'), 15000);
    await careCirclePage.waitForVisible('div.space-y-8', 15000);
    const visible = await driver.findElement({ css: 'div.space-y-8' }).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 9.2: Open Add Family Member modal', async function() {
    logger.info('Opening add family modal...');
    await careCirclePage.openAddModal();
    const visible = await driver.findElement({ css: careCirclePage.addModalContainer }).isDisplayed();
    expect(visible).to.be.true;
  });

  it('Test 9.3: Click cancel inside family member modal closes modal', async function() {
    logger.info('Dismissing modal via cancel button...');
    await careCirclePage.jsClick(careCirclePage.cancelBtn);
    await careCirclePage.waitForNotVisible(careCirclePage.addModalContainer);
  });

  it('Test 9.4: Add fresh family member successfully', async function() {
    logger.info(`Adding first family member: ${member1.name}`);
    await careCirclePage.openAddModal();
    await careCirclePage.addMember(member1);
  });

  it('Test 9.5: Verify family member card is displayed', async function() {
    logger.info('Checking first member card exists...');
    await driver.sleep(1500); // Firestore sync delay
    const exists = await careCirclePage.checkMemberExists(member1.name);
    expect(exists).to.be.true;
  });

  it('Test 9.6: Add second family member successfully', async function() {
    logger.info(`Adding second family member: ${member2.name}`);
    await careCirclePage.openAddModal();
    await careCirclePage.addMember(member2);
    await driver.sleep(1500);
    const exists = await careCirclePage.checkMemberExists(member2.name);
    expect(exists).to.be.true;
  });

  it('Test 9.7: Delete the first family member card', async function() {
    logger.info(`Deleting family member: ${member1.name}`);
    await careCirclePage.deleteMember(member1.name);
  });

  it('Test 9.8: Verify deleted member card is removed from circle', async function() {
    logger.info('Confirming first member card is gone...');
    // Use checkMemberNotExists to poll until the deleted member is absent (up to 20s)
    const notExists1 = await careCirclePage.checkMemberNotExists(member1.name);
    const exists2 = await careCirclePage.checkMemberExists(member2.name);
    expect(notExists1).to.be.true;
    expect(exists2).to.be.true;
    // Clean up second member
    await careCirclePage.deleteMember(member2.name);
    await driver.sleep(2000);
  });
});
