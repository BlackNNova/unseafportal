export const normalizeUser = (user) => {
  console.log('🧪 TEST: Normalizing user:', user);
  
  const normalized = {
    ...user,
    full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    account_number: user.account_number || `ACC-${user.id}`,
    balance: parseFloat(user.balance) || 0,
    display_name: user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.full_name || user.email || 'Unknown User'
  };
  
  console.log('🧪 TEST: Normalized user:', normalized);
  return normalized;
};

export const validateUserProperties = (users) => {
  console.log('🧪 TEST: Validating user properties for', users.length, 'users');
  
  const requiredProps = ['id', 'first_name', 'last_name', 'email', 'account_status', 'kyc_status'];
  const issues = [];
  
  users.forEach(user => {
    requiredProps.forEach(prop => {
      if (!user[prop] && user[prop] !== 0) {
        issues.push(`User ${user.id}: Missing ${prop}`);
      }
    });
  });
  
  console.log('🧪 TEST: User validation issues:', issues);
  return issues;
};
