import { Page, Locator, test } from '@playwright/test';

export class AccountPage {
  private readonly openAccountLink: Locator;
  private readonly openAccountButton: Locator;
  private readonly overviewLink: Locator;
  private readonly transferLink: Locator;
  private readonly amountInput: Locator;
  private readonly fromAccountDropdown: Locator;
  private readonly toAccountDropdown: Locator;
  private readonly transferButton: Locator;
  private readonly findTransactionsLink: Locator; 
  private readonly updateProfileLink: Locator;
  private readonly lastNameInput: Locator;
  private readonly updateButton: Locator;

  // Loan Request Locators
  private readonly requestLoanLink: Locator;
  private readonly loanAmountInput: Locator;
  private readonly downPaymentInput: Locator;
  private readonly applyNowButton: Locator;
  public readonly loanStatusLabel: Locator; 

  constructor(private readonly page: Page) {
    this.openAccountLink = page.getByRole('link', { name: 'Open New Account' });
    this.openAccountButton = page.getByRole('button', { name: 'Open New Account' });
    this.overviewLink = page.getByRole('link', { name: 'Accounts Overview' });
    this.transferLink = page.getByRole('link', { name: 'Transfer Funds' });
    this.amountInput = page.locator('#amount');
    this.fromAccountDropdown = page.locator('#fromAccountId');
    this.toAccountDropdown = page.locator('#toAccountId');
    this.transferButton = page.getByRole('button', { name: 'Transfer' });
    this.findTransactionsLink = page.getByRole('link', { name: 'Find Transactions' }); 
    this.updateProfileLink = page.getByRole('link', { name: 'Update Contact Info' });
    this.lastNameInput = page.locator('[id="customer.lastName"]');
    this.updateButton = page.getByRole('button', { name: 'Update Profile' });

    this.requestLoanLink = page.getByRole('link', { name: 'Request Loan' });
    this.loanAmountInput = page.locator('#amount');
    this.downPaymentInput = page.locator('#downPayment');
    this.applyNowButton = page.getByRole('button', { name: 'Apply Now' });
    this.loanStatusLabel = page.locator('#loanStatus');
  }

  async openNewAccount(): Promise<void> {
    await test.step('↳ 🔘 Click "Open New Account" navigation link', async () => {
      await this.openAccountLink.click();
    });

    await this.fromAccountDropdown.locator('option').first().waitFor({ state: 'attached' });

    await test.step('↳ 🔘 Click "Open New Account" confirmation button', async () => {
      await this.openAccountButton.click();
    });

    await test.step('↳ 🔘 Verify "Account Opened!" confirmation banner', async () => {
      await this.page.getByRole('heading', { name: 'Account Opened!' }).waitFor();
    });
  }

  async transferFunds(amount: string, fromIdx: number = 0, toIdx: number = 1): Promise<void> {
    await test.step('↳ 🔘 Click "Transfer Funds" navigation link', async () => {
      await this.transferLink.click();
    });

    await this.toAccountDropdown.locator('option').nth(1).waitFor({ state: 'attached' });
    
    await test.step(`↳ 🔘 Fill out Transfer "Amount" with data: "$${amount}"`, async () => {
      await this.amountInput.fill(amount);
    });

    await test.step(`↳ 🔘 Select source account option index [From: ${fromIdx}]`, async () => {
      await this.fromAccountDropdown.selectOption({ index: fromIdx });
    });

    await test.step(`↳ 🔘 Select target account option index [To: ${toIdx}]`, async () => {
      await this.toAccountDropdown.selectOption({ index: toIdx });
    });
    
    await test.step('↳ 🔘 Click "Transfer" confirmation button', async () => {
      await this.transferButton.click();
    });
    
    await this.page.waitForTimeout(1000); 
  }

  async viewOverview(): Promise<void> {
    await test.step('↳ 🔘 Click "Accounts Overview" navigation link', async () => {
      await this.overviewLink.click();
    });
  }

  getAccountBalanceLocator(accountId: string): Locator {
    const accountRow = this.page.locator('tr', { hasText: accountId });
    return accountRow.locator('td').nth(1);
  }

  async findTransactions(): Promise<void> {
    await test.step('↳ 🔘 Click "Find Transactions" navigation link', async () => {
      await this.findTransactionsLink.click();
    });
  }

  async updateLastName(newName: string): Promise<void> {
    await test.step('↳ 🔘 Click "Update Contact Info" navigation link', async () => {
      await this.updateProfileLink.click();
    });
    
    await test.step(`↳ 🔘 Update "Last Name" field with data: "${newName}"`, async () => {
      await this.lastNameInput.fill(newName);
    });

    await test.step('↳ 🔘 Click "Update Profile" button', async () => {
      await this.updateButton.click();
    });
  }

  async goToLoanRequestPage(): Promise<void> {
    await test.step('↳ 🔘 Click "Request Loan" navigation link', async () => {
      await this.requestLoanLink.click();
    });
  }

  async applyForLoan(amount: string, downPayment: string): Promise<void> {
    await test.step(`↳ 🔘 Fill out "Loan Amount" requested: "$${amount}"`, async () => {
      await this.loanAmountInput.fill(amount);
    });

    await test.step(`↳ 🔘 Fill out "Down Payment" allocation: "$${downPayment}"`, async () => {
      await this.downPaymentInput.fill(downPayment);
    });

    await test.step('↳ 🔘 Click "Apply Now" submission button', async () => {
      await this.applyNowButton.click();
    });
  }
}