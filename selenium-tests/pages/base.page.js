import { By, until, Key } from 'selenium-webdriver';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Helper to map string selectors to Selenium By locators.
   * Treats string starting with '/' or '(' as XPath; otherwise CSS.
   * @param {string|By} locator 
   * @returns {By}
   */
  getLocator(locator) {
    if (typeof locator !== 'string') return locator;
    if (locator.startsWith('/') || locator.startsWith('(')) {
      return By.xpath(locator);
    }
    return By.css(locator);
  }

  /**
   * Navigates to a specific path relative to baseUrl
   * @param {string} path 
   */
  async visit(path = '') {
    const url = `${this.baseUrl}${path}`;
    logger.debug(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  /**
   * Retrieves current page URL path
   * @returns {Promise<string>}
   */
  async getCurrentPath() {
    const url = await this.driver.getCurrentUrl();
    return new URL(url).pathname;
  }

  /**
   * Finds a single element with explicit wait and stale element retry logic.
   * @param {string|By} locator 
   * @param {number} timeout 
   * @returns {Promise<WebElement>}
   */
  async find(locator, timeout = config.timeout) {
    const by = this.getLocator(locator);
    let attempts = 0;
    while (attempts < 3) {
      try {
        await this.waitForVisible(locator, timeout);
        return await this.driver.findElement(by);
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          attempts++;
          logger.debug(`Stale element encountered in find on ${locator}. Retrying attempt ${attempts}...`);
          await this.driver.sleep(500);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Failed to find element ${locator} after 3 attempts due to stale reference.`);
  }

  /**
   * Finds all matching elements.
   * @param {string|By} locator 
   * @returns {Promise<WebElement[]>}
   */
  async findAll(locator) {
    const by = this.getLocator(locator);
    return this.driver.findElements(by);
  }

  /**
   * Clicks an element with stale element retry logic
   * @param {string|By} locator 
   * @param {number} timeout 
   */
  async click(locator, timeout = config.timeout) {
    logger.debug(`Clicking: ${locator}`);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const element = await this.find(locator, timeout);
        await element.click();
        return;
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          attempts++;
          logger.debug(`Stale element encountered in click on ${locator}. Retrying attempt ${attempts}...`);
          await this.driver.sleep(500);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Failed to click element ${locator} after 3 attempts due to stale reference.`);
  }

  /**
   * Clicks an element via JavaScript execution to bypass click interception or animations
   * @param {string|By} locator 
   * @param {number} timeout 
   */
  async jsClick(locator, timeout = config.timeout) {
    logger.debug(`JS Clicking: ${locator}`);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const element = await this.find(locator, timeout);
        await this.driver.executeScript("arguments[0].click();", element);
        return;
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          attempts++;
          logger.debug(`Stale element encountered in jsClick on ${locator}. Retrying attempt ${attempts}...`);
          await this.driver.sleep(500);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Failed to JS click element ${locator} after 3 attempts due to stale reference.`);
  }

  /**
   * Clears and types text into input field with stale element retry logic
   * @param {string|By} locator 
   * @param {string} text 
   * @param {number} timeout 
   */
  async type(locator, text, timeout = config.timeout) {
    logger.debug(`Typing "${text}" into: ${locator}`);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const element = await this.find(locator, timeout);
        
        // Robust handling for HTML5 date inputs
        const inputType = await element.getAttribute('type');
        if (inputType === 'date') {
          await this.driver.executeScript(
            "const el = arguments[0]; " +
            "const val = arguments[1]; " +
            "const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; " +
            "setter.call(el, val); " +
            "el.dispatchEvent(new Event('input', { bubbles: true })); " +
            "el.dispatchEvent(new Event('change', { bubbles: true }));",
            element,
            text
          );
          return;
        }

        // For other inputs: clear value using React-compatible native setter to ensure state updates
        await this.driver.executeScript(
          "const el = arguments[0]; " +
          "const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; " +
          "setter.call(el, ''); " +
          "el.dispatchEvent(new Event('input', { bubbles: true })); " +
          "el.dispatchEvent(new Event('change', { bubbles: true }));",
          element
        );

        if (text !== undefined && text !== '') {
          await element.sendKeys(text);
        }
        return;
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          attempts++;
          logger.debug(`Stale element encountered in type on ${locator}. Retrying attempt ${attempts}...`);
          await this.driver.sleep(500);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Failed to type into element ${locator} after 3 attempts due to stale reference.`);
  }

  /**
   * Gets text content of an element with stale element retry logic
   * @param {string|By} locator 
   * @param {number} timeout 
   * @returns {Promise<string>}
   */
  async getText(locator, timeout = config.timeout) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const element = await this.find(locator, timeout);
        return await element.getText();
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          attempts++;
          logger.debug(`Stale element encountered in getText on ${locator}. Retrying attempt ${attempts}...`);
          await this.driver.sleep(500);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Failed to get text from element ${locator} after 3 attempts due to stale reference.`);
  }

  /**
   * Wait until element is visible
   * @param {string|By} locator 
   * @param {number} timeout 
   */
  async waitForVisible(locator, timeout = config.timeout) {
    const by = this.getLocator(locator);
    await this.driver.wait(async () => {
      try {
        const elements = await this.driver.findElements(by);
        if (elements.length === 0) return false;
        return await elements[0].isDisplayed();
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          return false;
        }
        throw error;
      }
    }, timeout, `Waiting for element to be visible: ${locator}`);
  }

  /**
   * Wait until element is removed or invisible
   * @param {string|By} locator 
   * @param {number} timeout 
   */
  async waitForNotVisible(locator, timeout = config.timeout) {
    const by = this.getLocator(locator);
    await this.driver.wait(async () => {
      try {
        const elements = await this.driver.findElements(by);
        if (elements.length === 0) return true;
        const visible = await elements[0].isDisplayed();
        return !visible;
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') {
          return true;
        }
        throw error;
      }
    }, timeout);
  }

  /**
   * Safely switches to a browser alert and accepts it.
   */
  async acceptAlert() {
    logger.debug('Accepting browser alert confirm dialog...');
    await this.driver.wait(until.alertIsPresent(), config.timeout);
    const alert = await this.driver.switchTo().alert();
    const text = await alert.getText();
    logger.debug(`Alert text: "${text}"`);
    await alert.accept();
    return text;
  }
}
