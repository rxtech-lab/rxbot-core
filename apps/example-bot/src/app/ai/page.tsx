import { openai } from "@ai-sdk/openai";
import { PageProps, RouteMetadata } from "@rx-lab/common";
import { generateText } from "ai";

export const metadata: RouteMetadata = {
  title: "AI",
  description: "Chat with AI",
  includeInMenu: true,
};

const model = openai.chat("gpt-4o-2024-08-06");

export default async function Page({ text }: PageProps) {
  if (!text) {
    return <div>Hi! How can I help you?</div>;
  }
  const { text: assistantResponse } = await generateText({
    model,
    prompt: text,
  });
  return <div>{assistantResponse}</div>;
}
