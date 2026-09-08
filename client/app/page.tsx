import { getRestaurants, getVisits } from '@/lib/apiClient';
import { VisitLog } from './visit-log';

// Server component. Fetches restaurants on each request and renders a plain
// list. There is no loading state, no empty state, and no error handling: if
// the API is down or returns something unexpected, this throws.
export default async function HomePage() {
  const [restaurants, visits] = await Promise.all([getRestaurants(), getVisits()]);

  return (
    <div className="screen-inner">
      <section className="tracker-intro" aria-labelledby="tracker-heading">
        <h1 id="tracker-heading">Where has Brennen been?</h1>
      </section>

      <VisitLog initialVisits={visits} restaurants={restaurants} />
    </div>
  );
}
