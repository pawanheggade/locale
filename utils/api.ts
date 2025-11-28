
/**
 * A utility to retry an async function with exponential backoff.
 */
export const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;
            const isRetryable =
                (error.status && (error.status === 429 || error.status >= 500)) ||
                (error.message && (
                    error.message.toLowerCase().includes('rate limit') ||
                    error.message.toLowerCase().includes('server error') ||
                    error.message.toLowerCase().includes('failed to fetch')
                ));

            if (isRetryable && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.warn(`Retryable error detected. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw lastError;
            }
        }
    }
    throw lastError;
};

/**
 * Handles API errors by creating user-friendly error messages.
 */
export const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, error);

    if (!navigator.onLine) {
        return new Error("Network error. Please check your internet connection and try again.");
    }

    if (error && typeof error === 'object') {
        if ('status' in error) {
            const status = (error as any).status as number;
            if (status === 429) {
                return new Error(`We're experiencing high traffic. Please try again in a few moments.`);
            }
            if (status >= 500) {
                return new Error(`The service is currently unavailable. Please try again later.`);
            }
            if (status === 400) {
                 return new Error(`There was an issue with the request. If this persists, please contact support.`);
            }
        }
        if ('message' in error && typeof (error as any).message === 'string') {
            const message = (error as any).message.toLowerCase();
            if (message.includes('rate limit')) {
                return new Error(`You've made too many requests. Please wait a moment before trying again.`);
            }
            if (message.includes('api key')) {
                return new Error(`There is an issue with the API configuration. Please contact support.`);
            }
            if (message.includes('failed to fetch')) {
                 return new Error("Could not connect to the service. Please check your network connection.");
            }
        }
    }
    return new Error(`An unexpected error occurred while ${context}. Please try again.`);
};
