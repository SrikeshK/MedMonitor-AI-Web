import { BasePage } from './base.page.js';

export class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = 'input[data-testid="login-email"]';
    this.passwordInput = 'input[data-testid="login-password"]';
    this.loginBtn = 'button[data-testid="login-button"]';
    this.registerLink = 'a[data-testid="register-link"]';
    this.errorMsg = 'div[data-testid="login-error"]';
  }

  async navigate() {
    await this.visit('/login');
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.loginBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMsg);
  }

  async clickCreateAccount() {
    await this.click(this.registerLink);
  }
}
