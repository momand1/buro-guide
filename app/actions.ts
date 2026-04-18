'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Environment Variables
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;

// --- FEATURE 1: DOCUMENT TRANSLATOR ---
export async function explainDocument(formData: FormData) {
  if (!apiKey) throw new Error("Google API Key is missing.");

  try {
    const file = formData.get("file") as File;
    const language = formData.get("language") as string;

    if (!file) throw new Error("No file was uploaded.");

    // Convert the raw file to Base64 on the server
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a helpful assistant for people living in Germany.
    Explain the uploaded document in ${language}. 
    
    CRITICAL: Output ONLY plain text. Do NOT use HTML.
    
    WHAT IS THIS?
    [Explanation]
    
    ACTION REQUIRED?
    [Explanation]
    
    IF I IGNORE IT?
    [Explanation]`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: file.type || "image/jpeg" } },
    ]);

    // Return the guaranteed flat string
    return `${result.response.text()}`;

  } catch (error: any) {
    console.error("AI Server Error:", error.message);
    throw new Error(error.message || "Failed to analyze document");
  }
}

// --- FEATURE 2: APPOINTMENT HUNTER (DATABASE) ---
export async function saveAppointmentAlert(formData: FormData) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Database credentials missing. Check your .env.local file.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const city = formData.get("city") as string;
  const service = formData.get("service") as string;
  const email = formData.get("email") as string;

  if (!city || !service || !email) {
    throw new Error("Please fill out all fields.");
  }

  const { data, error } = await supabase
    .from('appointment_alerts')
    .insert([
      { city: city, service: service, email: email }
    ]);

  if (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to save your alert. Please try again.");
  }

  return `Success! We will email ${email} when a slot opens for ${service} in ${city}.`;
}

// --- FEATURE 3: SEND EMAIL ALERT ---
export async function triggerEmailAlert(email: string, city: string, service: string) {
  if (!resendKey) throw new Error("Resend API Key is missing.");

  const resend = new Resend(resendKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Büro-Guide <onboarding@resend.dev>', // Resend's default testing address
      to: email, // IMPORTANT: For testing, this MUST be your verified Resend email!
      subject: `🚨 Appointment Found: ${service} in ${city}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Great news! 🎉</h2>
          <p>Our bots just found an open cancellation for <strong>${service}</strong> in <strong>${city}</strong>.</p>
          <p>Click the link below to book it immediately before someone else takes it!</p>
          <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Book Appointment Now</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated test alert from Büro-Guide.</p>
        </div>
      `
    });

    if (error) {
      throw new Error(error.message);
    }

    return "Email alert sent successfully!";
  } catch (error: any) {
    console.error("Email Error:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}