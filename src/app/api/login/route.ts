import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (userId) {
      cookies().set('userId', userId, { httpOnly: true, path: '/' });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
