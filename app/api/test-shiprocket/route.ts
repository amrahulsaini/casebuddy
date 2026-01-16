import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Hardcoded credentials from your .env.local
    const hardcodedEmail = 'x@casebuddy.co.in';
    const hardcodedPassword = 'S8Mbz4XJ@zWhrgvjZp3Mp&2v55YSWy*a';
    
    // Environment variables
    const envEmail = process.env.SHIPROCKET_EMAIL || '';
    const envPassword = process.env.SHIPROCKET_PASSWORD || '';
    
    const results = {
      environment_variables: {
        email: envEmail,
        password_length: envPassword.length,
        password_first_5: envPassword.substring(0, 5),
        password_last_5: envPassword.substring(envPassword.length - 5),
        has_quotes: envPassword.includes("'") || envPassword.includes('"'),
        raw_password_debug: envPassword,
      },
      hardcoded_values: {
        email: hardcodedEmail,
        password_length: hardcodedPassword.length,
      },
      tests: {} as any,
    };

    // Test 1: Hardcoded credentials
    try {
      const res1 = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: hardcodedEmail, 
          password: hardcodedPassword 
        }),
        cache: 'no-store',
      });
      
      const data1 = await res1.json();
      results.tests.hardcoded = {
        status: res1.status,
        success: res1.ok,
        response: data1,
      };
    } catch (error: any) {
      results.tests.hardcoded = {
        error: error.message,
      };
    }

    // Test 2: Environment variables
    try {
      const res2 = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: envEmail, 
          password: envPassword 
        }),
        cache: 'no-store',
      });
      
      const data2 = await res2.json();
      results.tests.environment = {
        status: res2.status,
        success: res2.ok,
        response: data2,
      };
    } catch (error: any) {
      results.tests.environment = {
        error: error.message,
      };
    }

    // Test 3: Environment variables trimmed (in case of whitespace)
    try {
      const res3 = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: envEmail.trim(), 
          password: envPassword.trim() 
        }),
        cache: 'no-store',
      });
      
      const data3 = await res3.json();
      results.tests.environment_trimmed = {
        status: res3.status,
        success: res3.ok,
        response: data3,
      };
    } catch (error: any) {
      results.tests.environment_trimmed = {
        error: error.message,
      };
    }

    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
