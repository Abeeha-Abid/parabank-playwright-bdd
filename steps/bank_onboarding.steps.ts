import { createBdd } from 'playwright-bdd';
import { expect, Page } from '@playwright/test';
import userData from '../data/userData.json';
import billPayData from '../data/billPayData.json';
import { RegisterPage } from '../pages/RegisterPage';
import { AccountPage } from '../pages/AccountPage';
import { BillPayPage } from '../pages/BillPayPage';

const { Given, When, Then, AfterStep } = createBdd();

const randomId = Math.floor(1000 + Math.random() * 9000);
const uniqueUsername = `Ali${randomId}`;

let sharedPage: Page;

// Page Object instances handles
let registerPage: RegisterPage;
let accountPage: AccountPage;
let billPayPage: BillPayPage;

// ========================================================
// 📸 GLOBAL AUTOMATIC LOGGING & SCREENSHOT HOOK
// ========================================================
AfterStep(async ({ $testInfo, $step }) => {
  if (sharedPage && !sharedPage.isClosed()) {
    const screenshotBuffer = await sharedPage.screenshot({ fullPage: false });
    await $testInfo.attach(`Snapshot - ${$step.title}`, {
      body: screenshotBuffer,
      contentType: 'image/png',
    });
  }
});

// ========================================================
// 🛠️ SCENARIO 1 STEPS
// ========================================================
Given('I am on the ParaBank registration page', async ({ browser }) => {
  if (!sharedPage) {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  }
  registerPage = new RegisterPage(sharedPage);
  accountPage = new AccountPage(sharedPage);
  billPayPage = new BillPayPage(sharedPage);
  
  await registerPage.navigate();
});

When('I complete the registration form with a short dynamic username', async () => {
  const contextUserData = {
    ...userData.register,
    username: uniqueUsername
  };
  await registerPage.registerUser(contextUserData);
});

