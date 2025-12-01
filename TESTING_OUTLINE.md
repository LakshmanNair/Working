# CSSU Rewards System - Testing Outline

This document provides a comprehensive testing checklist to ensure all functionality works correctly before submission.

---

## Pre-Testing Setup

### Environment Check
- [ ] Backend is running on Railway (or localhost:3001)
- [ ] Frontend is running on Vercel (or localhost:5173)
- [ ] Database is seeded with:
  - [ ] At least 10 users (regular, cashier, manager, superuser)
  - [ ] At least 30 transactions
  - [ ] At least 5 promotions
  - [ ] At least 5 events (if applicable)
- [ ] Environment variables are correctly set:
  - [ ] `VITE_API_BASE_URL` points to backend
  - [ ] `FRONTEND_ORIGIN` in backend points to frontend
  - [ ] `JWT_SECRET` is set
  - [ ] `DATABASE_URL` is set

---

## 1. Authentication & Authorization Testing

### Login Flow
- [ ] **Regular User Login**
  - [ ] Can log in with valid UTORid/password
  - [ ] Redirects to `/me/transactions` after login
  - [ ] User info (points, role) displays correctly in navbar
  - [ ] Cannot access manager/cashier pages

- [ ] **Cashier Login**
  - [ ] Can log in with valid UTORid/password
  - [ ] Redirects to `/cashier/transactions/new` after login
  - [ ] Can access cashier pages
  - [ ] Cannot access manager pages

- [ ] **Manager Login**
  - [ ] Can log in with valid UTORid/password
  - [ ] Redirects to `/manager/dashboard` after login
  - [ ] Can access all manager pages
  - [ ] Can access regular user pages

- [ ] **Superuser Login**
  - [ ] Can log in with valid UTORid/password
  - [ ] Has manager-level access
  - [ ] Can switch between interfaces (if implemented)

- [ ] **Invalid Login**
  - [ ] Shows error message for wrong password
  - [ ] Shows error message for non-existent user
  - [ ] Does not redirect on failed login

### Logout
- [ ] Logout button works
- [ ] Redirects to login page
- [ ] Token is cleared from localStorage
- [ ] Cannot access protected pages after logout

### Route Protection
- [ ] Unauthenticated users redirected to `/login`
- [ ] Regular users cannot access `/manager/*` routes
- [ ] Regular users cannot access `/cashier/*` routes
- [ ] Cashiers cannot access `/manager/*` routes
- [ ] Managers can access all routes

---

## 2. Regular User Features Testing

### Dashboard / My Transactions
- [ ] **Page Loads**
  - [ ] Shows list of user's transactions
  - [ ] Displays transaction type, amount, date correctly
  - [ ] Shows loading state while fetching

- [ ] **Filtering**
  - [ ] Filter by type (purchase, redemption, transfer, adjustment, event)
  - [ ] Filter by min amount
  - [ ] Filter by max amount
  - [ ] Clear filters button works
  - [ ] Filters persist during pagination

- [ ] **Pagination**
  - [ ] "Load More" button appears when more transactions exist
  - [ ] Loads next page correctly
  - [ ] Appends to existing list (infinite scroll style)

- [ ] **Transaction Display**
  - [ ] Each transaction shows correct type badge with color
  - [ ] Amount displays correctly (positive/negative)
  - [ ] Date/time displays in readable format
  - [ ] Remark displays if present
  - [ ] Spent amount shows for purchases

### Transfer Points
- [ ] **Form Validation**
  - [ ] Cannot submit with empty recipient UTORid
  - [ ] Cannot submit with amount <= 0
  - [ ] Cannot submit with amount > user's points
  - [ ] Shows error for invalid recipient

- [ ] **Successful Transfer**
  - [ ] Creates transfer transaction
  - [ ] Updates sender's points balance
  - [ ] Updates recipient's points balance
  - [ ] Shows success message
  - [ ] Redirects to transactions page
  - [ ] Transaction appears in both users' history

- [ ] **Error Handling**
  - [ ] Shows error for insufficient points
  - [ ] Shows error for invalid recipient
  - [ ] Shows error for network issues

### Redemption Request
- [ ] **Create Redemption**
  - [ ] Form validates amount > 0
  - [ ] Form validates amount <= user's points
  - [ ] Creates redemption transaction
  - [ ] Shows success message with QR code link
  - [ ] Transaction appears in history as "pending"

- [ ] **QR Code Display**
  - [ ] QR code page loads
  - [ ] QR code displays correctly
  - [ ] Transaction ID is visible
  - [ ] QR code contains correct data (can be scanned/decoded)

