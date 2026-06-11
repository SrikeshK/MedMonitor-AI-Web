import { BasePage } from './base.page.js';

export class PatientsPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addPatientBtn = '//button[contains(., "Add Patient")]';
    this.addModalContainer = 'div[data-testid="add-patient-modal"]';
    
    // Add Patient Form Inputs
    this.nameInput = 'input[data-testid="patient-name-input"]';
    this.phoneInput = 'input[data-testid="patient-phone-input"]';
    this.ageInput = 'input[data-testid="patient-age-input"]';
    this.relationInput = 'input[data-testid="patient-relation-input"]';
    
    this.saveBtn = 'button[data-testid="save-patient-button"]';
    this.cancelBtn = 'button[data-testid="cancel-button"]';
    this.closeModalBtn = 'button[data-testid="close-modal-button"]';
    
    this.searchInput = 'input[placeholder="Search patients..."]';
  }

  async openAddModal() {
    await this.driver.sleep(1000);
    await this.jsClick(this.addPatientBtn);
    await this.waitForVisible(this.addModalContainer);
    await this.driver.sleep(1500); // Wait for transition animations to settle
  }

  async addPatient(data) {
    await this.waitForVisible(this.nameInput);
    await this.type(this.nameInput, data.name);
    await this.type(this.phoneInput, data.phone);
    await this.type(this.ageInput, data.age.toString());
    await this.type(this.relationInput, data.relation);
    
    await this.jsClick(this.saveBtn);
    await this.waitForNotVisible(this.addModalContainer);
    await this.driver.navigate().refresh();
    await this.driver.sleep(1200);
  }

  async searchPatients(query) {
    await this.type(this.searchInput, query);
  }

  async checkPatientExists(name, timeout = 5000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        const found = await this.driver.executeScript(
          `return Array.from(document.querySelectorAll('h3')).some(el => el.textContent.trim() === arguments[0]);`,
          name
        );
        if (found) return true;
      } catch (e) {
        // Ignore DOM errors during transitions
      }
      await this.driver.sleep(300);
    }
    return false;
  }
}
