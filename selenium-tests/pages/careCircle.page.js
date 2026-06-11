import { BasePage } from './base.page.js';

export class CareCirclePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addMemberBtn = 'button[data-testid="add-member-button"]';
    this.addModalContainer = 'div[data-testid="add-family-modal"]';
    
    // Form Inputs
    this.nameInput = 'input[data-testid="member-name-input"]';
    this.relationInput = 'input[data-testid="member-relation-input"]';
    this.phoneInput = 'input[data-testid="member-phone-input"]';
    this.emailInput = 'input[data-testid="member-email-input"]';
    
    this.saveBtn = 'button[data-testid="save-member-button"]';
    this.cancelBtn = 'button[data-testid="cancel-button"]';
  }

  async openAddModal() {
    // Ensure any previously open modal has fully closed before clicking the add button
    await this.waitForNotVisible(this.addModalContainer);
    await this.driver.sleep(500);
    // Use JS click to bypass any animation overlay intercepting the button
    await this.jsClick(this.addMemberBtn);
    await this.waitForVisible(this.addModalContainer);
    await this.driver.sleep(1500); // Wait for transition animations to settle
  }

  async addMember(data) {
    await this.waitForVisible(this.nameInput);
    await this.type(this.nameInput, data.name);
    await this.type(this.relationInput, data.relation);
    await this.type(this.phoneInput, data.phone);
    await this.type(this.emailInput, data.email);
    
    await this.jsClick(this.saveBtn);

    // Poll for modal disappearance using JS (more reliable than waitForNotVisible
    // which can race with React re-renders after Firestore write)
    const deadline = Date.now() + 25000;
    let modalGone = false;
    while (Date.now() < deadline) {
      try {
        const modalVisible = await this.driver.executeScript(
          `const m = document.querySelector('[data-testid="add-family-modal"]');
           return m ? (m.offsetParent !== null || m.style.display !== 'none') : false;`
        );
        if (!modalVisible) {
          modalGone = true;
          break;
        }
      } catch (e) {
        // Ignore stale DOM
      }
      await this.driver.sleep(500);
    }

    if (!modalGone) {
      throw new Error('Add family member modal did not close within 25 seconds');
    }

    // Brief pause then refresh to get fresh Firestore data
    await this.driver.sleep(1000);
    await this.driver.navigate().refresh();
    await this.driver.sleep(2500);
  }

  /**
   * Finds a member card by its h3 name text (JS-based to avoid XPath whitespace issues)
   * then clicks the delete button within that card.
   */
  async deleteMember(name) {
    const deadline = Date.now() + 10000;
    let memberId = null;
    while (Date.now() < deadline && !memberId) {
      try {
        memberId = await this.driver.executeScript(
          `
          const name = arguments[0];
          const h3s = Array.from(document.querySelectorAll('h3'));
          const matchingH3 = h3s.find(el => el.textContent.trim() === name);
          if (!matchingH3) return null;
          let card = matchingH3.parentElement;
          while (card && card.tagName !== 'BODY') {
            if (card.dataset.testid && card.dataset.testid.startsWith('member-card-')) {
              return card.dataset.testid.replace('member-card-', '');
            }
            card = card.parentElement;
          }
          return null;
          `,
          name
        );
      } catch (e) {
        // Ignore script errors
      }
      if (!memberId) await this.driver.sleep(400);
    }
    if (!memberId) throw new Error(`Could not find member card "${name}" to delete`);
    
    // Click the delete button via Webdriver
    const deleteBtnSelector = `button[data-testid="delete-member-${memberId}"]`;
    await this.click(deleteBtnSelector);
    await this.acceptAlert();
    
    // Wait for real-time listener to remove card from DOM
    const cardSelector = `[data-testid="member-card-${memberId}"]`;
    await this.waitForNotVisible(cardSelector);
    
    // Give Firestore real-time listener additional time to settle without refreshing
    // (refreshing causes cache race condition where deleted member briefly reappears)
    await this.driver.sleep(2000);
  }

  /**
   * Checks if a member card with given name exists in the DOM using JS
   * to avoid XPath normalize-space() failures with React text nodes.
   * Increased timeout to 15s to handle Firestore sync latency after page refresh.
   */
  async checkMemberExists(name, timeout = 15000) {
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
      await this.driver.sleep(400);
    }
    return false;
  }

  /**
   * Waits until a member card with the given name is NOT in the DOM.
   * Used to verify deletion - polls until absent or timeout.
   * @param {string} name - The member name to check for absence
   * @param {number} timeout - Max ms to wait
   * @returns {Promise<boolean>} true if member is absent, false if still present after timeout
   */
  async checkMemberNotExists(name, timeout = 20000) {
    // Initial wait to let real-time listener settle before polling
    await this.driver.sleep(1000);
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        const found = await this.driver.executeScript(
          `return Array.from(document.querySelectorAll('h3')).some(el => el.textContent.trim() === arguments[0]);`,
          name
        );
        if (!found) return true;
      } catch (e) {
        // Ignore DOM errors during transitions
      }
      await this.driver.sleep(500);
    }
    return false;
  }
}
