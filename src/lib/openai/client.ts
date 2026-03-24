import OpenAI from "openai";

// This file is server-only — never import from client components
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
