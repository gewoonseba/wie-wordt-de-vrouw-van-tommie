import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page narrow">
      <section className="hero">
        <p className="eyebrow">Vrijgezellen Tommie</p>
        <h1>Wie wordt de vrouw van Tommie?</h1>
        <p>
          Live scores, date eligibility, physical card draw tracking, and
          Tommie&apos;s honeymoon money target in one realtime dashboard.
        </p>
        <div className="actions">
          <Link className="button" href="/admin">
            Admin dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
