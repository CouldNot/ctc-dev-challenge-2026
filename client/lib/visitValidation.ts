import { ValidationError } from './errors';

export type VisitInput = {
  restaurantId: number;
  date: string;
  amountSpent: number | null;
  notes: string | null;
};

/** Parse and validate the payload for a new dining visit. */
export async function parseVisitInput(req: Request): Promise<VisitInput> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new ValidationError('Request body must be valid JSON');
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const fields = body as Record<string, unknown>;
  return {
    restaurantId: positiveInteger(fields.restaurantId, 'restaurantId'),
    date: calendarDate(fields.date),
    amountSpent: optionalAmountSpent(fields.amountSpent),
    notes: optionalNotes(fields.notes),
  };
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new ValidationError(`${field} must be a positive integer`);
  }

  return value;
}

function calendarDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError('date must be a valid YYYY-MM-DD date');
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ValidationError('date must be a valid YYYY-MM-DD date');
  }

  return value;
}

function optionalAmountSpent(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 99_999_999.99 ||
    Math.abs(value * 100 - Math.round(value * 100)) > Number.EPSILON * 100
  ) {
    throw new ValidationError(
      'amountSpent must be a non-negative amount with at most two decimal places'
    );
  }

  return value;
}

function optionalNotes(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== 'string') {
    throw new ValidationError('notes must be a string or null');
  }

  return value.trim();
}
