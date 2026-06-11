import { BasePage } from './base.page.js';

export class MedicinesPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addMedicineBtn = '//button[contains(., "Add Medicine")]';
    this.searchInput = 'input[placeholder="Search your medicine cabinet..."]';
    
    // Add Medicine Modal Elements
    this.addModalContainer = 'div[data-testid="add-medicine-modal"]';
    this.medNameInput = 'input[data-testid="med-name-input"]';
    this.medDosageInput = 'input[data-testid="med-dosage-input"]';
    this.unitInput = '//label[contains(text(), "Unit")]/following-sibling::input';
    
    this.morningCheckbox = '//span[text()="Morning"]/following-sibling::input[@type="checkbox"]';
    this.afternoonCheckbox = '//span[text()="Afternoon"]/following-sibling::input[@type="checkbox"]';
    this.nightCheckbox = '//span[text()="Night"]/following-sibling::input[@type="checkbox"]';
    
    this.totalQtyInput = '//label[contains(., "Total Quantity")]/following-sibling::input';
    this.limitQtyInput = '//label[contains(., "Low Stock Limit")]/following-sibling::input';
    this.startDateInput = '//label[contains(., "Start Date")]/following-sibling::input';
    this.endDateInput = '//label[contains(., "End Date")]/following-sibling::input';
    
    this.saveBtn = 'button[data-testid="save-medicine-button"]';
    this.cancelBtn = 'button[data-testid="cancel-button"]';
    this.closeModalBtn = 'button[data-testid="close-modal-button"]';

    // Edit Medicine Modal Elements
    this.editModalContainer = 'div[data-testid="edit-medicine-modal"]';
    this.editNameInput = 'input[data-testid="edit-med-name"]';
    this.editDosageInput = 'input[data-testid="edit-med-dosage"]';
    this.deleteBtn = 'button[data-testid="delete-medicine-button"]';
  }

  async openAddModal() {
    await this.driver.sleep(1000);
    await this.click(this.addMedicineBtn);
    await this.waitForVisible(this.addModalContainer);
  }

  async addMedicine(data) {
    await this.type(this.medNameInput, data.name);
    await this.type(this.medDosageInput, data.dosage.toString());
    await this.type(this.unitInput, data.unit || 'mg');

    if (data.slots) {
      if (data.slots.morning) await this.click(this.morningCheckbox);
      if (data.slots.afternoon) await this.click(this.afternoonCheckbox);
      if (data.slots.night) await this.click(this.nightCheckbox);
    }

    await this.type(this.totalQtyInput, data.total.toString());
    await this.type(this.limitQtyInput, data.limit.toString());
    await this.type(this.startDateInput, data.startDate);
    await this.type(this.endDateInput, data.endDate);

    await this.jsClick(this.saveBtn);
    await this.waitForNotVisible(this.addModalContainer);
    await this.driver.navigate().refresh();
    await this.driver.sleep(1200);
  }

  async searchMedicine(query) {
    await this.type(this.searchInput, query);
  }

  async openEditModal(medName) {
    // Filter to the target card by name first
    await this.type(this.searchInput, medName);
    await this.driver.sleep(1200);

    // Use pure JS to find the card with matching h3 text and click its edit button
    // This avoids XPath whitespace issues with React-rendered text nodes and
    // Framer Motion opacity animations that fail elementIsVisible checks.
    const deadline = Date.now() + 10000;
    let clicked = false;
    while (Date.now() < deadline && !clicked) {
      try {
        clicked = await this.driver.executeScript(
          `
          const name = arguments[0];
          const h3s = Array.from(document.querySelectorAll('h3'));
          const matchingH3 = h3s.find(el => el.textContent.trim() === name);
          if (!matchingH3) return false;
          // Walk up to find the card div (has class 'group')
          let card = matchingH3.parentElement;
          while (card && !card.classList.contains('group')) {
            card = card.parentElement;
          }
          if (!card) return false;
          const editBtn = card.querySelector('[data-testid="edit-medicine-button"]');
          if (!editBtn) return false;
          editBtn.click();
          return true;
          `,
          medName
        );
      } catch (e) {
        // Ignore DOM transition errors
      }
      if (!clicked) await this.driver.sleep(400);
    }
    if (!clicked) throw new Error(`Could not find card with name "${medName}" to open edit modal`);
    await this.waitForVisible(this.editModalContainer);
    await this.driver.sleep(800);
  }

  async editMedicineName(newName) {
    await this.type(this.editNameInput, newName);
    await this.jsClick(this.saveBtn);
    await this.waitForNotVisible(this.editModalContainer);
    await this.driver.navigate().refresh();
    await this.driver.sleep(1200);
  }

  async deleteMedicine() {
    await this.click(this.deleteBtn);
    // Switch to confirmation alert and accept it
    await this.acceptAlert();
    await this.waitForNotVisible(this.editModalContainer);
    await this.driver.navigate().refresh();
    await this.driver.sleep(1200);
  }

  async checkMedicineExists(medName, timeout = 8000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        const found = await this.driver.executeScript(
          `return Array.from(document.querySelectorAll('h3')).some(el => el.textContent.trim() === arguments[0]);`,
          medName
        );
        if (found) return true;
      } catch (e) {
        // Ignore script errors during DOM transitions
      }
      await this.driver.sleep(300);
    }
    return false;
  }

  /**
   * Searches for a medicine and then checks if a card with exact name appears.
   * Used when the list is large and filtering is needed to ensure DOM accuracy.
   */
  async searchAndVerifyExists(medName, timeout = 10000) {
    await this.type(this.searchInput, medName);
    await this.driver.sleep(1000);
    return this.checkMedicineExists(medName, timeout);
  }

  /**
   * Clears search and verifies a card exists in the full list.
   */
  async clearSearchAndVerify(medName, timeout = 10000) {
    await this.type(this.searchInput, '');
    await this.driver.sleep(800);
    await this.type(this.searchInput, medName);
    await this.driver.sleep(1000);
    return this.checkMedicineExists(medName, timeout);
  }
}
