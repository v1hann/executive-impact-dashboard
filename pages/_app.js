import "../styles/globals.css";
import Link from "next/link";

export default function App({ Component, pageProps }) {
  return (
    <>
      <header className="header">
        <Link href="/" className="brand">📊 Executive Impact Dashboard</Link>
        <nav>
          <Link href="/">Search</Link>
          <Link href="/tracker">Leadership Tracker</Link>
        </nav>
      </header>
      <div className="container">
        <Component {...pageProps} />
      </div>
    </>
  );
}
