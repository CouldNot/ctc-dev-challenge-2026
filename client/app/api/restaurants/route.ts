import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { parseRestaurantInput } from '@/lib/restaurantValidation';
import { toRestaurant } from '@/lib/types';

/**
 * GET /api/restaurants
 * Returns all restaurants.
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, cuisine, address, rating,
              created_at AS "createdAt"
       FROM restaurants
       ORDER BY created_at DESC`
    );
    // Map every row - raw rows don't match the contract (NUMERIC comes back
    // as a string, timestamps as Date objects). See lib/types.ts.
    return NextResponse.json(rows.map(toRestaurant));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/restaurants
 * Create a new restaurant.
 *
 * Validates the complete request body, inserts the row, and returns it with a
 * 201 status.
 */
export async function POST(req: Request) {
  try {
    const { name, cuisine, address, rating } = await parseRestaurantInput(req);
    const { rows } = await pool.query(
      `INSERT INTO restaurants (name, cuisine, address, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, cuisine, address, rating,
                 created_at AS "createdAt"`,
      [name, cuisine, address, rating]
    );

    return NextResponse.json(toRestaurant(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
