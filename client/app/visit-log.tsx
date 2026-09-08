'use client';

import { FormEvent, useState } from 'react';
import type { Restaurant, VisitWithRestaurant } from '@/lib/types';

type VisitLogProps = {
  restaurants: Restaurant[];
  initialVisits: VisitWithRestaurant[];
};

export function VisitLog({ restaurants, initialVisits }: VisitLogProps) {
  const [visits, setVisits] = useState(initialVisits);
  const [restaurantOptions, setRestaurantOptions] = useState(restaurants);
  const [restaurantName, setRestaurantName] = useState('');
  const [date, setDate] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function findOrCreateRestaurantId(name: string): Promise<number> {
    const normalizedName = name.trim();
    const existing = restaurantOptions.find(
      (restaurant) => restaurant.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
    );

    if (existing) return existing.id;

    const response = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: normalizedName }),
    });
    const payload: Restaurant | { error?: string } = await response.json();

    if (response.ok) {
      const restaurant = payload as Restaurant;
      setRestaurantOptions((current) => [...current, restaurant]);
      return restaurant.id;
    }

    // A restaurant with this name may have been created in another tab after
    // this page loaded. Refresh once and reuse it rather than showing an error.
    if (response.status === 409) {
      const restaurantsResponse = await fetch('/api/restaurants');
      if (restaurantsResponse.ok) {
        const refreshedRestaurants = (await restaurantsResponse.json()) as Restaurant[];
        const matchingRestaurant = refreshedRestaurants.find(
          (restaurant) => restaurant.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
        );

        if (matchingRestaurant) {
          setRestaurantOptions(refreshedRestaurants);
          return matchingRestaurant.id;
        }
      }
    }

    throw new Error('error' in payload ? payload.error ?? 'Could not add restaurant' : 'Could not add restaurant');
  }

  async function submitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const restaurantId = await findOrCreateRestaurantId(restaurantName);
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
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
      setRestaurantName('');
      setDate('');
      setAmountSpent('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00.000Z`));
  }

  return (
    <section className="activity-layout" aria-label="Dining activity tracker">
      <div className="activity-panel">
        <div className="panel-heading">
          <div>
            <h2>Activity log</h2>
          </div>
          <span className="live-badge"><span aria-hidden="true" /> Online</span>
        </div>

        {visits.length === 0 ? (
          <p className="empty-state">
            No visits logged yet.
          </p>
        ) : (
          <ul className="activity-list">
            {visits.map((visit) => (
              <li key={visit.id} className="activity-entry">
                <span className="activity-node" aria-hidden="true" />
                <div className="activity-entry__meta">
                  <span>Report {visit.id.toString().padStart(3, '0')}</span>
                  <time dateTime={visit.date}>{formatDate(visit.date)}</time>
                </div>
                <div className="activity-entry__main">
                  <h3>{visit.restaurantName}</h3>
                  <span className="spend-amount">
                    {visit.amountSpent === null ? '—' : `$${visit.amountSpent.toFixed(2)}`}
                  </span>
                </div>
                {visit.notes && <p className="activity-notes">{visit.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="report-panel"
        onSubmit={submitVisit}
      >
        <div className="report-panel__header">
          <span className="report-icon" aria-hidden="true">+</span>
          <div>
            <h2>Log a visit</h2>
          </div>
        </div>

        <div className="report-fields">
          <label>
            <span>Restaurant</span>
            <input
              list="restaurant-options"
              value={restaurantName}
              onChange={(event) => setRestaurantName(event.target.value)}
              placeholder="Type a restaurant name"
              required
            />
            <datalist id="restaurant-options">
              {restaurantOptions.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.name} />
              ))}
            </datalist>
          </label>

          <label>
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Amount spent</span>
            <input
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

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </label>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="report-submit"
          disabled={isSubmitting}
          type="submit"
        >
          <span>{isSubmitting ? 'Transmitting…' : 'Submit report'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
}
