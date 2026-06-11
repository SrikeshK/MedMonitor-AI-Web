import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import { logger } from './logger.js';

export class DriverFactory {
  /**
   * Builds and configures a Chrome WebDriver instance
   * @returns {Promise<ThenableWebDriver>}
   */
  static async createDriver() {
    logger.info('Initializing Chrome WebDriver...');
    
    // Ensure directories exist
    fs.mkdirSync(config.paths.screenshots, { recursive: true });
    fs.mkdirSync(config.paths.reports, { recursive: true });
    
    const options = new chrome.Options();
    
    if (config.headless) {
      logger.info('Running in HEADLESS mode');
      options.addArguments('--headless=new');
    }
    
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');
    
    // Configure default downloads folder (used for testing PDF downloads)
    options.setUserPreferences({
      'download.default_directory': config.paths.reports,
      'download.prompt_for_download': false,
      'download.directory_upgrade': true,
      'plugins.always_open_pdf_externally': true // Prevents Chrome from opening PDFs
    });

    const builder = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options);

    const driver = await builder.build();
    logger.info('WebDriver initialized successfully.');
    return driver;
  }

  /**
   * Helper to capture a screenshot on demand (or on failure)
   * @param {WebDriver} driver 
   * @param {string} namePrefix 
   */
  static async takeScreenshot(driver, namePrefix) {
    try {
      const screenshot = await driver.takeScreenshot();
      const sanitizedPrefix = namePrefix.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `${sanitizedPrefix}_${Date.now()}.png`;
      const filePath = path.join(config.paths.screenshots, filename);
      
      fs.writeFileSync(filePath, screenshot, 'base64');
      logger.info(`Screenshot captured: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('Failed to capture screenshot', error);
      return null;
    }
  }
}
