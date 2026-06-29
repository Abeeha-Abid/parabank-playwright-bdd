import { test, expect, APIRequestContext } from '@playwright/test';
import userData from '../data/userData.json'; 

let dynamicUsername: string;
let dynamicSsn: string;
let customerId: string;
let accountId: string;
let newAccountId: string;
let sharedContext: APIRequestContext; 

test.describe('ParaBank User Management API Suite @regression @sanity', () => {
  // 💡 PLAYWRIGHT BEST PRACTICE: Stop sequential execution immediately if an upstream dependency test fails
  test.describe.configure({ mode: 'serial' });

  const registerData = userData.register;

  test.beforeAll(async ({ playwright }) => {
    const uniqueId = Math.floor(1000 + Math.random() * 9000); 
    dynamicUsername = `Ali_${uniqueId}`; 
    dynamicSsn = `999-12-${uniqueId}`;

    sharedContext = await playwright.request.newContext({
      baseURL: 'https://parabank.parasoft.com'
    });
  });

  test.afterAll(async () => {
    await sharedContext.dispose();
  });

  // ==========================================
  // TEST CASE 1: CUSTOMER REGISTRATION
  // ==========================================
  test('Scenario 1: Should successfully register a new customer via Backend Form POST @api', async () => {
    await test.step('Given I have a valid customer profile configuration template from JSON data', async () => {
      await sharedContext.get('/parabank/register.htm');
    });

    let response = await test.step(`When I dispatch a backend Form POST request to register user "${dynamicUsername}"`, async () => {
      const res = await sharedContext.post('/parabank/register.htm', {
        form: {
          'customer.firstName': registerData.firstName,
          'customer.lastName': registerData.lastName,
          'customer.address.street': registerData.street,
          'customer.address.city': registerData.city,
          'customer.address.state': registerData.state,
          'customer.address.zipCode': registerData.zipCode,
          'customer.phoneNumber': registerData.phone,
          'customer.ssn': dynamicSsn,
          'customer.username': dynamicUsername,
          'customer.password': registerData.password,
          'repeatedPassword': registerData.password
        },
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      });

      // Extract text content inside the step to create the dropdown and show response log
      const htmlBody = await res.text();
      console.log(`Response Received (HTML Snippet): ${htmlBody.substring(0, 300)}...`);
      return res;
    });

    await test.step('Then the registration backend API service response status should be 200 OK', async () => {
      expect(response.status()).toBe(200);
    });

    await test.step('Then the HTML confirmation body payload should verify account creation success', async () => {
      const htmlContent = await response.text();
      expect(htmlContent).toContain('Your account was created successfully. You are now logged in.');
    });
  });

  // ==========================================
  // TEST CASE 2: ACCOUNT OVERVIEW & ID CAPTURE
  // ==========================================
  test('Scenario 2: Account Overview Dashboard Verification @api', async () => {
    await test.step('When I authenticating against the REST Login service to retrieve the true Customer ID', async () => {
      const loginResponse = await sharedContext.get(`/parabank/services/bank/login/${dynamicUsername}/${registerData.password}`, {
        headers: { 'Accept': 'application/json' }
      });
      expect(loginResponse.status()).toBe(200);
      
      const customerData = await loginResponse.json();
      customerId = customerData.id; 
      
      // Console log inside the step forces the dropdown arrow and exposes the data
      console.log(`Response Received: ${JSON.stringify(customerData)}`);
    });

    const accountsResponse = await test.step('And I request the customer accounts list using the retrieved Customer ID', async () => {
      const res = await sharedContext.get(`/parabank/services/bank/customers/${customerId}/accounts`, {
        headers: { 'Accept': 'application/json' }
      });
      
      const accountsData = await res.json();
      console.log(`Response Received: ${JSON.stringify(accountsData)}`);
      return res;
    });

    await test.step('Then I should successfully retrieve the account list array metadata', async () => {
      expect(accountsResponse.status()).toBe(200);
      const accounts = await accountsResponse.json();
      
      expect(Array.isArray(accounts)).toBeTruthy();
      expect(accounts.length).toBeGreaterThan(0);
      
      accountId = accounts[0].id; 
      console.log(`Captured Primary Account ID: ${accountId}`);
    });
  });

  // ==========================================
  // TEST CASE 3: OPEN NEW ACCOUNT
  // ==========================================
  test('Scenario 3: Open New Account Verification @api', async () => {
    expect(customerId).toBeDefined();
    expect(accountId).toBeDefined();

    const openAccountResponse = await test.step('When I request the open new account endpoint to create a "SAVINGS" account', async () => {
      const res = await sharedContext.post(
        `/parabank/services/bank/createAccount?customerId=${customerId}&newAccountType=1&fromAccountId=${accountId}`, {
          headers: { 'Accept': 'application/json' }
        }
      );

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then the backend service should confirm the new savings account details', async () => {
      expect(openAccountResponse.status()).toBe(200);
      const newAccountData = await openAccountResponse.json();
      
      expect(newAccountData).toHaveProperty('id');
      expect(newAccountData.type).toBe('SAVINGS');
      
      newAccountId = newAccountData.id;
      console.log(`Successfully Created New Savings Account ID: ${newAccountId}`);
    });
  });

  // ==========================================
  // TEST CASE 4: TRANSFER FUNDS
  // ==========================================
  test('Scenario 4: Transfer Funds Between Accounts Verification @api', async () => {
    expect(accountId).toBeDefined();
    expect(newAccountId).toBeDefined();

    const transferAmount = '150.00';

    const transferResponse = await test.step('When I dispatch a POST request to transfer funds from primary to savings account', async () => {
      const res = await sharedContext.post(
        `/parabank/services/bank/transfer?fromAccountId=${accountId}&toAccountId=${newAccountId}&amount=${transferAmount}`, {
          headers: { 'Accept': 'text/plain,application/json' }
        }
      );

      const responseText = await res.text();
      console.log(`Response Received: ${responseText}`);
      return res;
    });

    await test.step('Then the transfer API service should return a 200 OK status', async () => {
      expect(transferResponse.status()).toBe(200);
      
      const responseText = await transferResponse.text();
      console.log(`Transfer Service Verification: ${responseText}`);
      expect(responseText).toContain(`Successfully transferred \$${transferAmount}`);
    });
  });

  // ==========================================
  // TEST CASE 5: ACCOUNT ACTIVITY & TRANSACTIONS
  // ==========================================
  test('Scenario 5: Account Transaction History Verification @api', async () => {
    expect(accountId).toBeDefined();

    const activityResponse = await test.step('When I request the transaction ledger for the primary account', async () => {
      const res = await sharedContext.get(`/parabank/services/bank/accounts/${accountId}/transactions`, {
        headers: { 'Accept': 'application/json' }
      });

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then I should successfully parse the transaction array metadata', async () => {
      expect(activityResponse.status()).toBe(200);
      
      const transactions = await activityResponse.json();
      console.log(`Total Transactions Found for Account ${accountId}: ${transactions.length}`);
      
      expect(Array.isArray(transactions)).toBeTruthy();
      expect(transactions.length).toBeGreaterThan(0);
      
      const firstTransaction = transactions[0];
      expect(firstTransaction).toHaveProperty('id');
      expect(firstTransaction).toHaveProperty('amount');
      expect(firstTransaction).toHaveProperty('description');
    });
  });

  // ==========================================
  // TEST CASE 6: BILL PAY SERVICE
  // ==========================================
  test('Scenario 6: Bill Pay Electronic Fund Disbursement Verification @api', async () => {
    expect(customerId).toBeDefined();
    expect(accountId).toBeDefined();

    const billAmount = '50.00';
    const payeeName = 'AcmeUtilities';

    const billPayResponse = await test.step('When I dispatch a POST request to issue a utility bill payment', async () => {
      const res = await sharedContext.post(
        `/parabank/services/bank/billpay?accountId=${accountId}&amount=${billAmount}`, {
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          data: {
            name: payeeName,
            address: {
              street: '123 Main St',
              city: 'Lahore',
              state: 'Punjab',
              zipCode: '54000'
            },
            phoneNumber: '03001234567',
            accountNumber: 88888
          }
        }
      );

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then the service response should confirm a successful billing transaction submission', async () => {
      expect(billPayResponse.status()).toBe(200);
      
      const billPayResult = await billPayResponse.json();
      console.log(`Bill Pay Status: ${billPayResult.status} | Payee: ${billPayResult.payeeName}`);
      
      expect(billPayResult.payeeName).toBe(payeeName);
      expect(billPayResult.amount).toBe(parseFloat(billAmount));
    });
  });

  // ==========================================
  // TEST CASE 7: REQUEST LOAN APPLICATION
  // ==========================================
  test('Scenario 7: Request Loan Application Processing Verification @api', async () => {
    expect(customerId).toBeDefined();
    expect(accountId).toBeDefined();

    const loanAmount = '5000';
    const downPayment = '500';

    const loanResponse = await test.step('When I submit a formal credit loan request to the backend service engine', async () => {
      const res = await sharedContext.post(
        `/parabank/services/bank/requestLoan?customerId=${customerId}&amount=${loanAmount}&downPayment=${downPayment}&fromAccountId=${accountId}`, {
          headers: { 'Accept': 'application/json' }
        }
      );

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then the credit underwriting system decision engine status metadata should resolve cleanly', async () => {
      expect(loanResponse.status()).toBe(200);
      
      const loanResult = await loanResponse.json();
      console.log(`Loan Application Decision Approved: ${loanResult.approved} | New Loan Account: ${loanResult.accountId}`);
         
      expect(loanResult).toHaveProperty('responseDate');
      expect(typeof loanResult.approved).toBe('boolean');
       
      if (loanResult.approved) {
        expect(loanResult.accountId).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================
  // TEST CASE 8: RETRIEVE ACCOUNT DETAILS
  // ==========================================
  test('Scenario 8: Retrieve Specific Account Details Verification @api', async () => {
    expect(newAccountId).toBeDefined();

    const accountDetailsResponse = await test.step('When I request details for the newly created savings account', async () => {
      const res = await sharedContext.get(`/parabank/services/bank/accounts/${newAccountId}`, {
        headers: { 'Accept': 'application/json' }
      });

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then the system should return correct metadata configuration for the savings account', async () => {
      expect(accountDetailsResponse.status()).toBe(200);
      
      const accountData = await accountDetailsResponse.json();
      console.log(`Retrieved Account ID: ${accountData.id} | Balance: ${accountData.balance} | Type: ${accountData.type}`);
      
      expect(accountData.id).toBe(newAccountId);
      expect(accountData.type).toBe('SAVINGS');
      expect(accountData.customerId).toBe(parseInt(customerId));
    });
  });

  // ==========================================
  // TEST CASE 9: RETRIEVE CUSTOMER PROFILE
  // ==========================================
  test('Scenario 9: Retrieve Customer Profile Details Verification @api', async () => {
    expect(customerId).toBeDefined();

    const customerProfileResponse = await test.step('When I request the profile metadata for the system customer ID', async () => {
      const res = await sharedContext.get(`/parabank/services/bank/customers/${customerId}`, {
        headers: { 'Accept': 'application/json' }
      });

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then the profile data should accurately match registration configurations', async () => {
      expect(customerProfileResponse.status()).toBe(200);
      
      const profileData = await customerProfileResponse.json();
      console.log(`Profile Data Verification for Customer: ${profileData.firstName} ${profileData.lastName}`);
      
      expect(profileData.id).toBe(parseInt(customerId));
      expect(profileData.firstName).toBe(registerData.firstName);
      expect(profileData.lastName).toBe(registerData.lastName);
    });
  });

  // ==========================================
  // TEST CASE 10: FILTER TRANSACTIONS BY AMOUNT
  // ==========================================
  test('Scenario 10: Query Transactions by Amount Filter Ledger @api', async () => {
    expect(accountId).toBeDefined();
    const targetAmount = '150.00'; 

    const filterResponse = await test.step('When I filter the primary account transaction ledger by the transfer value amount', async () => {
      const res = await sharedContext.get(`/parabank/services/bank/accounts/${accountId}/transactions/amount/${targetAmount}`, {
        headers: { 'Accept': 'application/json' }
      });

      const resJson = await res.json();
      console.log(`Response Received: ${JSON.stringify(resJson)}`);
      return res;
    });

    await test.step('Then the system should return a filtered array containing matching transactions', async () => {
      expect(filterResponse.status()).toBe(200);
      
      const filteredTransactions = await filterResponse.json();
      console.log(`Filtered Transactions Found Matching \$${targetAmount}: ${filteredTransactions.length}`);
      
      expect(Array.isArray(filteredTransactions)).toBeTruthy();
      expect(filteredTransactions.length).toBeGreaterThan(0);
      expect(filteredTransactions[0].amount).toBe(parseFloat(targetAmount));
    });
  });

  // ==========================================
  // TEST CASE 11: SESSION TERMINATION (LOGOUT)
  // ==========================================
  test('Scenario 11: Terminate Active Session via Web Logout @api', async () => {
    const logoutResponse = await test.step('When I dispatch an orchestration request to the session logout landing service', async () => {
      const res = await sharedContext.get('/parabank/logout.htm', {
        headers: { 
          'Accept': 'text/html,application/xhtml+xml,application/xml' 
        }
      });

      const htmlBody = await res.text();
      console.log(`Response Received (HTML Snippet): ${htmlBody.substring(0, 200)}...`);
      return res;
    });

    await test.step('Then the server should invalidate session context and drop back to login page presentation', async () => {
      expect(logoutResponse.status()).toBe(200);
      
      const htmlBody = await logoutResponse.text();
      expect(htmlBody).toContain('Customer Login');
      console.log('User Session context terminated cleanly. API Suite processing finalized.');
    });
  });
});