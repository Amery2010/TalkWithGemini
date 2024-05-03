<h1 align="center">Talk With Gemini</h1>

Deploy your private Gemini application for free with one click, supporting Gemini Pro and Gemini Pro Vision models.

一键免费部署您的私人 Gemini 应用, 支持 Gemini Pro 和 Gemini Pro Vision 模型。

[Web App](https://gemini.u14.app/)

[网页版](https://gemini.u14.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAmery2010%2FTalkWithGemini&env=GEMINI_API_KEY&project-name=talk-with-gemini&repository-name=TalkWithGemini)

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/Amery2010/TalkWithGemini)

![cover](./docs/images/cover.png)

> [!NOTE]
>
> #### Solution for "User location is not supported for the API use"
>
> If you encounter the issue **"User location is not supported for the API use"**, follow these steps to resolve it:
>
> 1. Go to this [**palm-netlify-proxy**](https://github.com/antergone/palm-netlify-proxy) repo and click **"Deploy With Netlify"**.
> 2. Once the deployment is complete, you will receive a domain name assigned by Netlify (e.g., `https://xxx.netlify.app`).
> 3. In your **Talk With Gemini** project, set an environment variable named `GEMINI_API_BASE_URL` with the value being the domain you got from deploying the palm proxy (`https://xxx.netlify.app`).
> 4. Redeploy your **Talk With Gemini** project to finalize the configuration. This should resolve the issue.
>
> Thanks to [**antergone**](https://github.com/antergone/palm-netlify-proxy) for providing this solution.

> [!注意]
>
> #### “User location is not supported for the API use”的解决方案
>
> 如果您遇到问题**“User location is not supported for the API use”**，请按照以下步骤解决：
>
> 1. 打开 [**palm-netlify-proxy**](https://github.com/antergone/palm-netlify-proxy) 存储库并单击 **“Deploy With Netlify”**。
> 2. 部署完成后，您将收到 Netlify 分配的域名（例如`https://xxx.netlify.app`）。
> 3. 在您的 **Talk With Gemini** 项目中，设置名为“GEMINI_API_BASE_URL”的环境变量，其值为您部署 palm 代理时获得的域 (“https://xxx.netlify.app”)。
> 4. 重新部署 **Talk With Gemini** 项目以完成配置。 这应该可以解决问题。
>
> 感谢 [**antergone**](https://github.com/antergone/palm-netlify-proxy) 提供此解决方案。

## Features

- **Deploy for free with one-click** on Vercel in under 1 minute
- Talk mode: Let you talk directly to Gemini
- Visual recognition allows Gemini to understand the content of the picture
- Full Markdown support: LaTex formulas, code highlighting, and more
- Well-designed UI, responsive design, supports dark mode
- Extremely fast first screen loading speed, supporting streaming response
- Privacy and security, all data is saved locally in the user's browser
- Automatically compress contextual chat records to save Tokens while supporting very long conversations
- Multi-language support: English, Simplified Chinese, Traditional Chinese, Japanese, 한국어, Español, Deutsch, Français, Português, Русский and العربية

## 主要功能

- 在 1 分钟内使用 Vercel **免费一键部署**
- 语音模式：让您直接与 Gemini 对话
- 视觉识别，让 Gemini 可以看懂图片内容
- 完整的 Markdown 支持：LaTex 公式、代码高亮等等
- 精心设计的 UI，响应式设计，支持深色模式
- 极快的首屏加载速度，支持流式响应
- 隐私安全，所有数据保存在用户浏览器本地
- 自动压缩上下文聊天记录，在节省 Token 的同时支持超长对话
- 多国语言支持：English、简体中文、繁体中文、日本語、한국어、Español、Deutsch、Français、Português、Русский 以及 العربية

## Roadmap

- [ ] Reconstruct the topic square and introduce Prompt list
- [ ] Add conversation list
- [ ] Use tauri to package desktop applications
- [ ] Share as image, share to ShareGPT link

## 开发计划

- [ ] 重构话题广场，引入 Prompt 列表
- [ ] 增加对话列表
- [ ] 使用 tauri 打包桌面应用
- [ ] 分享为图片，分享到 ShareGPT 链接

## Get Started

1. Get [Gemini API Key](https://aistudio.google.com/app/apikey)
2. Click
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAmery2010%2FTalkWithGemini&env=GEMINI_API_KEY&project-name=talk-with-gemini&repository-name=TalkWithGemini)
3. Start using

## 开始使用

1. 获取 [Gemini API Key](https://aistudio.google.com/app/apikey)
2. 单击
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAmery2010%2FTalkWithGemini&env=GEMINI_API_KEY&project-name=talk-with-gemini&repository-name=TalkWithGemini)
3. 开始使用

### Updating Code

If you want to update instantly, you can check out the [GitHub documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) to learn how to synchronize a forked project with upstream code.

You can star or watch this project or follow author to get release notifications in time.

### 更新代码

如果你想立即更新，可以查看[GitHub文档](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)以了解如何将分叉项目与上游代码同步。

您可以关注该项目或关注作者以及时获取发布通知。

## Access Password

This project provides limited access control. Please add an environment variable named `ACCESS_PASSWORD` on the vercel environment variables page.

After adding or modifying this environment variable, please redeploy the project for the changes to take effect.

## 访问密码

项目提供访问控制。请在 vercel 环境变量页面添加名为 `ACCESS_PASSWORD` 的环境变量。

添加或修改此环境变量后，请重新部署项目以使更改生效。

## Environment Variables

### `GEMINI_API_KEY` (optional)

Your Gemini Pro api key. If you need to `enable` the server api, this is required.

### `GEMINI_API_BASE_URL` (optional)

> Default: `https://generativelanguage.googleapis.com`

> Examples: `http://your-openai-proxy.com`

Override Gemini Pro api request base url.

### `ACCESS_PASSWORD` (optional)

Access password.

### `NEXT_PUBLIC_ENABLE_PROTECT` (optional)

> Default: 1

If you do not want users to use the server api, set this value to 1.

### `HEAD_SCRIPTS` (optional)

Injected script code can be used for statistics or error tracking.

＃＃ 环境变量

### `GEMINI_API_KEY`（可选）

您的 Gemini Pro api 密钥。 如果您需要“启用”服务器 api，这是必需的。

### `GEMINI_API_BASE_URL`（可选）

> 默认值：`https://generativelanguage.googleapis.com`

> 示例：`http://your-openai-proxy.com`

覆盖 Gemini Pro api 请求基本 url。

### `ACCESS_PASSWORD`（可选）

访问密码。

### `NEXT_PUBLIC_ENABLE_PROTECT`（可选）

> 默认：1

如果您不希望用户使用服务器 api，请将此值设置为 1。

### `HEAD_SCRIPTS` （可选）

用于注入的脚本代码可用于统计或错误跟踪。

## Requirements

NodeJS >= 18, Docker >= 20

## 最低要求

NodeJS >= 18，Docker >= 20

## Development

```shell
# If you have not installed pnpm
npm install -g pnpm
# 1. install nodejs and yarn first
# 2. config local env vars in `.env.local`
# 3. run
pnpm install
pnpm dev
```

## 开发

```shell
# 如果您没安装过 pnpm
npm install -g pnpm
# 1. 先安装nodejs和yarn
# 2. 在 `.env.local` 中配置本地环境变量
# 3. 运行
pnpm install
pnpm dev
```

## Deployment

### Docker (Recommended)

> The Docker version needs to be 20 or above, otherwise it will prompt that the image cannot be found.

> ⚠️ Note: Most of the time, the docker version will lag behind the latest version by 1 to 2 days, so the "update exists" prompt will continue to appear after deployment, which is normal.

```shell
docker pull xiangfa/talk-with-gemini

docker run -d -p 3000:3000 \
   -e OPENAI_API_KEY=sk-xxxx \
   -e CODE=your-password \
   xiangfa/talk-with-gemini
```

You can start service behind a proxy:

```shell
docker run -d -p 3000:3000 \
   -e OPENAI_API_KEY=sk-xxxx \
   -e CODE=your-password \
   -e PROXY_URL=http://localhost:7890 \
   xiangfa/talk-with-gemini
```

If your proxy needs password, use:

```shell
-e PROXY_URL="http://127.0.0.1:7890 user pass"
```

### 容器部署（推荐）

> Docker 版本需要在 20 及其以上，否则会提示找不到镜像。

> ⚠️ 注意：docker 版本在大多数时间都会落后最新的版本 1 到 2 天，所以部署后会持续出现“存在更新”的提示，属于正常现象。

```shell
docker pull xiangfa/talk-with-gemini

docker run -d -p 3000:3000 \
   -e OPENAI_API_KEY=sk-xxxx \
   -e CODE=页面访问密码 \
   xiangfa/talk-with-gemini
```

您也可以指定 proxy：

```shell
docker run -d -p 3000:3000 \
   -e OPENAI_API_KEY=sk-xxxx \
   -e CODE=页面访问密码 \
   --net=host \
   -e PROXY_URL=http://127.0.0.1:7890 \
   xiangfa/talk-with-gemini
```

如果您的本地代理需要账号密码，可以使用：

```shell
-e PROXY_URL="http://127.0.0.1:7890 user password"
```

如果您需要指定其他环境变量，请自行在上述命令中增加 `-e 环境变量=环境变量值` 来指定。

## LICENSE

[GPL-3.0-only](https://opensource.org/license/gpl-3-0)
