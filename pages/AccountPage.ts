import { Page, Locator } from '@playwright/test';

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

  // NEW: Loan Request Locators
  private readonly requestLoanLink: Locator;
  private readonly loanAmountInput: Locator;
  private readonly downPaymentInput: Locator;
  private readonly applyNowButton: Locator;
  public readonly loanStatusLabel: Locator; // Public so our test can assert against it

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

    // NEW: Initialize Loan Request Locators
    this.requestLoanLink = page.getByRole('link', { name: 'Request Loan' });
    this.loanAmountInput = page.locator('#amount');
    this.downPaymentInput = page.locator('#downPayment');
    this.applyNowButton = page.getByRole('button', { name: 'Apply Now' });
    this.loanStatusLabel = page.locator('#loanStatus');
  }

  // --- EXISTING ACTIONS ---
  async openNewAccount(): Promise<void> {
    await this.openAccountLink.click();
    await this.fromAccountDropdown.locator('option').first().waitFor({ state: 'attached' });
    await this.openAccountButton.click();
    await this.page.getByRole('heading', { name: 'Account Opened!' }).waitFor();
  }

  async transferFunds(amount: string, fromIdx: number = 0, toIdx: number = 1): Promise<void> {
    await this.transferLink.click();
    await this.toAccountDropdown.locator('option').nth(1).waitFor({ state: 'attached' });
    await this.amountInput.fill(amount);
    await this.fromAccountDropdown.selectOption({ index: fromIdx });
    await this.toAccountDropdown.selectOption({ index: toIdx });
    await this.transferButton.click();
    await this.page.waitForTimeout(1000); 
  }

  async viewOverview(): Promise<void> {
    await this.overviewLink.click();
  }

  getAccountBalanceLocator(accountId: string): Locator {
    const accountRow = this.page.locator('tr', { hasText: accountId });
    return accountRow.locator('td').nth(1);
  }

  async findTransactions(): Promise<void> {
    await this.findTransactionsLink.click();
  }

  async updateLastName(newName: string): Promise<void> {
    await this.updateProfileLink.click();
    await this.lastNameInput.fill(newName);
    await this.updateButton.click();
  }

  // --- NEW: LOAN REQUEST ACTIONS ---
  async goToLoanRequestPage(): Promise<void> {
    await this.requestLoanLink.click();
  }

  async applyForLoan(amount: string, downPayment: string): Promise<void> {
    await this.loanAmountInput.fill(amount);
    await this.downPaymentInput.fill(downPayment);
    await this.applyNowButton.click();
  }
}