### Promotions View (Regular User)
- [ ] **Page Loads**
  - [ ] Shows all promotions
  - [ ] Displays promotion cards with correct info

- [ ] **Filtering**
  - [ ] "All Promotions" shows all
  - [ ] "Active Now" shows only active promotions
  - [ ] "Upcoming" shows only future promotions
  - [ ] Filter tabs highlight correctly

- [ ] **Promotion Cards**
  - [ ] Shows name, description, type
  - [ ] Shows benefits (min spending, rate, points)
  - [ ] Shows start/end dates
  - [ ] Status badge (Active/Upcoming/Expired) is correct
  - [ ] Cards have hover effects

---

## 3. Cashier Features Testing

### Create Transaction (Purchase)
- [ ] **Form Validation**
  - [ ] Cannot submit with empty UTORid
  - [ ] Cannot submit with spent amount <= 0
  - [ ] Shows error for non-existent user

- [ ] **Purchase Without Promotion**
  - [ ] Creates transaction correctly
  - [ ] Calculates base points (1 point per $0.25)
  - [ ] Updates user's points balance
  - [ ] Shows success message

- [ ] **Purchase With Promotion**
  - [ ] Can select active promotions
  - [ ] Applies promotion bonuses correctly
  - [ ] Records promotion usage
  - [ ] One-time promotions marked as used
  - [ ] Multiple promotions can be applied
  - [ ] Min spending requirement enforced

- [ ] **Transaction Display**
  - [ ] Created transaction appears in manager's list
  - [ ] Shows correct creator (cashier)
  - [ ] Shows applied promotions

### Create Transaction (Adjustment)
- [ ] **Form Validation**
  - [ ] Cannot submit with empty amount
  - [ ] Related transaction ID is optional

- [ ] **Successful Adjustment**
  - [ ] Creates adjustment transaction
  - [ ] Updates user's points (positive or negative)
  - [ ] Links to related transaction if provided
  - [ ] Shows success message

### Process Redemption
- [ ] **Lookup Transaction**
  - [ ] Can enter transaction ID
  - [ ] Shows error for non-existent transaction
  - [ ] Shows error if transaction is not a redemption
  - [ ] Shows error if already processed

- [ ] **Display Redemption Details**
  - [ ] Shows transaction ID, user, amount
  - [ ] Shows remark if present
  - [ ] Shows creation date

- [ ] **Process Redemption**
  - [ ] Confirmation dialog appears
  - [ ] Processes redemption successfully
  - [ ] Updates user's points balance
  - [ ] Marks transaction as processed
  - [ ] Shows processedBy user
  - [ ] Cannot process same redemption twice

---

## 4. Manager Features Testing

### Dashboard (Analytics)
- [ ] **Page Loads**
  - [ ] Shows summary cards (points given, redeemed, transactions, users)
  - [ ] Shows transaction breakdown by type
  - [ ] Shows chart with transaction data

- [ ] **Summary Cards**
  - [ ] Total points given is accurate
  - [ ] Total points redeemed is accurate
  - [ ] Total transactions count is correct
  - [ ] User counts are correct

- [ ] **Chart**
  - [ ] Chart displays correctly
  - [ ] Can change time range (7/30/90 days)
  - [ ] Data updates when range changes
  - [ ] Shows transaction count per day
  - [ ] Shows purchases and redemptions separately

### Transactions List
- [ ] **Page Loads**
  - [ ] Shows all transactions in table
  - [ ] Displays ID, type, user, amount, date, suspicious status
  - [ ] Shows loading state

- [ ] **Filtering**
  - [ ] Filter by type works
  - [ ] Filter by suspicious status works
  - [ ] Clear filters works
  - [ ] Filters persist during pagination

- [ ] **Pagination**
  - [ ] "Load More" works correctly
  - [ ] Appends new transactions

- [ ] **Navigation**
  - [ ] Clicking "View" navigates to transaction detail
  - [ ] Transaction ID links work

### Transaction Detail
- [ ] **Page Loads**
  - [ ] Shows all transaction details
  - [ ] Displays user, amount, type, dates
  - [ ] Shows related transaction link (if exists)
  - [ ] Shows promotions (if any)
  - [ ] Shows creator and processor (if any)

- [ ] **Toggle Suspicious**
  - [ ] Confirmation dialog appears
  - [ ] Toggles suspicious flag correctly
  - [ ] Button text updates
  - [ ] Status indicator updates

- [ ] **Create Adjustment**
  - [ ] Form appears when clicked
  - [ ] Can enter positive or negative amount
  - [ ] Can add remark
  - [ ] Creates adjustment transaction
  - [ ] Updates user's points
  - [ ] Links to original transaction
  - [ ] Form closes after success

