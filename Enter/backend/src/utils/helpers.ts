// Pagination helper
export function getPagination(page?: number, limit?: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(100, Math.max(1, limit || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

// Generate random string
export function generateId(prefix: string, length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = `${prefix}-`;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Sanitize object (remove undefined/null fields)
export function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

// Get today's date string
export function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Format response
export function formatResponse(data: unknown, message?: string) {
  return { success: true, message, data };
}

// Format error response
export function formatError(error: string) {
  return { success: false, error };
}
