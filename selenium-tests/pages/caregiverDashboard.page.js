import { BasePage } from './base.page.js';

export class CaregiverDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Mode selection
    this.patientPortalBtn = '//button[contains(., "Patient Portal")]';
    this.caregiverPortalBtn = '//button[contains(., "Caregiver Portal")]';
    this.signOutBtn = '//button[contains(., "Sign out of account")]';
    
    // Sidebar items
    this.sidebarDashboard = 'aside a[href="/caregiver/dashboard"]';
    this.sidebarPatients = 'aside a[href="/caregiver/patients"]';
    this.sidebarAlerts = 'aside a[href="/caregiver/alerts"]';
    this.sidebarAnalytics = 'aside a[href="/caregiver/analytics"]';
    this.sidebarReports = 'aside a[href="/caregiver/reports"]';
    this.sidebarSettings = 'aside a[href="/caregiver/settings"]';
    this.sidebarSignOut = '//aside//button[contains(., "Sign Out")]';
    
    // Live Feed Container / Activity elements
    this.activityFeed = 'h3[data-testid="live-activity-heading"]'; 
    this.activityFeedItems = '[data-testid="live-activity-heading"]';
  }

  async navigateToPatients() {
    await this.jsClick(this.sidebarPatients);
  }

  async navigateToAlerts() {
    await this.jsClick(this.sidebarAlerts);
  }

  async navigateToAnalytics() {
    await this.jsClick(this.sidebarAnalytics);
  }

  async navigateToReports() {
    await this.jsClick(this.sidebarReports);
  }

  async navigateToSettings() {
    await this.jsClick(this.sidebarSettings);
  }

  async navigateToDashboard() {
    await this.jsClick(this.sidebarDashboard);
  }

  async clickSignOut() {
    await this.click(this.sidebarSignOut);
  }
}
