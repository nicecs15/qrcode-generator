import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { nanoid } from 'nanoid';
import qrcode from 'qrcode';

// Helper function to format WiFi data
const formatWifi = (data: { ssid: string; password?: string; encryption: 'WPA' | 'WEP' | 'nopass' }): string => {
    const { ssid, password, encryption } = data;
    const escapedSsid = ssid.replace(/([\\;,:"])/g, '\\$1');
    const escapedPassword = password ? password.replace(/([\\;,:"])/g, '\\$1') : '';
    return `WIFI:T:${encryption};S:${escapedSsid};P:${escapedPassword};;`;
};

// Helper function to format email data
const formatEmail = (data: { to: string; subject?: string; body?: string }): string => {
    const { to, subject, body } = data;
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (body) params.append('body', body);
    const queryString = params.toString();
    return `mailto:${to}${queryString ? `?${queryString}` : ''}`;
};

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { qrDataType, data, colors } = body;

    if (!qrDataType || !data || !colors) {
      return NextResponse.json({ message: 'Invalid request payload' }, { status: 400 });
    }

    let qrDataString: string;
    let shortUrl: string | null = null;

    switch (qrDataType) {
      case 'url': {
        const { url, expiresAt } = data;
        if (!url) return NextResponse.json({ message: 'URL is required' }, { status: 400 });
        try { new URL(url); } catch (_) { return NextResponse.json({ message: 'Invalid URL format' }, { status: 400 }); }

        // Normalize and validate expiresAt if provided
        let normalizedExpiresAt: string | null = null;
        if (expiresAt) {
          const parsed = new Date(expiresAt);
          if (isNaN(parsed.getTime())) {
            return NextResponse.json({ message: 'Invalid expiration date format' }, { status: 400 });
          }
          // Do not allow creating links that are already expired
          if (parsed.getTime() <= Date.now()) {
            return NextResponse.json({ message: 'Expiration must be a future date/time' }, { status: 400 });
          }
          normalizedExpiresAt = parsed.toISOString();
        }

        const shortId = nanoid(8);
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        shortUrl = `${protocol}://${host}/r/${shortId}`;
        qrDataString = shortUrl;

        await db.run(
          'INSERT INTO links (shortId, originalUrl, expiresAt) VALUES (?, ?, ?)',
          [shortId, url, normalizedExpiresAt]
        );
        break;
      }

      case 'text':
        qrDataString = data.text || '';
        break;

      case 'wifi':
        qrDataString = formatWifi(data);
        break;

      case 'email':
        qrDataString = formatEmail(data);
        break;

      default:
        return NextResponse.json({ message: 'Unsupported QR code type' }, { status: 400 });
    }

    if (!qrDataString) {
        return NextResponse.json({ message: 'QR code data cannot be empty' }, { status: 400 });
    }

    const qrCodeDataUrl = await qrcode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: colors.dark || '#000000',
        light: colors.light || '#FFFFFF',
      },
    });

    const responsePayload: { qrCode: string; shortUrl?: string } = { qrCode: qrCodeDataUrl };
    if (shortUrl) {
      responsePayload.shortUrl = shortUrl;
    }

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('[API_GENERATE_ERROR]', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
