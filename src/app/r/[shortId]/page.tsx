import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { Container, Alert } from 'react-bootstrap';

// Force this page to be dynamically rendered on every request, disabling caching.
export const dynamic = 'force-dynamic';

type Props = {
  params: { shortId: string };
};

export default async function ShortIdPage({ params }: Props) {
  const db = await getDb();
  const link = await db.get('SELECT * FROM links WHERE shortId = ?', params.shortId);

  if (!link) {
    return (
      <Container className="vh-100 d-flex justify-content-center align-items-center">
        <Alert variant="danger">Link not found.</Alert>
      </Container>
    );
  }

  // Use robust ISO string comparison to avoid timezone and parsing issues.
  if (link.expiresAt) {
    // Parse stored ISO string into a Date and compare timestamps to avoid
    // string-based comparisons which can be incorrect across timezones.
    const expiresAtDate = new Date(link.expiresAt);
    if (isNaN(expiresAtDate.getTime()) || Date.now() > expiresAtDate.getTime()) {
      const formatted = isNaN(expiresAtDate.getTime()) ? 'unknown date' : expiresAtDate.toLocaleString();
      return (
        <Container className="vh-100 d-flex justify-content-center align-items-center">
          <Alert variant="warning">This link has expired. (Expired at: {formatted})</Alert>
        </Container>
      );
    }
  }

  // If the link is valid and not expired, perform the redirect
  redirect(link.originalUrl);

  return null;
}
