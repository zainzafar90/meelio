/**
 * Retry utility with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors or 5xx server errors
    if (!error) return false;
    
    // Check for network errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }
    
    // Check for HTTP status codes
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }
    
    // Check for specific error messages
    if (error.message?.includes('Network') || 
        error.message?.includes('fetch')) {
      return true;
    }
    
    return false;
  }
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }
      
      // Log retry attempt
      console.warn(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms delay`,
        error
      );
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay with backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }
  
  throw lastError;
}

/**
 * Create a retryable version of an async function
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return ((...args: Parameters<T>) => withRetry(() => fn(...args), options)) as T;
}