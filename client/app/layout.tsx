import type { Metadata } from 'next';
import { Handjet } from 'next/font/google';
import './globals.css';

const handjet = Handjet({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['ELGR', 'ELSH'],
  variable: '--font-handjet',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrennenTracker',
  description: 'Track restaurants, visits, and spending.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={handjet.variable}>
        <div className="console-shell">
          <header className="console-header">
            <div className="corner-badge corner-badge--left" aria-hidden="true">
              BT
            </div>
            <div className="brand-plaque">
              <span>Brennen Tracker</span>
            </div>
            <div className="corner-badge corner-badge--right" aria-hidden="true">
              <span className="pixel-cross">+</span>
            </div>
          </header>

          <div className="side-controls" aria-hidden="true">
            <span>A</span>
            <span>R</span>
          </div>

          <main className="console-screen">{children}</main>

          <footer className="console-footer">
            <span className="footer-tab">Activity tracker</span>
            <span className="footer-message">CTC Dev Challenge &apos;26 // Dale Dai</span>
            <span className="footer-tab">Dining archive</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
