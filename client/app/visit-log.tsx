'use client';

import { FormEvent, useState } from 'react';
import type { Restaurant, VisitWithRestaurant } from '@/lib/types';

type VisitLogProps = {
  restaurants: Restaurant[];
  initialVisits: VisitWithRestaurant[];
};

export function VisitLog({ restaurants, initialVisits }: VisitLogProps) {
  const [visits, setVisits] = useState(initialVisits);
  const [restaurantId, setRestaurantId] = useState('');
  const [date, setDate] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          date,
          amountSpent: amountSpent === '' ? null : Number(amountSpent),
          notes: notes === '' ? null : notes,
        }),
      });
      const payload: VisitWithRestaurant | { error?: string } = await response.json();

      if (!response.ok) {
        setError('error' in payload ? payload.error ?? 'Could not log visit' : 'Could not log visit');
        return;
      }

      setVisits((currentVisits) => [payload as VisitWithRestaurant, ...currentVisits]);
      setDate('');
      setAmountSpent('');
      setNotes('');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <h2 className="mb-4 text-lg font-medium">Dining activity</h2>
        {visits.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            No visits logged yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {visits.map((visit) => (
              <li key={visit.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{visit.restaurantName}</span>
                  <span className="text-sm text-gray-500">
                    {visit.amountSpent === null ? '—' : `$${visit.amountSpent.toFixed(2)}`}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">{visit.date}</div>
                {visit.notes && <p className="mt-2 text-sm text-gray-600">{visit.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="h-fit rounded-lg border border-gray-200 bg-white p-4"
        onSubmit={submitVisit}
      >
        <h2 className="text-lg font-medium">Log a visit</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Restaurant
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={restaurantId}
              onChange={(event) => setRestaurantId(event.target.value)}
              required
            >
              <option value="">Select a restaurant</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Date
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Amount spent
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              inputMode="decimal"
              value={amountSpent}
              onChange={(event) => setAmountSpent(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Notes
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          className="mt-4 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Saving…' : 'Log visit'}
        </button>
      </form>
    </section>
  );
}
