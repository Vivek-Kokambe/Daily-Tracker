import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Fixed slug for the single-user singleton document.
const SINGLETON_SLUG = 'singleton';

export async function GET() {
  try {
    const tracker = await db.tracker.findUnique({
      where: { slug: SINGLETON_SLUG },
    });
    if (!tracker) {
      return NextResponse.json({ data: null }, { status: 200 });
    }
    return NextResponse.json({ data: tracker }, { status: 200 });
  } catch (error) {
    console.error('[tracker GET]', error);
    return NextResponse.json({ error: 'Failed to load tracker data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const tracker = await db.tracker.upsert({
      where: { slug: SINGLETON_SLUG },
      update: {
        ...body,
        slug: SINGLETON_SLUG,
      },
      create: {
        ...body,
        slug: SINGLETON_SLUG,
      },
    });

    return NextResponse.json({ data: tracker }, { status: 200 });
  } catch (error) {
    console.error('[tracker PUT]', error);
    return NextResponse.json({ error: 'Failed to save tracker data' }, { status: 500 });
  }
}
