// ============================================
// UNSEAF Email Validation Issue Debug Test
// ============================================

console.log('🧪 UNSEAF Email Validation Debug Test');
console.log('=====================================\n');

// Test the email generation function
const grantNumberToEmail = (grantNumber) => {
  const emailLocal = grantNumber.toLowerCase().replace('/', '-');
  return `${emailLocal}@internal.unseaf.org`;
};

console.log('📧 TESTING EMAIL GENERATION:\n');

// Test various grant number formats
const testGrantNumbers = [
  'UNSEAF-2025/GR-0010',  // The failing one
  'UNSEAF-2025/GR-0001',  // Working one
  'UNSEAF-2025/GR-9999',  // Test number
  'UNSEAF-2024/GR-0010',  // Different year
  'UNSEAF-2025/GR-1234'   // Different number
];

testGrantNumbers.forEach(grantNumber => {
  const email = grantNumberToEmail(grantNumber);
  console.log(`Grant: ${grantNumber} → Email: ${email}`);
  
  // Test email format validity
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailRegex.test(email);
  console.log(`  - Format valid: ${isValidFormat ? '✅' : '❌'}`);
  
  // Check for any special characters that might cause issues
  const hasSpecialChars = /[!#$%&'*+/=?^_`{|}~]/.test(email.split('@')[0]);
  console.log(`  - Special chars: ${hasSpecialChars ? '⚠️ YES' : '✅ NO'}`);
  
  // Check email length
  console.log(`  - Length: ${email.length} characters`);
  
  console.log('');
});

console.log('🔍 POTENTIAL ISSUES TO INVESTIGATE:\n');

console.log('1. SUPABASE EMAIL DOMAIN RESTRICTIONS:');
console.log('   - Supabase might block certain domains like "internal.unseaf.org"');
console.log('   - Try using a more standard domain for testing\n');

console.log('2. EMAIL FORMAT REQUIREMENTS:');
console.log('   - Some email providers require specific formats');
console.log('   - The hyphen-separated format might be causing issues\n');

console.log('3. SUPABASE PROJECT SETTINGS:');
console.log('   - Check if email confirmation is required');
console.log('   - Check if there are domain whitelist/blacklist settings\n');

console.log('4. EMAIL LENGTH LIMITATIONS:');
console.log('   - Some systems have email length limits');
console.log('   - Check if the email is too long\n');

console.log('💡 SUGGESTED SOLUTIONS:\n');

console.log('SOLUTION 1: Change Email Domain');
console.log('Replace "internal.unseaf.org" with a standard domain:');
const alternativeEmails = testGrantNumbers.map(grant => {
  const local = grant.toLowerCase().replace('/', '-');
  return `${local}@unseaf.test`;
});
alternativeEmails.forEach((email, index) => {
  console.log(`  ${testGrantNumbers[index]} → ${email}`);
});

console.log('\nSOLUTION 2: Simplified Email Format');
console.log('Use a simpler local part:');
const simplifiedEmails = testGrantNumbers.map(grant => {
  // Extract just the year and number: 2025-0010
  const parts = grant.match(/(\d{4}).*?(\d{4})/);
  if (parts) {
    return `user-${parts[1]}-${parts[2]}@unseaf.org`;
  }
  return grant.toLowerCase().replace(/[^a-z0-9]/g, '') + '@unseaf.org';
});
simplifiedEmails.forEach((email, index) => {
  console.log(`  ${testGrantNumbers[index]} → ${email}`);
});

console.log('\nSOLUTION 3: Use Sequential IDs');
console.log('Use simple sequential emails:');
testGrantNumbers.forEach((grant, index) => {
  console.log(`  ${grant} → user${String(index + 1).padStart(4, '0')}@unseaf.org`);
});

console.log('\n🧪 NEXT STEPS TO DEBUG:\n');
console.log('1. Check Supabase project authentication settings');
console.log('2. Try registering with a standard email format (e.g., test@gmail.com)');
console.log('3. Check browser network tab for the exact error response');
console.log('4. Look at Supabase authentication logs');
console.log('5. Try different domain formats');

console.log('\n📋 EMAIL FORMAT ANALYSIS:\n');
const problemEmail = 'unseaf-2025-gr-0010@internal.unseaf.org';
console.log(`Problem email: ${problemEmail}`);
console.log(`Length: ${problemEmail.length}`);
console.log(`Local part: ${problemEmail.split('@')[0]}`);
console.log(`Domain part: ${problemEmail.split('@')[1]}`);
console.log(`Contains hyphens: ${problemEmail.includes('-') ? 'YES' : 'NO'}`);
console.log(`Contains numbers: ${/\d/.test(problemEmail) ? 'YES' : 'NO'}`);
console.log(`Starts with letter: ${/^[a-zA-Z]/.test(problemEmail) ? 'YES' : 'NO'}`);

// Check if it matches RFC 5322 email format
const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
console.log(`RFC 5322 compliant: ${rfc5322Regex.test(problemEmail) ? 'YES' : 'NO'}`);

console.log('\n✅ Test completed!');