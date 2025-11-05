/**
 * Edge function guardrails: timeout, input validation, error handling
 * Import this in Supabase Edge Functions
 */

interface GuardrailOptions {
  maxExecutionTime?: number; // milliseconds
  maxPayloadSize?: number; // bytes
  requireAuth?: boolean;
}

export function createGuardrails(options: GuardrailOptions = {}) {
  const {
    maxExecutionTime = 30000, // 30s default
    maxPayloadSize = 1024 * 1024, // 1MB default
    requireAuth = true,
  } = options;

  return {
    /**
     * Wraps handler with timeout
     */
    withTimeout<T extends (...args: any[]) => Promise<any>>(
      handler: T
    ): T {
      return (async (...args: any[]) => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Function execution timeout')),
            maxExecutionTime
          )
        );

        return Promise.race([handler(...args), timeoutPromise]);
      }) as T;
    },

    /**
     * Validates request payload size
     */
    validatePayloadSize(body: string | null): void {
      if (!body) return;
      const size = new TextEncoder().encode(body).length;
      if (size > maxPayloadSize) {
        throw new Error(
          `Payload too large: ${size} bytes (max: ${maxPayloadSize})`
        );
      }
    },

    /**
     * Validates authentication (when required)
     */
    async validateAuth(
      supabaseClient: any,
      headers: Headers
    ): Promise<{ user: any }> {
      if (!requireAuth) return { user: null };

      const authHeader = headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }

      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error || !user) {
        throw new Error('Unauthorized');
      }

      return { user };
    },
  };
}
