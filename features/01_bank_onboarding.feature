Feature: ParaBank Customer Onboarding and Verification

  @smoke @regression
  Scenario: 1. End-to-End Customer Registration Journey
    Given I am on the ParaBank registration page
    When I complete the registration form with a short dynamic username
    Then my account should be successfully created

  @smoke @regression
  Scenario: 2. Account Overview Dashboard Verification
    Given I have a successfully created account
    When I access the accounts overview section
    Then I should see my accounts overview dashboard

  @sanity @regression
  Scenario: 3. Open New Account Verification
    Given I am on the accounts overview dashboard
    When I open a new savings account
    Then the new account should be created successfully

  @sanity @regression
  Scenario: 4. Internal Fund Transfer Validation
    Given I click on the "Transfer Funds" navigation link
    When I transfer an amount of "200" between my accounts
    Then the transfer should complete successfully

  @sanity @regression
  Scenario: 5. Bill Payment Service Validation
    Given I click on the "Bill Pay" navigation link
    When I complete the bill payment form to "John Doe" for an amount of "150"
    Then the bill payment should complete successfully

  @sanity @regression
  Scenario: 6. Update Contact Information Validation
    Given I click on the "Update Contact Info" navigation link
    When I update my profile with the new contact details
    Then my profile should be updated successfully

  @sanity @regression
  Scenario: 7. Request a massive loan for guaranteed denial
    Given I click on the "Request Loan" navigation link
    When I submit a loan request for an amount of "100000" with a down payment of "0"
    Then the loan application should be rejected

  @sanity @regression
  Scenario: 8. Request a small loan for guaranteed approval
    Given I click on the "Request Loan" navigation link
    When I submit a loan request for an amount of "10" with a down payment of "10"
    Then the loan application should be approved

  @smoke @regression
  Scenario: 9. Customer Log Out Validation
    Given I am on the accounts overview dashboard
    When I click on the "Log Out" navigation link
    Then I should be successfully logged out

  @regression
  Scenario: 10. Invalid Login Authentication Validation
    Given I access the main homepage index
    When I attempt to log in with username "invalid_user_ali" and password "wrong_password"
    Then I should see an authentication error message "The username and password could not be verified."

  @regression
  Scenario: 11. Empty Login Credentials Validation
    Given I access the main homepage index
    When I attempt to log in with an empty username and password
    Then I should see an authentication error message "Please enter a username and password."

  # ==========================================
  # EXPERIMENTAL DASHBOARD BREAKDOWN TESTS
  # ==========================================

  @smoke @regression
  Scenario: 12. ParaBank Services Page Navigation
    Given I access the main homepage index
    When I click on the "Services" footer link
    Then I should see the services breakdown list

  @smoke @regression
  Scenario: 13. ParaBank About Us Page Navigation
    Given I access the main homepage index
    When I click on the "About Us" global header link
    Then I should see the company history description

  @smoke @regression
  Scenario: 14. Customer Care Contact Form Validation
    Given I access the main homepage index
    When I click on the "Contact" icon link
    Then the customer care form should load successfully

  @sanity @regression
  Scenario: 15. Access Public Landing Interface
    Given I access the main homepage index
    When I view the landing page contents
    Then the visitor login interface should be displayed

  @sanity @regression
  Scenario: 16. Find Transactions by Invalid ID Error Check
    Given I access the main homepage index
    When I search for an invalid system transaction ID "99999"
    Then it should display a transaction found success confirmation

  @regression
  Scenario: 17. Admin Page Database Status Verification
    Given I access the main homepage index
    When I click on the "Admin Page" navigation link
    Then I should see the database initialization controls

  @regression
  Scenario: 18. Admin Page Loan Provider Configuration Verification
    Given I click on the "Admin Page" navigation link
    When I view the administrative settings
    Then the default loan provider should be configured as "InvalidBank_Error"