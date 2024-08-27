# Telegram Adapter

This adapter enables Telegram as a messaging channel for your bot, allowing you to create complex, interactive message
layouts with inline keyboards, buttons, and various content types.

## Features

- Render text, buttons, and nested containers
- Create multi-row inline keyboards
- Support for web app buttons
- Handle various content types (text, audio, video, photos)
- HTML formatting for message body

## Installation

```bash
npm install @rx-lab/telegram-adapter
```

## Usage

1. Create a `adapter.ts` file in your `app` directory and add the following code:
    ```typescript
    import { TelegramAdapter } from "@rx-lab/telegram-adapter";
    const adapter = new TelegramAdapter({
        token: "YOUR_BOT_TOKEN",
    });
    
    export {adapter}
    ```

2. Use the adapter in your bot application.

## Component Mapping

| Component                                   | Telegram Representation           | Notes                                                 |
|---------------------------------------------|-----------------------------------|-------------------------------------------------------|
| `menu` buttons                              | `KeyboardButton`                  | Displayed as a custom keyboard                        |
| Other buttons                               | `InlineKeyboardButton`            | Displayed inline with messages                        |
| CommandButton with command starts with http | `Button` with `web_app` attribute | Could be a `InlineKeyboardButton` or `KeyboardButton` |

