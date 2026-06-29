import { Locator, Page, test } from '@playwright/test';

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
    await test.step('↳ 🔘 Route browser context to ParaBank Registration portal', async () => {
      await this.page.goto('https://parabank.parasoft.com/parabank/register.htm');
    });
  }

  /**
   * Fills out the entire registration form. 
   * Every single field now explicitly passes its action and data to the custom dashboard reporter.
   */
  async registerUser(user: any): Promise<void> {
    await test.step(`↳ 🔘 Fill out "First Name" with data: "${user.firstName}"`, async () => {
      await this.firstNameInput.fill(user.firstName);
    });
    
    await test.step(`↳ 🔘 Fill out "Last Name" with data: "${user.lastName}"`, async () => {
      await this.lastNameInput.fill(user.lastName);
    });
    
    await test.step(`↳ 🔘 Fill out "Street Address" with data: "${user.street}"`, async () => {
      await this.streetInput.fill(user.street);
    });
    
    await test.step(`↳ 🔘 Fill out "City" with data: "${user.city}"`, async () => {
      await this.cityInput.fill(user.city);
    });
    
    await test.step(`↳ 🔘 Fill out "State" with data: "${user.state}"`, async () => {
      await this.stateInput.fill(user.state);
    });
    
    await test.step(`↳ 🔘 Fill out "Zip Code" with data: "${user.zipCode}"`, async () => {
      await this.zipCodeInput.fill(user.zipCode);
    });
    
    await test.step(`↳ 🔘 Fill out "Phone Number" with data: "${user.phone}"`, async () => {
      await this.phoneInput.fill(user.phone);
    });
    
    await test.step(`↳ 🔘 Fill out "SSN" with data: "${user.ssn}"`, async () => {
      await this.ssnInput.fill(user.ssn);
    });
    
    await test.step(`↳ 🔘 Fill out "Username" with data: "${user.username}"`, async () => {
      await this.usernameInput.fill(user.username);
    });
    
    await test.step(`↳ 🔘 Fill out "Password" with data: "${user.password}"`, async () => {
      await this.passwordInput.fill(user.password);
    });
    
    await test.step(`↳ 🔘 Fill out "Confirm Password" with data: "${user.password}"`, async () => {
      await this.confirmPasswordInput.fill(user.password);
    });
    
    await test.step(`↳ 🔘 Click "Register" button`, async () => {
      await this.registerButton.click();
    });
  }

  async logout(): Promise<void> {
    await test.step('↳ 🔘 Click "Log Out" navigation link', async () => {
      await this.logoutLink.click();
    });
  }

  async login(username: string, password: string): Promise<void> {
    await test.step(`↳ 🔘 Fill out Login "Username" with data: "${username}"`, async () => {
      await this.loginUsernameInput.fill(username);
    });

    await test.step('↳ 🔘 Fill out Login "Password"', async () => {
      await this.loginPasswordInput.fill(password);
    });

    await test.step('↳ 🔘 Click "Log In" button', async () => {
      await this.loginButton.click();
    });
  }
}