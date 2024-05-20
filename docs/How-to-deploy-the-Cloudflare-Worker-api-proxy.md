### How to use Cloudflare Worker

To create your first Worker using the Cloudflare dashboard:

1. Log in to the Cloudflare dashboard and select your account.
2. Select Workers & Pages > Create application.
3. Select Create Worker > Deploy.

### 如何使用 Cloudflare Worker

要使用 Cloudflare 仪表板创建您的第一个 Worker：

1. 登录 Cloudflare 仪表板并选择您的帐户。
2. 选择 Workers 和 Pages > 创建应用程序。
3. 选择 创建 Worker > 部署。

### Worker Scripts

Copy the following code to replace the original `worker.js` code, and then click Deploy.

```javascript
addEventListener('fetch', (event) => {
  const headers = event.request.headers
  const url = new URL(event.request.url)
  url.hostname = 'generativelanguage.googleapis.com'
  url.protocol = 'https'
  const request = new Request(url, event.request)
  return event.respondWith(fetch(request))
})
```

### Worker 脚本

复制以下代码替换原有的 `worker.js` 代码，然后点击 部署。

```javascript
addEventListener('fetch', (event) => {
  const headers = event.request.headers
  const url = new URL(event.request.url)
  url.hostname = 'generativelanguage.googleapis.com'
  url.protocol = 'https'
  const request = new Request(url, event.request)
  return event.respondWith(fetch(request))
})
```

### Set a custom domain (optional)

Since the `workers.dev` domain can not be accessed normally in some countries, you can solve this problem by setting a custom domain.

1. Select Workers & Pages > [Your Worker Script].
2. Select Settings > Triggers.
3. Choose Add Custom Domain.

### 设置自定义域名（可选）

由于在部分国家无法正常访问 `workers.dev` 域名，可以通过设置自定义域名来解决这个问题。

1. 选择 Workers 和 Pages > [您的 Worker 脚本]。
2. 选择 设置 > 触发器。
3. 选择 添加自定义域。
