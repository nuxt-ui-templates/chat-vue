# Vue AI Chatbot Template

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Nitro](https://img.shields.io/badge/Built%20with-Nitro-ff637e?logo=nitro&labelColor=18181B)](https://nitro.build)

Full-featured AI Chatbot Vue application with authentication, chat history, collapsible sidebar, keyboard shortcuts, light & dark mode, command palette and more. Built using [Nuxt UI](https://ui.nuxt.com) components and integrated with [AI SDK](https://ai-sdk.dev) for a complete chat experience.

- [Live demo](https://chat-vue-template.nuxt.dev/)
- [Documentation](https://ui.nuxt.com/docs/getting-started/installation/vue)

<a href="https://chat-vue-template.nuxt.dev/" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ui.nuxt.com/assets/templates/vue/chat-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://ui.nuxt.com/assets/templates/vue/chat-light.png">
    <img alt="Vue AI Chatbot Template" src="https://ui.nuxt.com/assets/templates/vue/chat-light.png">
  </picture>
</a>

> The chat template for Nuxt is on https://github.com/nuxt-ui-templates/chat.

## Features

- ⚡️ **Streaming AI messages** powered by the [AI SDK](https://ai-sdk.dev) with thinking/reasoning support
- 🤖 **Top-tier models** — Claude Opus/Sonnet/Haiku 4.x, GPT-5 family, Gemini 3 Pro/Flash via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- 🎙 **Hold-to-talk voice** — on-screen mic button (or hold `Space`) → STT → send. Assistant replies can auto-speak (TTS).
- 🔁 **Swap voice backends** — OpenAI (`gpt-4o-mini-transcribe` + `gpt-4o-mini-tts`) by default, or Azure Speech.
- 🧠 **Persistent memory** — user-managed memories auto-injected into the system prompt.
- 🔭 **Deep research toggle** — bumps thinking budget and lets the model run multi-step web searches with citations.
- 📱 **Installable PWA** — offline app shell, mobile-first layout with safe-area handling, home-screen install prompt.
- 🔍 **Web search** with built-in provider tools (Anthropic, OpenAI)
- 📊 **Charts and weather** tool calling with rich UI rendering
- 🔐 **Authentication** via GitHub OAuth using [Nitro](https://nitro.build) server routes and httpOnly cookies
- 💾 **Chat history persistence** using SQLite database ([Turso](https://turso.tech) in production) and [Drizzle ORM](https://orm.drizzle.team)
- ✨ **Markdown rendering** with streaming code highlighting via [Comark](https://comark.dev)

## Quick Start

```bash
npm create nuxt@latest -- --no-modules -t ui-vue/chat
```

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fchat-vue&repository-name=chat-vue&env=GITHUB_OAUTH_CLIENT_ID%2CGITHUB_OAUTH_CLIENT_SECRET%2CSESSION_SECRET&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%7D%5D&demo-title=Vue+Chat+Template&demo-description=An+AI+chatbot+template+with+GitHub+authentication+and+persistent+chat+history+powered+by+Vercel+AI+SDK.&demo-url=https%3A%2F%2Fchat-vue-template.nuxt.dev&demo-image=https%3A%2F%2Fui.nuxt.com%2Fassets%2Ftemplates%2Fvue%2Fchat-dark.png)

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

Run database migrations:

```bash
pnpm db:migrate
```

> [!NOTE]
> In production, configure your database connection. On Vercel, add the [Turso integration](https://vercel.com/integrations/turso) to automatically provision `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

### AI Integration

This template uses the [Vercel AI SDK](https://ai-sdk.dev/) for streaming AI responses with support for multiple providers through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). When deployed on Vercel, the AI Gateway is configured automatically.

For local development, set your API key in `.env`:

```bash
AI_GATEWAY_API_KEY=<your-vercel-ai-gateway-api-key>
```

> [!TIP]
> With [Vercel AI Gateway](https://vercel.com/docs/ai-gateway), you don't need individual API keys for OpenAI, Anthropic, etc. It provides a unified API to access hundreds of models through a single endpoint with automatic load balancing, fallbacks, and spend monitoring.

### Voice & PWA

Voice uses top-tier models (no browser built-ins). Pick a backend via `VOICE_PROVIDER`:

```bash
# Default: OpenAI (gpt-4o-mini-transcribe for STT, gpt-4o-mini-tts for TTS)
VOICE_PROVIDER=openai
OPENAI_API_KEY=<your-openai-key>
# OPENAI_TTS_VOICE=alloy   # alloy|ash|ballad|coral|echo|fable|nova|onyx|sage|shimmer|verse

# Or Azure Speech
VOICE_PROVIDER=azure
AZURE_SPEECH_KEY=<your-azure-speech-key>
AZURE_SPEECH_REGION=eastus
# AZURE_TTS_VOICE=en-US-AvaNeural
```

**Using the mic:** On the composer, hold the mic button (or hold `Space` on desktop) to record, release to send. The settings page (`/settings`) lets you pick a TTS voice, auto-speak replies, and manage persistent memories.

**Install as PWA:** Chrome/Edge will offer an install banner once the service worker is active; iOS users can "Add to Home Screen" from Safari. Note that PWAs cannot bind to a phone's physical side button — the mic button (and `Space` on desktop) is the push-to-talk target.

### Authentication (Optional)

This template uses [Nitro](https://nitro.build) server routes with httpOnly cookies for authentication with GitHub OAuth.

To enable authentication, [create a GitHub OAuth application](https://github.com/settings/applications/new) and set:

```bash
GITHUB_OAUTH_CLIENT_ID=<your-github-oauth-app-client-id>
GITHUB_OAUTH_CLIENT_SECRET=<your-github-oauth-app-client-secret>
SESSION_SECRET=<your-secret-minimum-32-characters>
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nitro.build/deploy) for more information.

## Renovate integration

Install [Renovate GitHub app](https://github.com/apps/renovate/installations/select_target) on your repository and you are good to go.