Then('my account should be successfully created', async () => {
  const welcomeMessage = sharedPage.locator('.title');
  await expect(welcomeMessage).toHaveText(`Welcome ${uniqueUsername}`, { timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIO 2 STEPS
// ========================================================
Given('I have a successfully created account', async () => {
  // Context placeholder: Safe state transition from Scenario 1
});

When('I access the accounts overview section', async () => {
  await accountPage.viewOverview();
});

Then('I should see my accounts overview dashboard', async () => {
  const overviewHeader = sharedPage.getByRole('heading', { name: 'Accounts Overview' });
  await expect(overviewHeader).toBeVisible({ timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIO 3 STEPS
// ========================================================
Given('I am on the accounts overview dashboard', async () => {
  // Context placeholder: Verification marker
});

When('I open a new savings account', async () => {
  await accountPage.openNewAccount();
});

Then('the new account should be created successfully', async () => {
  const successMessage = sharedPage.getByRole('heading', { name: 'Account Opened!' });
  await expect(successMessage).toBeVisible({ timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIO 4 STEPS
// ========================================================
Given('I click on the "Transfer Funds" navigation link', async () => {
  await sharedPage.getByRole('link', { name: 'Transfer Funds' }).click();
  await sharedPage.waitForSelector('#transferForm', { state: 'visible' });
});

When('I transfer an amount of {string} between my accounts', async ({}, amount: string) => {
  await accountPage.transferFunds(amount, 0, 1);
});

Then('the transfer should complete successfully', async () => {
  const confirmationHeader = sharedPage.getByRole('heading', { name: 'Transfer Complete!' });
  await expect(confirmationHeader).toBeVisible({ timeout: 10000 });
  
  const confirmationBody = sharedPage.locator('#showResult');
  await expect(confirmationBody).toContainText('$200.00');
});

// ========================================================
// 🛠️ SCENARIO 5 STEPS
// ========================================================
Given('I click on the "Bill Pay" navigation link', async () => {
  await sharedPage.getByRole('link', { name: 'Bill Pay' }).click();
  const formHeader = sharedPage.getByRole('heading', { name: 'Bill Payment Service' });
  await expect(formHeader).toBeVisible({ timeout: 10000 });
});

When('I complete the bill payment form to {string} for an amount of {string}', async ({}, payeeName: string, amount: string) => {
  const customPayeePayload = {
    name: billPayData.payee.name,
    street: billPayData.payee.street,
    city: billPayData.payee.city,
    state: billPayData.payee.state,
    zipCode: billPayData.payee.zipCode,
    phone: billPayData.payee.phone,
    account: billPayData.payee.accountNumber,
    amount: billPayData.amount
  };
  await billPayPage.payBill(customPayeePayload);
});

Then('the bill payment should complete successfully', async () => {
  const confirmationHeader = sharedPage.getByRole('heading', { name: 'Bill Payment Complete' });
  await expect(confirmationHeader).toBeVisible({ timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIO 6 STEPS
// ========================================================
Given('I click on the "Update Contact Info" navigation link', async () => {
  await sharedPage.getByRole('link', { name: 'Update Contact Info' }).click();
  const profileHeader = sharedPage.getByRole('heading', { name: 'Update Profile' });
  await expect(profileHeader).toBeVisible({ timeout: 10000 });
});

When('I update my profile with the new contact details', async () => {
  await accountPage.updateLastName(userData.register.lastName);
  const phoneField = sharedPage.locator('input[name="customer\\.phoneNumber"]');
  await phoneField.fill(userData.updateContact.newPhone);
  await sharedPage.locator('input[value="Update Profile"]').click();
});

Then('my profile should be updated successfully', async () => {
  const successMessage = sharedPage.locator('#updateProfileResult');
  await expect(successMessage).toContainText('Profile Updated', { timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIOS 7 & 8 STEPS
// ========================================================
Given('I click on the "Request Loan" navigation link', async () => {
  await accountPage.goToLoanRequestPage();
});

When('I submit a loan request for an amount of {string} with a down payment of {string}', async ({}, amount: string, downPayment: string) => {
  await accountPage.applyForLoan(amount, downPayment);
});

Then('the loan application should be rejected', async () => {
  await expect(accountPage.loanStatusLabel).toHaveText('Denied', { timeout: 10000 });
});

Then('the loan application should be approved', async () => {
  await expect(accountPage.loanStatusLabel).toHaveText('Approved', { timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIO 9 STEPS
// ========================================================
When('I click on the "Log Out" navigation link', async () => {
  await registerPage.logout();
});

Then('I should be successfully logged out', async () => {
  const loginButton = sharedPage.locator('input[value="Log In"]');
  await expect(loginButton).toBeVisible({ timeout: 10000 });
});

// ========================================================
// 🛠️ SCENARIOS 10 & 11 STEPS
// ========================================================
Given('I access the main homepage index', async () => {
  await sharedPage.goto('https://parabank.parasoft.com/parabank/index.htm');
});

When('I attempt to log in with username {string} and password {string}', async ({}, user: string, pass: string) => {
  await registerPage.login(user, pass);
});

When('I attempt to log in with an empty username and password', async () => {
  await registerPage.login('', '');
});

Then('I should see an authentication error message {string}', async ({}, expectedError: string) => {
  const errorElement = sharedPage.locator('p.error');
  const errorPattern = new RegExp(`${expectedError}|An internal error has occurred and has been logged`);
  await expect(errorElement).toContainText(errorPattern, { timeout: 10000 });
});

// ========================================================
// 🛠️ EXPERIMENTAL DASHBOARD BREAKDOWN TESTS (12 - 18)
// ========================================================

// --- Scenario 12 ---
When('I click on the "Services" footer link', async () => {
  await sharedPage.goto('https://parabank.parasoft.com/parabank/services.htm');
});

Then('I should see the services breakdown list', async () => {
  const servicesHeading = sharedPage.locator('span.heading');
  await expect(servicesHeading).toContainText('Available Services');
});

// --- Scenario 13 ---
When('I click on the "About Us" global header link', async () => {
  await sharedPage.goto('https://parabank.parasoft.com/parabank/about.htm');
});

Then('I should see the company history description', async () => {
  expect('Company History: Displayed').toBe('Simulated Dashboard Failure - History Missing');
});

// --- Scenario 14 ---
When('I click on the "Contact" icon link', async () => {
  await sharedPage.goto('https://parabank.parasoft.com/parabank/contact.htm');
});

Then('the customer care form should load successfully', async () => {
  expect('Customer Care Form Status: Active').toBe('Simulated Dashboard Failure - Form Timeout');
});

// --- Scenario 15 ---
When('I view the landing page contents', async () => {
  // Pure visual placeholder action step for BDD story logic compliance
});

Then('the visitor login interface should be displayed', async () => {
  expect('Login Form: Rendered').toBe('Simulated Dashboard Failure - UI Disruption');
});

// --- Scenario 16 ---
When('I search for an invalid system transaction ID {string}', async ({}, txId: string) => {
  await sharedPage.locator('input[name="username"]').fill(txId);
});

Then('it should display a transaction found success confirmation', async () => {
  expect('Transaction State: Empty').toBe('Transaction State: Confirmed Found');
});

// --- Scenario 17 ---
When('I click on the "Admin Page" navigation link', async () => {
  await sharedPage.goto('https://parabank.parasoft.com/parabank/admin.htm');
});

Then('I should see the database initialization controls', async () => {
  const adminHeader = sharedPage.locator('h1', { hasText: 'Administration' });
  await expect(adminHeader).toBeVisible();
});

// --- Scenario 18 ---
When('I view the administrative settings', async () => {
  // Pure visual placeholder action step for BDD story logic compliance
});

Then('the default loan provider should be configured as {string}', async ({}, provider: string) => {
  const administrationHeading = sharedPage.locator('h1', { hasText: 'Administration' });
  await expect(administrationHeading).toHaveText(provider, { timeout: 3000 });
});