### Promotions List
- [ ] **Page Loads**
  - [ ] Shows all promotions in grid
  - [ ] Displays name, description, type, dates
  - [ ] Shows active/inactive status

- [ ] **Promotion Cards**
  - [ ] Active promotions highlighted
  - [ ] Shows all promotion details
  - [ ] Edit and Delete buttons visible

- [ ] **Edit Promotion**
  - [ ] Navigates to edit page
  - [ ] Form pre-filled with existing data
  - [ ] Can update all fields
  - [ ] Saves changes correctly
  - [ ] Redirects to list after save

- [ ] **Delete Promotion**
  - [ ] Confirmation dialog appears
  - [ ] Deletes promotion successfully
  - [ ] Removes from list
  - [ ] Shows error if deletion fails

- [ ] **Create Promotion**
  - [ ] "Create Promotion" button navigates correctly
  - [ ] Form is empty (not pre-filled)
  - [ ] Can create new promotion
  - [ ] Redirects to list after creation

### Create/Edit Promotion
- [ ] **Form Validation**
  - [ ] Name is required
  - [ ] Description is required
  - [ ] Type is required
  - [ ] Start time is required
  - [ ] End time is required
  - [ ] Start time cannot be in past (for new)
  - [ ] End time must be after start time

- [ ] **Form Fields**
  - [ ] Can enter name, description
  - [ ] Can select type (automatic/one_time)
  - [ ] Can set start/end datetime
  - [ ] Can set min spending (optional)
  - [ ] Can set rate bonus (optional)
  - [ ] Can set fixed points (optional)
  - [ ] At least one bonus field should be filled

- [ ] **Create Promotion**
  - [ ] Creates promotion successfully
  - [ ] Appears in promotions list
  - [ ] Appears in regular user promotions page
  - [ ] Can be used in purchases

- [ ] **Edit Promotion**
  - [ ] Pre-fills all fields correctly
  - [ ] Updates promotion successfully
  - [ ] Changes reflect in list
  - [ ] Changes reflect in regular user view

- [ ] **Cancel**
  - [ ] Cancel button navigates back
  - [ ] Does not save changes

---

## 5. UI/UX Testing

### Responsive Design
- [ ] **Desktop (1920x1080)**
  - [ ] All pages display correctly
  - [ ] Tables/grids use full width appropriately
  - [ ] No horizontal scrolling

- [ ] **Tablet (768px)**
  - [ ] Layout adapts correctly
  - [ ] Cards stack appropriately
  - [ ] Forms remain usable

- [ ] **Mobile (375px)**
  - [ ] Navigation is accessible
  - [ ] Forms are usable
  - [ ] Tables scroll horizontally if needed
  - [ ] Text is readable

### Visual Consistency
- [ ] **Colors**
  - [ ] Consistent color scheme throughout
  - [ ] Transaction type colors are consistent
  - [ ] Status badges use correct colors
  - [ ] Buttons use consistent styling

- [ ] **Typography**
  - [ ] Headings are consistent
  - [ ] Body text is readable
  - [ ] Font sizes are appropriate

- [ ] **Spacing**
  - [ ] Consistent padding/margins
  - [ ] Cards have proper spacing
  - [ ] Forms have proper spacing

### Loading States
- [ ] Loading spinner appears during API calls
- [ ] Buttons show "Loading..." or are disabled
- [ ] No flickering or layout shifts

### Error Handling
- [ ] Error messages are clear and helpful
- [ ] Error messages can be dismissed
- [ ] Network errors are handled gracefully
- [ ] 401 errors redirect to login
- [ ] 403 errors show appropriate message

### Navigation
- [ ] Navbar displays correctly for each role
- [ ] All links work correctly
- [ ] Active page is indicated (if implemented)
- [ ] Back buttons work correctly
- [ ] Breadcrumbs work (if implemented)

---

## 6. Integration Testing

### End-to-End Flows

#### Purchase Flow
1. [ ] Cashier logs in
2. [ ] Cashier creates purchase for regular user
3. [ ] Purchase includes active promotion
4. [ ] User's points increase correctly
5. [ ] Transaction appears in manager's list
6. [ ] Transaction appears in user's history
7. [ ] Promotion usage is recorded

#### Redemption Flow
1. [ ] Regular user creates redemption request
2. [ ] QR code is generated
3. [ ] Cashier looks up redemption by ID
4. [ ] Cashier processes redemption
5. [ ] User's points decrease
6. [ ] Transaction marked as processed
7. [ ] Cannot process same redemption twice

