import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { NotFoundError, handleError } from '@/lib/errors';
import { toVisitWithRestaurant } from '@/lib/types';
import { parseVisitInput } from '@/lib/visitValidation';

/**
 * GET /api/visits
 * Returns dining visits newest first, with the associated restaurant name.
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v."restaurantId", v.date, v."amountSpent", v.notes,
              v.created_at AS "createdAt", r.name AS "restaurantName"
       FROM visits v
       JOIN restaurants r ON r.id = v."restaurantId"
       ORDER BY v.date DESC, v.created_at DESC`
    );

    return NextResponse.json(rows.map(toVisitWithRestaurant));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/visits
 * Records a new dining visit for an existing restaurant.
 */
export async function POST(req: Request) {
  try {
    const { restaurantId, date, amountSpent, notes } = await parseVisitInput(req);
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO visits ("restaurantId", date, "amountSpent", notes)
         SELECT $1, $2, $3, $4
         WHERE EXISTS (SELECT 1 FROM restaurants WHERE id = $1)
         RETURNING id, "restaurantId", date, "amountSpent", notes,
                   created_at AS "createdAt"
       )
       SELECT inserted.*, r.name AS "restaurantName"
       FROM inserted
       JOIN restaurants r ON r.id = inserted."restaurantId"`,
      [restaurantId, date, amountSpent, notes]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toVisitWithRestaurant(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
