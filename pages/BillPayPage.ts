import { Locator, Page } from '@playwright/test';

export class BillPayPage {
  readonly page: Page;
  readonly billPayLink: Locator;
  readonly nameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly accountInput: Locator;
  readonly verifyAccountInput: Locator;
  readonly amountInput: Locator;
  readonly sendPaymentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billPayLink = page.getByRole('link', { name: 'Bill Pay' });
    this.nameInput = page.locator('input[name="payee.name"]');
    this.streetInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipCodeInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.accountInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.sendPaymentButton = page.getByRole('button', { name: 'Send Payment' });
  }

  async payBill(payee: any): Promise<void> {
    await this.billPayLink.click();
    await this.nameInput.fill(payee.name);
    await this.streetInput.fill(payee.street);
    await this.cityInput.fill(payee.city);
    await this.stateInput.fill(payee.state);
    await this.zipCodeInput.fill(payee.zipCode);
    await this.phoneInput.fill(payee.phone);
    await this.accountInput.fill(payee.account);
    await this.verifyAccountInput.fill(payee.account);
    await this.amountInput.fill(payee.amount);
    await this.sendPaymentButton.click();
  }
}