import { NotFoundError, ValidationError } from './errors';

export type RestaurantInput = {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
};

/** Parse and validate the complete restaurant representation used by POST/PUT. */
export async function parseRestaurantInput(req: Request): Promise<RestaurantInput> {
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
  const name = fields.name;

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Name is required and must be a non-empty string');
  }

  return {
    name: name.trim(),
    cuisine: optionalString(fields, 'cuisine'),
    address: optionalString(fields, 'address'),
    rating: optionalRating(fields.rating),
  };
}

/** Item routes treat malformed IDs as absent resources, per the API contract. */
export function parseRestaurantId(id: string): number {
  if (!/^\d+$/.test(id)) {
    throw new NotFoundError();
  }

  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new NotFoundError();
  }

  return parsed;
}

function optionalString(fields: Record<string, unknown>, field: string): string | null {
  const value = fields[field];
  if (value === undefined || value === null) return null;

  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string or null`);
  }

  return value.trim();
}

function optionalRating(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new ValidationError('Rating must be a number between 0 and 5');
  }

  return value;
}
