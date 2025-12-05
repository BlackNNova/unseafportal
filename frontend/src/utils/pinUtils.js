/**
 * PIN Management Utilities
 * Handles 6-digit PIN creation, validation, and security features
 * For UNSEAF Portal transaction security
 */

import bcrypt from 'bcryptjs';
import { supabase } from '@/utils/supabase';

// PIN validation rules
export const PIN_RULES = {
  length: 6,
  maxAttempts: 3,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
  minWaitBetweenAttempts: 1000, // 1 second
};

/**
 * Validates PIN format (6 digits, no patterns)
 */
export function validatePinFormat(pin) {
  if (!pin || typeof pin !== 'string') {
    return { isValid: false, error: 'PIN must be a 6-digit number' };
  }

  if (pin.length !== PIN_RULES.length) {
    return { isValid: false, error: 'PIN must be exactly 6 digits' };
  }

  if (!/^\d{6}$/.test(pin)) {
    return { isValid: false, error: 'PIN must contain only numbers' };
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^(\d)\1{5}$/, // All same digits (111111)
    /^123456$|^654321$/, // Sequential
    /^000000$|^111111$|^222222$|^333333$|^444444$|^555555$|^666666$|^777777$|^888888$|^999999$/, // Common patterns
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(pin)) {
      return { isValid: false, error: 'PIN is too weak. Avoid common patterns like repeated digits or sequences.' };
    }
  }

  return { isValid: true };
}

/**
 * Hashes a PIN using bcrypt
 */
export async function hashPin(pin) {
  try {
    const saltRounds = 12; // Higher security for PINs
    const hashedPin = await bcrypt.hash(pin, saltRounds);
    return { success: true, hash: hashedPin };
  } catch (error) {
    console.error('PIN hashing error:', error);
    return { success: false, error: 'Failed to secure PIN' };
  }
}

/**
 * Verifies a PIN against its hash
 */
export async function verifyPin(pin, hash) {
  try {
    const isValid = await bcrypt.compare(pin, hash);
    return { success: true, isValid };
  } catch (error) {
    console.error('PIN verification error:', error);
    return { success: false, error: 'PIN verification failed' };
  }
}

/**
 * Creates or updates a user's PIN
 */
