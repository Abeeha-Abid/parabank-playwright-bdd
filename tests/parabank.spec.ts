import { test, expect, Page } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { AccountPage } from '../pages/AccountPage';
import { BillPayPage } from '../pages/BillPayPage';
import testData from '../data/userData.json';



test.describe('ParaBank Workflows', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let registerPage: RegisterPage;
  let accountPage: AccountPage;
  let billPayPage: BillPayPage;
  
  const uniqueUsername = `AliUser${Date.now()}`;
  const dynamicUser = { ...testData.register, username: uniqueUsername };
  const billPay = {
    payeeName: 'John Doe',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    phone: '555-1234',
    account: '123456789',
    verifyAccount: '123456789',
    amount: '100.00',
  };

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    registerPage = new RegisterPage(sharedPage);
    accountPage = new AccountPage(sharedPage);
    billPayPage = new BillPayPage(sharedPage);
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('A. Login Failure - Empty Username and Password', async () => {
    await registerPage.navigate();
    await registerPage.login('', ''); 
    await expect(sharedPage.locator('.error')).toHaveText('Please enter a username and password.');
  });

  test('B. Login Failure - Invalid Credentials', async () => {
    await registerPage.navigate();
    await registerPage.login('FakeUser123', 'WrongPassword321'); 
    await expect(sharedPage.locator('.error')).toHaveText('The username and password could not be verified.');
  });

  test('1. User Registration', async () => {
    await registerPage.navigate();
    await registerPage.registerUser(dynamicUser);
  });

  test('2. New Account Creation', async () => {
    await accountPage.openNewAccount(); 
    await accountPage.viewOverview();
  });

  test('3. Transfer Funds & Verify Balances', async () => {
    await accountPage.viewOverview();
    await sharedPage.click('text=Open New Account');
    const firstAccountId = await sharedPage.locator('#fromAccountId option').first().getAttribute('value');
    
    await accountPage.viewOverview();
    if (!firstAccountId) throw new Error("Could not find source account ID!");

    const balanceLocator = accountPage.getAccountBalanceLocator(firstAccountId);
    const startingBalanceText = await balanceLocator.innerText();
    const startingBalance = parseFloat(startingBalanceText.replace('$', ''));

    await accountPage.transferFunds('200', 0, 1);
    await accountPage.viewOverview();

    const expectedEndingBalance = `$${(startingBalance - 200).toFixed(2)}`;
    await expect(balanceLocator).toHaveText(expectedEndingBalance);
  });

  test('4. Bill Pay', async () => {
    await billPayPage.payBill(billPay);
  });

  test('5. Update Profile', async () => {
    await accountPage.findTransactions();
    await accountPage.updateLastName('Abid');
  });

  // ========================================================
  // NEW: LOAN REQUEST CONDITIONAL TESTING
  // ========================================================

  test('6. Request Loan - Denied Scenario', async () => {
    await accountPage.goToLoanRequestPage();
    
    // Request a massive loan ($100,000) with $0 down payment -> Guaranteed Denial
    await accountPage.applyForLoan('100000', '0');
    
    // Verify that the bank's system rejected the application
    await expect(accountPage.loanStatusLabel).toHaveText('Denied');
  });

  test('7. Request Loan - Approved Scenario', async () => {
    await accountPage.goToLoanRequestPage();
    
    // Request a small loan ($100) with a realistic down payment ($10) -> Guaranteed Approval
    await accountPage.applyForLoan('100', '10');
    
    // Verify that the bank's system automatically approved it
    await expect(accountPage.loanStatusLabel).toHaveText('Approved');
  });

  // ========================================================

  test('8. Session Cycle (Logout & Login)', async () => {
    await registerPage.logout();
    await registerPage.login(dynamicUser.username, dynamicUser.password);
    await accountPage.viewOverview(); 
  });
});