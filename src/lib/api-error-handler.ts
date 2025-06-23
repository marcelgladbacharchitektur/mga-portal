import { NextResponse } from 'next/server';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function createApiError(
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

export function handleApiError(error: any) {
  console.error('API Error:', error);

  // Return appropriate error response
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Ein Fehler ist aufgetreten' 
    : error.message;

  return NextResponse.json(
    {
      error: message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error.details 
      }),
    },
    { status: statusCode }
  );
}