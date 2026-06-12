import { Locator, Page } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly logoutLink: Locator;
  readonly loginUsernameInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('[id="customer.firstName"]');
    this.lastNameInput = page.locator('[id="customer.lastName"]');
    this.streetInput = page.locator('[id="customer.address.street"]');
    this.cityInput = page.locator('[id="customer.address.city"]');
    this.stateInput = page.locator('[id="customer.address.state"]');
    this.zipCodeInput = page.locator('[id="customer.address.zipCode"]');
    this.phoneInput = page.locator('[id="customer.phoneNumber"]');
    this.ssnInput = page.locator('[id="customer.ssn"]');
    this.usernameInput = page.locator('[id="customer.username"]');
    this.passwordInput = page.locator('[id="customer.password"]');
    this.confirmPasswordInput = page.locator('#repeatedPassword');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    
    this.logoutLink = page.getByRole('link', { name: 'Log Out' });
    this.loginUsernameInput = page.locator('input[name="username"]');
    this.loginPasswordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log In' });
  }

  async navigate(): Promise<void> {
    await this.page.goto('https://parabank.parasoft.com/parabank/register.htm');
  }

  async registerUser(user: any): Promise<void> {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.streetInput.fill(user.street);
    await this.cityInput.fill(user.city);
    await this.stateInput.fill(user.state);
    await this.zipCodeInput.fill(user.zipCode);
    await this.phoneInput.fill(user.phone);
    await this.ssnInput.fill(user.ssn);
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);
    await this.registerButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.loginUsernameInput.fill(username);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }
}