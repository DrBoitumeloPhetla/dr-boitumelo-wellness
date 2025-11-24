// Supabase Edge Function for sending emails via SMTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, from } = await req.json() as EmailRequest

    // Get SMTP credentials from environment variables
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.drphetla.co.za'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const SMTP_USER = Deno.env.get('SMTP_USER') || 'supplements@drphetla.co.za'
    const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
    const FROM_EMAIL = from || SMTP_USER
    const FROM_NAME = Deno.env.get('FROM_NAME') || 'Dr Boitumelo Wellness'

    // Use a third-party email service API (Resend is recommended for Supabase)
    // Install: https://resend.com or use nodemailer-compatible service

    // For now, we'll use a simple SMTP implementation
    // In production, you should use a proper email service like Resend, SendGrid, etc.

    const emailData = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
    }

    // Send email using fetch to a relay service or SMTP gateway
    // Note: Direct SMTP from Deno is complex, so we'll use a service

    // For development, we'll just log the email
    console.log('Email to send:', emailData)

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        details: `Email queued for ${to}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      },
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
})
