import { BasePage } from './base.page.js';

export class RegisterPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = 'input[data-testid="register-name-input"]';
    this.emailInput = 'input[data-testid="register-email-input"]';
    this.passwordInput = 'input[data-testid="register-password-input"]';
    this.confirmPasswordInput = 'input[data-testid="register-confirm-input"]';
    this.submitBtn = 'button[type="submit"]';
    this.signInLink = '//a[contains(text(), "Sign In")]';
    this.errorAlert = '//div[contains(@class, "bg-error/10")]';
  }

  async navigate() {
    await this.visit('/register');
  }

  async register(name, email, password, confirmPassword) {
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.type(this.confirmPasswordInput, confirmPassword);
    await this.click(this.submitBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorAlert);
  }

  async clickSignIn() {
    await this.click(this.signInLink);
  }
}
