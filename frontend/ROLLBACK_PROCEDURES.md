# Project Payments Rollback Procedures

## Overview
This document provides complete procedures to safely rollback the Project Payments feature to the legacy Transfer Page system if issues arise during deployment.

## Rollback Levels

### Level 1: Feature Flag Disable (Immediate - 30 seconds)
**Use this for: UI issues, user complaints, non-critical bugs**

```bash
# Method 1: Environment Variable (requires server restart)
# Set REACT_APP_FEATURE_PROJECT_PAYMENTS=false in production environment
# Then restart the application server

# Method 2: Development Override (for testing)
# In browser console:
localStorage.setItem('dev_project_payments', 'false');
# Then refresh the page
```

**Verification:**
- Users should see the legacy Transfer Page instead of Project Payments
- All existing transfers continue to work
- No data loss occurs

### Level 2: Component Restoration (Fast - 2 minutes)
**Use this for: Feature flag system failure, component issues**

**Steps:**
1. **Backup current Dashboard.jsx:**
   ```bash
   cp Dashboard.jsx Dashboard.jsx.bak.$(date +%Y%m%d_%H%M%S)
   ```

2. **Restore Dashboard.jsx to use TransferPage directly:**
   ```javascript
   // Change line 24 from:
   import FeatureFlagWrapper from './FeatureFlagWrapper';
   
   // Back to:
   import TransferPage from './TransferPage';
   
   // Change line 303 from:
   return <FeatureFlagWrapper />;
   
   // Back to:
   return <TransferPage />;
   ```

3. **Rebuild and deploy:**
   ```bash
   npm run build
   # Deploy dist/ folder to production
   ```

**Verification:**
- Transfer functionality works exactly as before
- All existing transfer data remains accessible
- Feature flags are bypassed entirely

### Level 3: Database Rollback (Moderate - 10 minutes)
**Use this for: Database constraint issues, trigger failures**

**Steps:**
1. **Remove Project Payments constraints:**
   ```sql
   -- Remove category constraint
   ALTER TABLE project_payments DROP CONSTRAINT IF EXISTS chk_project_category;
   
   -- Remove status constraint
   ALTER TABLE project_payments DROP CONSTRAINT IF EXISTS chk_project_status;
   
   -- Remove transaction number trigger
   DROP TRIGGER IF EXISTS set_project_payment_transaction_number ON project_payments;
   DROP FUNCTION IF EXISTS generate_project_payment_transaction_number();
   ```

2. **Preserve existing project_payments data:**
   ```sql
   -- Create backup table
   CREATE TABLE project_payments_backup AS 
   SELECT * FROM project_payments;
   
   -- Verify backup
   SELECT COUNT(*) FROM project_payments_backup;
   ```

3. **AdminDashboard fallback (if needed):**
   ```javascript
   // Restore AdminDashboard.jsx to query transfers table instead of project_payments
   // This step only needed if admin dashboard shows errors
   ```

**Verification:**
- Database queries work without constraint errors
- Admin dashboard shows all payment data
- No constraint violations occur during normal operations

### Level 4: Complete Project Rollback (Full - 30 minutes)
**Use this for: Complete system failure, data corruption concerns**

**Steps:**
1. **Remove all new components:**
   ```bash
   # Remove new components
   rm ProjectPaymentsPage.jsx
   rm FeatureFlagWrapper.jsx
   rm .env.local.example
   rm feature_flags_config.json
   ```

2. **Restore original file structure:**
   ```bash
   # Restore from backups
   cp Dashboard.jsx.bak.original Dashboard.jsx
   cp AdminDashboard.jsx.bak.original AdminDashboard.jsx  # if modified
   ```

3. **Database cleanup (ONLY if data corruption suspected):**
   ```sql
   -- WARNING: This removes all project payments data
   -- Only use if data corruption is confirmed
   
   -- Backup first
   CREATE TABLE project_payments_archive AS 
   SELECT * FROM project_payments;
   
   -- Optional: Clear project_payments table
   -- TRUNCATE project_payments; -- USE WITH EXTREME CAUTION
   ```

4. **Full rebuild and test:**
   ```bash
   npm run build
   # Test build locally before deploying
   # Verify all original functionality works
   ```

## Rollback Decision Matrix

| Issue Type | Recommended Level | Time to Restore | Data Loss Risk |
|------------|-------------------|-----------------|----------------|
| UI Bug/Styling | Level 1 | 30 seconds | None |
| Feature Flag Failure | Level 2 | 2 minutes | None |
| Database Constraint Error | Level 3 | 10 minutes | None |
| Component Loading Error | Level 2 | 2 minutes | None |
| Data Corruption | Level 4 | 30 minutes | Low (if backups exist) |
| Complete System Failure | Level 4 | 30 minutes | Low (if backups exist) |

## Testing Rollback Procedures

### Pre-Deployment Testing
```bash
# Test Level 1 rollback
REACT_APP_FEATURE_PROJECT_PAYMENTS=false npm start
# Verify TransferPage displays correctly

# Test Level 2 rollback
# Manually edit Dashboard.jsx as described above
npm run build
# Verify build succeeds and TransferPage works
```

### Post-Deployment Monitoring
- **Monitor application logs** for feature flag related errors
- **Check user feedback** for confusion about interface changes
- **Verify admin dashboard** shows project payments correctly
- **Monitor database performance** for constraint-related slowdowns

## Emergency Contacts
- **Development Team**: [Contact info]
- **Database Admin**: [Contact info]
- **System Administrator**: [Contact info]

## Backup Locations
- **Component Backups**: `./components/*.bak.*`
- **Database Backups**: `project_payments_backup` table
- **Configuration Backups**: `.env.local.example`

## Success Criteria for Rollback
- [ ] Users can access Transfer functionality
- [ ] No JavaScript console errors
- [ ] Database queries execute without constraint errors
- [ ] Admin dashboard displays payment data correctly
- [ ] Build process completes successfully
- [ ] No data loss detected

## Notes
- **Feature flags allow immediate rollback without code changes**
- **Database constraints can be removed without data loss**
- **All project_payments data is preserved during rollback**
- **Original TransferPage remains unchanged and functional**
- **Rollback can be performed incrementally to minimize disruption**

*Last Updated: $(date) - Phase 4 Deployment*