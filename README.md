![logo](./assets/bg.jpeg)

# RX-Bot: React-based Bot Framework for all Platforms

RX-Bot is an innovative framework for building bots using React inspired by Next.js. It combines the power of React's
component-based architecture with the flexibility of Bot API, allowing developers to create interactive and
dynamic bot interfaces with ease.

## Key Features

- React-based: Leverage the power and familiarity of React to build your bot's UI and logic.
- State Management: Built-in state management using a custom useState hook that supports remote state loading.
- Routing: Flexible routing system similar to Next.js, supporting dynamic routes.
- Suspense-like Functionality: Pause rendering while loading remote states, ensuring a smooth user experience.

## Supported Platforms

- Telegram
- WhatsApp(coming soon)
- Facebook Messenger(coming soon)
- Slack(coming soon)
- Discord(coming soon)

## Getting Started

1. Install the package using npm or yarn:
    ```bash
    npm install @rx-lab/core @rx-lab/storage @rx-lab/common @rx-lab/telegram-adapter
    ```
2. Create a folder called `app` in the src directory of your project.
3. Create a `page.tsx` file inside the `app` folder with the following content:
    ```tsx
    export default function Page() {
        return <div>Hello, World!</div>;
    }
    ```
4. Create an `adapter.ts` file in the `src` directory with the following content:
    ```ts
    import { MemoryStorage } from "@rx-lab/storage/memory";
    import { TelegramAdapter } from "@rx-lab/telegram-adapter";

    const adapter = new TelegramAdapter({
    token: apiKey,
    } as any);
    
    const storage = new MemoryStorage();
    
    export { adapter, storage };
    ```
5. Create a web Server(if using callback) and start the bot:
    ```ts
    import path from "path";
    import { Core } from "@rx-lab/core";
    import { FileStorage } from "@rx-lab/file-storage";
    import { TelegramAdapter } from "@rx-lab/telegram-adapter";
    import Fastify from "fastify";
    
    const adapter = new TelegramAdapter({
        token: apiKey,
    });
    
    const storage = new FileStorage();
    
    const app = Fastify();
    let core: Core<any>;
    
    app.post("/webhook", async (req, res) => {
        const { body } = req;
        try {
            await core.handleMessageUpdate(body as any);
            return {
                status: "ok",
            };
        } catch (error) {
            console.error(error);
            return {
                status: "error",
            };
        }
    });
    
    (async () => {
        try {
            core = await Core.Compile({
                adapter,
                storage,
                rootDir: path.join(__dirname, "src"),
                destinationDir: path.join(__dirname, ".rx-lab"),
            });
            console.log("Bot is running");
            await app.listen({
                port: 3000,
            });
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    })();
    ```

## Examples

Rx-Bot support both React Client Component and React Server Component. Here are some examples what you can do with
Rx-Bot

### Simple Counter

> Note: Key is required for storing and restore state from server.

```tsx
"use client";
import {useState} from "@rx-lab/storage";
import React from "react";

export default function Page() {
    // first argument is the key, second argument is the initial value
    // this is a little bit different from React's useState hook
    // because, we need to store the state on the server using the key.
    const [state, setState] = useState("counter", 0);

    return (
        <div>
            <h1>Welcome to the Telegram Bot!</h1>
            <hr/>
            <p>Choose an option</p>
            <hr/>
            <p>Current state: {state}</p>
            <menu>
                <div>
                    <button
                        key={"button1"}
                        onClick={() => {
                            setState(state + 1);
                        }}
                    >
                        +1
                    </button>
                    <button
                        key={"button2"}
                        onClick={() => {
                            setState(state - 1);
                        }}
                    >
                        -1
                    </button>
                </div>
                <div>
                    <button
                        key={"button3"}
                        onClick={() => {
                            setState(0);
                        }}
                    >
                        Reset
                    </button>
                </div>
            </menu>
        </div>
    );
}
```

### Chatbot

This example uses `ai` sdk from vercel to create a simple chatbot powered by ChatGPT.

> Note: This example is a demonstration on how server component can be used in a chatbot.

```tsx
import {openai} from "@ai-sdk/openai";
import {PageProps, RouteMetadata} from "@rx-lab/common";
import {generateText} from "ai";

export const metadata: RouteMetadata = {
    title: "AI",
    description: "Chat with AI",
    includeInMenu: true,
};

const model = openai.chat("gpt-4o-2024-08-06");

export default async function Page({text}: PageProps) {
    if (!text) {
        return <div>Hi! How can I help you?</div>;
    }
    const {text: assistantResponse} = await generateText({
        model,
        prompt: text,
    });
    return <div>{assistantResponse}</div>;
}
```

### Navigation

You can use our `Command` component to navigate between different pages.

```tsx
export default async function Page(props: PageProps) {
    const page = parseInt((props.searchQuery.page as any) ?? "1");
    const {posts, count, pageCount} = await fetchPosts(page);

    return (
        <div>
            <h1>Posts</h1>
            <p>There are {count} posts</p>
            <menu>
                {posts.map((post, index) => (
                    <div key={index}>
                        <CommandButton command={`/post/${post.id}`} renderNewMessage={true}>
                            {post.id + " - " + post.title}
                        </CommandButton>
                    </div>
                ))}
                <div key={"actions"}>
                    {page > 1 && (
                        <CommandButton command={`/post?page=${page - 1}`}>
                            Previous Page
                        </CommandButton>
                    )}
                    {page < pageCount && (
                        <CommandButton command={`/post?page=${page + 1}`}>
                            Next Page
                        </CommandButton>
                    )}
                </div>
            </menu>
        </div>
    );
}
```
