import { NextResponse } from 'next/server';

/** Expected API error caused by a request the caller can correct. */
class ApiError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Restaurant not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

function isPostgresError(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof err.code === 'string'
  );
}

/**
 * Central error -> HTTP response mapper for the API route handlers. Call it
 * from a route's `catch` block so error handling lives in one place:
 *
 *   try {
 *     ...
 *   } catch (err) {
 *     return handleError(err);
 *   }
 *
 * Expected caller errors map to useful 4xx responses. Unexpected errors are
 * logged server-side but deliberately return a generic 500 response.
 */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  // PostgreSQL's unique-constraint error. Keep the database detail private.
  if (isPostgresError(err) && err.code === '23505') {
    return NextResponse.json(
      { error: 'A restaurant with that name already exists' },
      { status: 409 }
    );
  }

  console.error('Unhandled API error:', err);

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
