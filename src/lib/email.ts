
'use server';

import { Resend } from 'resend';
import type { Event, Club, User } from '@/types';

if (!process.env.RESEND_API_KEY) {
  console.warn("Resend API key is not set. Email features will be disabled.");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'onboarding@resend.dev'; // Resend requires a verified domain for production use

export async function sendWelcomeEmail({ toEmail, userName, clubName }: { toEmail: string, userName: string, clubName: string }) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Welcome to ${clubName}!`,
      html: `
        <h1>Hi ${userName},</h1>
        <p>Welcome to ${clubName}! We're thrilled to have you as a new member.</p>
        <p>Keep an eye out for emails about upcoming events and meetings.</p>
        <br/>
        <p>Best,</p>
        <p>The CampusConnect Team</p>
      `,
    });
  } catch (error) {
    console.error(`Failed to send welcome email to ${toEmail}:`, error);
    // We don't throw an error here to prevent the UI from breaking if email fails
  }
}

export async function sendNewEventNotification({ toEmail, event, club }: { toEmail: string, event: Event, club: Club }) {
    if (!process.env.RESEND_API_KEY) return;
    
    // Construct a full URL for the event link
    const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard/events/${event.id}`;

    try {
        await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: `New Event from ${club.name}: ${event.title}`,
            html: `
                <h1>A new event has been scheduled!</h1>
                <h2>${event.title}</h2>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <br/>
                <p>${event.description}</p>
                <br/>
                <a href="${eventUrl}" style="padding: 10px 15px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px;">View Event Details</a>
                <br/><br/>
                <p>We hope to see you there!</p>
                <p>- The ${club.name} Team</p>
            `,
        });
    } catch (error) {
        console.error(`Failed to send event notification to ${toEmail}:`, error);
    }
}
