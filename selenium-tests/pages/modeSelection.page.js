import { BasePage } from './base.page.js';

export class ModeSelectionPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.patientPortalBtn = '//button[contains(., "Patient Portal")]';
    this.caregiverPortalBtn = '//button[contains(., "Caregiver Portal")]';
    this.signOutBtn = '//button[contains(., "Sign out of account")]';
  }

  async selectPatientMode() {
    await this.jsClick(this.patientPortalBtn, 20000);
  }

  async selectCaregiverMode() {
    await this.jsClick(this.caregiverPortalBtn);
  }

  async signOut() {
    await this.jsClick(this.signOutBtn);
  }
}
