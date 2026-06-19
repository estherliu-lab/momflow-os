# DeepSeek Proxy Setup

MomFlow is hosted on GitHub Pages, which is a static website. A static website cannot safely include a DeepSeek API key, because anyone could inspect the page and copy the key.

To make MomFlow automatically use DeepSeek for every visitor, deploy a small backend proxy and put the DeepSeek API key there.

## Recommended Flow

```text
MomFlow website -> DeepSeek proxy -> DeepSeek API
```

## Cloudflare Worker Example

This repo includes:

```text
server/deepseek-worker.js
```

Deploy it as a Cloudflare Worker and set these environment variables:

- `DEEPSEEK_API_KEY`: your DeepSeek API key
- `ALLOWED_ORIGIN`: `https://ezekielgarden-arch.github.io`

Then add the Worker URL to GitHub Actions as a repository variable:

```text
VITE_MOMFLOW_AI_PROXY_URL=https://your-worker-url.workers.dev
```

After the next GitHub Pages deployment, MomFlow will call that proxy automatically. Users will not need to enter an API key.

## Why Not Put The Key In Frontend

Never put a private model API key directly into a public frontend bundle. Browser users can inspect JavaScript files and extract it.