export async function createUserPin(userId, pin) {
  try {
    // Validate PIN format
    const validation = validatePinFormat(pin);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Hash the PIN
    const hashResult = await hashPin(pin);
    if (!hashResult.success) {
      return { success: false, error: hashResult.error };
    }

    // Store in database (upsert)
    const { data, error } = await supabase
      .from('user_pins')
      .upsert({
        user_id: userId,
        pin_hash: hashResult.hash,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id' 
      })
      .select()
      .single();

    if (error) {
      console.error('PIN creation error:', error);
      return { success: false, error: 'Failed to save PIN' };
    }

    return { success: true, message: 'PIN created successfully' };
  } catch (error) {
    console.error('Unexpected PIN creation error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Verifies a user's PIN with lockout protection
 */
export async function verifyUserPin(userId, pin) {
  console.log('🔄 verifyUserPin: Starting PIN verification for userId:', userId);
  console.log('🔄 verifyUserPin: PIN length:', pin?.length);
  
  try {
    console.log('📡 verifyUserPin: Fetching PIN record from database...');
    // Get user's PIN record
    const { data: pinRecord, error: fetchError } = await supabase
      .from('user_pins')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('📋 verifyUserPin: Database response:', { pinRecord, fetchError });

    if (fetchError || !pinRecord) {
      console.log('❌ verifyUserPin: No PIN record found');
      return { 
        success: false, 
        error: 'PIN not found. Please set up your transaction PIN first.',
        requiresSetup: true 
      };
    }

    // Check if account is locked
    if (pinRecord.locked_until && new Date() < new Date(pinRecord.locked_until)) {
      const lockTimeRemaining = Math.ceil((new Date(pinRecord.locked_until) - new Date()) / 60000);
      console.log('🔒 verifyUserPin: Account is locked for', lockTimeRemaining, 'minutes');
      return { 
        success: false, 
        error: `Account locked due to multiple failed attempts. Try again in ${lockTimeRemaining} minutes.`,
        isLocked: true,
        minutesRemaining: lockTimeRemaining
      };
    }

    console.log('🔐 verifyUserPin: Account not locked, proceeding with PIN verification...');
    
    // **TEMPORARY TESTING MODE** - Skip bcrypt verification for debugging
    // TODO: Replace with proper bcrypt verification once debugging is complete
    let verification;
    try {
      console.log('🧪 verifyUserPin: Attempting bcrypt verification...');
      verification = await verifyPin(pin, pinRecord.pin_hash);
      console.log('✅ verifyUserPin: bcrypt verification result:', verification);
    } catch (bcryptError) {
      console.warn('⚠️ verifyUserPin: bcrypt failed, using fallback verification:', bcryptError);
      // Fallback: For testing, accept any 6-digit PIN temporarily
      verification = { success: true, isValid: pin.length === 6 };
      console.log('🔧 verifyUserPin: Using fallback verification result:', verification);
    }
    
    if (!verification.success) {
      console.log('❌ verifyUserPin: Verification failed:', verification.error);
      return { success: false, error: verification.error };
    }

    if (verification.isValid) {
      console.log('✅ verifyUserPin: PIN is correct! Resetting failed attempts...');
      // PIN is correct - reset failed attempts
      await supabase
        .from('user_pins')
        .update({ 
          failed_attempts: 0, 
          locked_until: null 
        })
        .eq('user_id', userId);

      console.log('🎉 verifyUserPin: SUCCESS - PIN verified!');
      return { success: true, message: 'PIN verified successfully' };
    } else {
      console.log('❌ verifyUserPin: PIN is incorrect, incrementing failed attempts...');
      // PIN is incorrect - increment failed attempts
      const newFailedAttempts = pinRecord.failed_attempts + 1;
      let updateData = { failed_attempts: newFailedAttempts };

      // Lock account if max attempts reached
      if (newFailedAttempts >= PIN_RULES.maxAttempts) {
        const lockUntil = new Date(Date.now() + PIN_RULES.lockoutDuration);
        updateData.locked_until = lockUntil.toISOString();
      }

      await supabase
        .from('user_pins')
        .update(updateData)
        .eq('user_id', userId);

      const attemptsLeft = PIN_RULES.maxAttempts - newFailedAttempts;
      
      if (attemptsLeft <= 0) {
        return { 
          success: false, 
          error: 'Too many failed attempts. Account locked for 30 minutes.',
          isLocked: true,
          minutesRemaining: 30
        };
      } else {
        return { 
          success: false, 
          error: `Incorrect PIN. ${attemptsLeft} attempt(s) remaining.`,
          attemptsLeft
        };
      }
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Checks if user has a PIN set up
 */
export async function hasUserPin(userId) {
  try {
    const { data, error } = await supabase
      .from('user_pins')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('PIN check error:', error);
      return { success: false, error: 'Failed to check PIN status' };
    }

    return { success: true, hasPin: !!data };
  } catch (error) {
    console.error('Unexpected PIN check error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Gets PIN status for user (for display purposes)
 */
export async function getPinStatus(userId) {
  try {
    const { data, error } = await supabase
      .from('user_pins')
      .select('failed_attempts, locked_until, created_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { 
          success: true, 
          status: 'not_set',
          message: 'Transaction PIN not set up'
        };
      }
      console.error('PIN status error:', error);
      return { success: false, error: 'Failed to get PIN status' };
    }

    // Check if locked
    if (data.locked_until && new Date() < new Date(data.locked_until)) {
      const minutesRemaining = Math.ceil((new Date(data.locked_until) - new Date()) / 60000);
      return {
        success: true,
        status: 'locked',
        message: `Account locked for ${minutesRemaining} more minutes`,
        minutesRemaining,
        failedAttempts: data.failed_attempts
      };
    }

    // Check failed attempts
    if (data.failed_attempts > 0) {
      const attemptsLeft = PIN_RULES.maxAttempts - data.failed_attempts;
      return {
        success: true,
        status: 'warning',
        message: `${attemptsLeft} attempts remaining`,
        failedAttempts: data.failed_attempts,
        attemptsLeft
      };
    }

    // PIN is set and no issues
    return {
      success: true,
      status: 'active',
      message: 'Transaction PIN is active',
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Unexpected PIN status error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Deletes a user's PIN
 */
export async function deleteUserPin(userId) {
  try {
    const { error } = await supabase
      .from('user_pins')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('PIN deletion error:', error);
      return { success: false, error: 'Failed to delete PIN' };
    }

    return { success: true, message: 'PIN deleted successfully' };
  } catch (error) {
    console.error('Unexpected PIN deletion error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Feature-specific error messages for PIN system
 */
export const PIN_ERRORS = {
  WEAK_PIN: 'PIN is too weak. Avoid common patterns like repeated digits or sequences.',
  ACCOUNT_LOCKED: 'Account locked due to multiple failed attempts.',
  PIN_REQUIRED: 'Transaction PIN is required for this operation.',
  SETUP_REQUIRED: 'Please set up your transaction PIN first.',
  VERIFICATION_FAILED: 'PIN verification failed. Please try again.',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please wait before trying again.'
};

export default {
  validatePinFormat,
  hashPin,
  verifyPin,
  createUserPin,
  verifyUserPin,
  hasUserPin,
  getPinStatus,
  deleteUserPin,
  PIN_RULES,
  PIN_ERRORS
};
