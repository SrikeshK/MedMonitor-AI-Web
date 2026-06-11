import { BasePage } from './base.page.js';

export class PatientDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.dashboardContainer = 'div[data-testid="patient-dashboard"]';
    this.streakBadge = 'div[data-testid="streak-badge"]';
    
    // Quick Actions
    this.quickAddMed = 'div[data-testid="quick-add-med"]';
    this.quickCareCircle = 'div[data-testid="quick-care-circle"]';
    this.quickInventory = 'div[data-testid="quick-inventory"]';
    this.quickAnalytics = 'div[data-testid="quick-analytics"]';
    
    // Sidebar items
    this.sidebarDashboard = 'aside a[href="/patient/dashboard"]';
    this.sidebarMedicines = 'aside a[href="/patient/medicines"]';
    this.sidebarAlerts = 'aside a[href="/patient/alerts"]';
    this.sidebarAnalytics = 'aside a[href="/patient/analytics"]';
    this.sidebarReports = 'aside a[href="/patient/reports"]';
    this.sidebarInventory = 'aside a[href="/patient/inventory"]';
    this.sidebarCareCircle = 'aside a[href="/patient/care-circle"]';
    this.sidebarSettings = 'aside a[href="/patient/settings"]';
    this.sidebarSignOut = '//aside//button[contains(., "Sign Out")]';
    
    // Mobile bottom nav items (for responsiveness testing)
    this.mobileDashboard = 'nav a[href="/patient/dashboard"]';
    this.mobileMedicines = 'nav a[href="/patient/medicines"]';
    
    // Header items
    this.headerProfile = '//header//a[contains(@href, "profile")]';
  }

  async waitForDashboardLoad() {
    // Wait for either the loading skeleton or the fully-loaded dashboard -
    // both indicate we are on the patient dashboard page
    await this.driver.wait(async () => {
      try {
        const loadingEls = await this.driver.findElements({ css: 'div[data-testid="dashboard-loading"]' });
        if (loadingEls.length > 0 && await loadingEls[0].isDisplayed()) return true;
        const dashboardEls = await this.driver.findElements({ css: 'div[data-testid="patient-dashboard"]' });
        if (dashboardEls.length > 0 && await dashboardEls[0].isDisplayed()) return true;
      } catch (e) {
        // Ignore stale element errors
      }
      return false;
    }, 30000, 'Waiting for patient dashboard to load');
  }

  async getStreakCount() {
    const text = await this.getText(this.streakBadge);
    // e.g. "5 Days" -> 5
    return parseInt(text.match(/\d+/)[0], 10);
  }

  async navigateToMedicines() {
    await this.click(this.sidebarMedicines);
  }

  async navigateToCareCircle() {
    await this.click(this.sidebarCareCircle);
  }

  async navigateToInventory() {
    await this.click(this.sidebarInventory);
  }

  async navigateToAnalytics() {
    await this.click(this.sidebarAnalytics);
  }

  async navigateToReports() {
    await this.click(this.sidebarReports);
  }

  async navigateToSettings() {
    await this.click(this.sidebarSettings);
  }

  async clickSignOut() {
    await this.click(this.sidebarSignOut);
  }

  async clickProfile() {
    await this.click(this.headerProfile);
  }
}
