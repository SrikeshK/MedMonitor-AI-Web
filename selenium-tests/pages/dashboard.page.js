import { BasePage } from './base.page.js';

export class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.patientDashboardContainer = 'div[data-testid="patient-dashboard"]';
    this.caregiverDashboardContainer = '//h3[contains(text(), "Command Center")]';
    this.streakBadge = 'div[data-testid="streak-badge"]';
    
    // Quick Actions
    this.quickAddMed = '//button[descendant::h4[contains(., "Add Med")]]';
    this.quickCareCircle = '//button[descendant::h4[contains(., "Circle")]]';
    this.quickInventory = '//button[descendant::h4[contains(., "Stock")]]';
    this.quickAnalytics = '//button[descendant::h4[contains(., "Stats")]]';
    
    // Mode selection
    this.patientPortalBtn = '//button[contains(., "Patient Portal")]';
    this.caregiverPortalBtn = '//button[contains(., "Caregiver Portal")]';
    this.signOutBtn = '//button[contains(., "Sign out of account")]';
    
    // Caregiver widgets - use text within child p element for StatCard
    this.statsCardPatients = '//p[normalize-space(text())="Total Patients"]';
    this.statsCardAlerts = '//p[normalize-space(text())="Active Alerts"]';
    this.activityFeed = 'h3[data-testid="live-activity-heading"]';
    this.patientSummaryTable = '//h2[contains(text(), "Patient Adherence Summary")]';
  }

  async waitForPatientDashboard() {
    await this.waitForVisible(this.patientDashboardContainer);
  }

  async waitForCaregiverDashboard() {
    await this.waitForVisible(this.activityFeed, 20000);
  }

  async getStreakCount() {
    const text = await this.getText(this.streakBadge);
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async clickQuickAddMed() {
    await this.click(this.quickAddMed);
  }

  async clickQuickCareCircle() {
    await this.click(this.quickCareCircle);
  }

  async clickQuickInventory() {
    await this.click(this.quickInventory);
  }

  async clickQuickAnalytics() {
    await this.click(this.quickAnalytics);
  }
}
