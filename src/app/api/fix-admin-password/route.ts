import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const email = 'admin@mga-portal.com'
    const password = 'MGA-Portal2024!'
    
    // Generate new hash
    const hash = await bcrypt.hash(password, 10)
    
    // Update user
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hash,
        role: 'ADMIN'
      }
    })
    
    // Verify it worked
    const updatedUser = await prisma.user.findUnique({
      where: { email },
      select: { email: true, password: true, role: true }
    })
    
    // Test the password
    const isValid = updatedUser?.password ? await bcrypt.compare(password, updatedUser.password) : false
    
    return NextResponse.json({
      success: true,
      message: 'Admin password updated',
      email: updatedUser?.email,
      role: updatedUser?.role,
      passwordValid: isValid,
      hint: 'Password is: MGA-Portal2024!'
    })
  } catch (error: any) {
    console.error('Error updating admin password:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Run this SQL in Supabase: UPDATE "User" SET password = \'$2b$10$xPvk/4/DEQL2yjsRaP/2wuNm3sz/Si1yjo9TRueTHoxMkc/diKItu\' WHERE email = \'admin@mga-portal.com\';'
    }, { status: 500 })
  }
}