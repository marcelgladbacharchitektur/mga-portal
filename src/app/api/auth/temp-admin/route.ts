import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // Temporary hardcoded admin check
    if (email === 'admin@mga-portal.com' && password === 'MGA-Portal2024!') {
      // Create a temporary session token
      const token = sign(
        {
          id: 'temp-admin-id',
          email: 'admin@mga-portal.com',
          name: 'Admin',
          role: 'ADMIN'
        },
        process.env.NEXTAUTH_SECRET || 'your-secret-key-here-please-change-in-production',
        { expiresIn: '24h' }
      )
      
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: 'temp-admin-id',
          email: 'admin@mga-portal.com',
          name: 'Admin',
          role: 'ADMIN'
        }
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Temp admin auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}