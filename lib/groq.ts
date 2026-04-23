import Groq from "groq-sdk";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatComplete(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const groq = new Groq({ apiKey });
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.2,
    max_tokens: 600,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}