#### Transfer Flow
1. [ ] User A transfers points to User B
2. [ ] User A's points decrease
3. [ ] User B's points increase
4. [ ] Both transactions appear in respective histories
5. [ ] Transfer shows in manager's list

#### Adjustment Flow
1. [ ] Manager views transaction detail
2. [ ] Manager creates adjustment
3. [ ] User's points update
4. [ ] Adjustment links to original transaction
5. [ ] Both transactions visible in manager's list

#### Promotion Flow
1. [ ] Manager creates promotion
2. [ ] Promotion appears in manager's list
3. [ ] Promotion appears in regular user's view (if active)
4. [ ] Cashier can use promotion in purchase
5. [ ] Manager can edit promotion
6. [ ] Manager can delete promotion

---

## 7. Edge Cases & Error Scenarios

### Transaction Edge Cases
- [ ] Cannot create purchase with negative spent amount
- [ ] Cannot create adjustment with zero amount
- [ ] Cannot transfer more points than user has
- [ ] Cannot redeem more points than user has
- [ ] Suspicious cashier transactions don't award points immediately

### Promotion Edge Cases
- [ ] Cannot use expired promotion
- [ ] Cannot use future promotion
- [ ] One-time promotion can only be used once per user
- [ ] Min spending requirement enforced
- [ ] Cannot create promotion with end before start
- [ ] Cannot create promotion starting in past (for new)

### User Edge Cases
- [ ] Cannot transfer to self (if prevented)
- [ ] Cannot create redemption with zero amount
- [ ] Points balance cannot go negative (if prevented)

### Data Validation
- [ ] Invalid date formats are rejected
- [ ] Invalid number formats are rejected
- [ ] Empty required fields are rejected
- [ ] SQL injection attempts are sanitized
- [ ] XSS attempts are prevented

---

## 8. Performance Testing

### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Transaction list loads in < 2 seconds
- [ ] Promotions list loads in < 2 seconds
- [ ] Forms submit in < 1 second

### Pagination Performance
- [ ] Loading more transactions is smooth
- [ ] No performance degradation with many transactions
- [ ] Infinite scroll works without lag

### Chart Performance
- [ ] Chart renders quickly
- [ ] Changing date range is responsive
- [ ] No lag when switching views

---

## 9. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile

### Features
- [ ] All JavaScript features work
- [ ] CSS styling renders correctly
- [ ] Forms work correctly
- [ ] Navigation works

---

## 10. Deployment Testing

### Production Environment
- [ ] Backend is accessible via Railway URL
- [ ] Frontend is accessible via Vercel URL
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled
- [ ] Environment variables are set correctly

### API Connectivity
- [ ] Frontend can reach backend API
- [ ] All API endpoints respond correctly
- [ ] Authentication works in production
- [ ] Database connections work

### Data Persistence
- [ ] Data persists after server restart
- [ ] Database migrations are applied
- [ ] Seed data is present

---

## 11. Security Testing

### Authentication
- [ ] JWT tokens are stored securely
- [ ] Tokens expire correctly
- [ ] Invalid tokens are rejected
- [ ] Password is not exposed in API responses

### Authorization
- [ ] Role-based access control works
- [ ] Users cannot access unauthorized routes
- [ ] API endpoints enforce permissions

### Input Validation
- [ ] SQL injection attempts fail
- [ ] XSS attempts are prevented
- [ ] Invalid data is rejected
- [ ] File uploads are validated (if applicable)

---

## 12. Documentation Verification

### INSTALL.md
- [ ] All setup steps are clear
- [ ] Environment variables are documented
- [ ] Deployment instructions are accurate
- [ ] Demo credentials are provided

### Code Comments
- [ ] Complex logic is commented
- [ ] API endpoints are documented
- [ ] Component props are clear

---

## Testing Checklist Summary

### Critical Paths (Must Work)
- [ ] Login/Logout
- [ ] Regular user: View transactions, transfer, redemption
- [ ] Cashier: Create purchase, process redemption
- [ ] Manager: View dashboard, manage transactions, manage promotions

### Nice-to-Have (Should Work)
- [ ] Filtering and pagination
- [ ] QR codes
- [ ] Analytics charts
- [ ] Responsive design

### Edge Cases (Should Handle)
- [ ] Invalid inputs
- [ ] Network errors
- [ ] Permission errors
- [ ] Data validation

---

## Post-Testing Actions

- [ ] Document any bugs found
- [ ] Fix critical bugs
- [ ] Re-test fixed bugs
- [ ] Update documentation if needed
- [ ] Prepare demo credentials
- [ ] Update WEBSITE.txt with production URL

---

**Last Updated**: December 2024

