
'use server';

import { Resend } from 'resend';
import type { Event, User } from '@/types';
import { getAllUsers } from './data';

if (!process.env.RESEND_API_KEY) {
  console.warn("Resend API key is not set. Email features will be disabled.");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'onboarding@resend.dev'; // Resend requires a verified domain for production use


export async function sendNewEventAnnouncement({ event }: { event: Event }) {
    if (!process.env.RESEND_API_KEY) return;
    
    // Construct a full URL for the event link
    const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard/events/${event.id}`;

    const allUsers = await getAllUsers();
    if (allUsers.length === 0) return;

    for (const user of allUsers) {
        if (user.email) {
            try {
                await resend.emails.send({
                    from: fromEmail,
                    to: user.email,
                    subject: `New Campus Event: ${event.title}`,
                    html: `
                        <h1>Hi ${user.name || 'Student'},</h1>
                        <h2>A new event has been scheduled on campus!</h2>
                        <p><strong>Event:</strong> ${event.title}</p>
                        <p><strong>Date:</strong> ${event.date}</p>
                        <p><strong>Time:</strong> ${event.time}</p>
                        <p><strong>Location:</strong> ${event.location}</p>
                        <br/>
                        <p>${event.description}</p>
                        <br/>
                        <a href="${eventUrl}" style="padding: 10px 15px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px;">View Event Details</a>
                        <br/><br/>
                        <p>We hope to see you there!</p>
                        <p>- The CampusConnect Team</p>
                    `,
                });
            } catch (error) {
                console.error(`Failed to send event notification to ${user.email}:`, error);
            }
        }
    }
}


export async function sendFacultyInviteEmail({ name, email, inviteLink }: { name: string; email: string; inviteLink: string; }) {
    if (!process.env.RESEND_API_KEY) {
        console.error("Resend API key not configured. Cannot send invitation email.");
        throw new Error("Email service is not configured.");
    }
    
    try {
        await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: "You're invited to join CampusConnect as a Faculty Member",
            html: `
                <h1>Hello ${name},</h1>
                <p>You have been invited to join CampusConnect as a faculty member.</p>
                <p>To accept your invitation and create your account, please click the link below. This link is unique to you and will expire in 24 hours.</p>
                <br/>
                <a href="${inviteLink}" style="padding: 12px 20px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">Create Your Account</a>
                <br/><br/>
                <p>If you did not expect this invitation, you can safely ignore this email.</p>
                <p>- The CampusConnect Team</p>
            `,
        });
    } catch (error) {
        console.error(`Failed to send faculty invitation to ${email}:`, error);
        throw new Error("Could not send the invitation email.");
    }
}
