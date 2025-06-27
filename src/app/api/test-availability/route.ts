import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Test availability endpoint works',
    timestamp: new Date().toISOString()
  })
}