import { Locator, Page, test } from '@playwright/test';

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
    await test.step('↳ 🔘 Click "Bill Pay" navigation link', async () => {
      await this.billPayLink.click();
    });

    await test.step(`↳ 🔘 Fill out Payee "Name" with data: "${payee.name}"`, async () => {
      await this.nameInput.fill(payee.name);
    });

    await test.step(`↳ 🔘 Fill out Payee Address "Street" and "City" locations`, async () => {
      await this.streetInput.fill(payee.street);
      await this.cityInput.fill(payee.city);
    });

    await test.step(`↳ 🔘 Fill out Payee "State" with data: "${payee.state}"`, async () => {
      await this.stateInput.fill(payee.state);
    });

    await test.step(`↳ 🔘 Fill out Payee Address Contact details ("Zip Code" & "Phone")`, async () => {
      await this.zipCodeInput.fill(payee.zipCode);
      await this.phoneInput.fill(payee.phone);
    });

    await test.step(`↳ 🔘 Fill out Payee "Account Number" with data: "${payee.account}"`, async () => {
      await this.accountInput.fill(payee.account);
      await this.verifyAccountInput.fill(payee.account);
    });

    await test.step(`↳ 🔘 Fill out Bill "Amount" with data: "$${payee.amount}"`, async () => {
      await this.amountInput.fill(payee.amount);
    });

    await test.step(`↳ 🔘 Click "Send Payment" submission button`, async () => {
      await this.sendPaymentButton.click();
    });
  }
}