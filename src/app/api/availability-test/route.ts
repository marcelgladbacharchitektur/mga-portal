import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Availability Test API ===')
    
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    console.log('Start:', start)
    console.log('End:', end)
    
    // Return dummy data
    const slots = [
      {
        start: '2025-06-23T09:00:00',
        end: '2025-06-23T10:30:00',
        available: true
      },
      {
        start: '2025-06-23T11:00:00',
        end: '2025-06-23T12:30:00',
        available: true
      },
      {
        start: '2025-06-23T14:00:00',
        end: '2025-06-23T15:30:00',
        available: true
      }
    ]
    
    return NextResponse.json({ slots })
  } catch (error: any) {
    console.error('Test API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}