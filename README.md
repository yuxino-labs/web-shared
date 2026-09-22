# web-shared

ele、nichijou 等 yuxino 项目共用的角色选择组件，以及网站的中英文默认语言逻辑。项目通过 Git 依赖或固定提交的源码包接入。

## 角色选择

`useUser()` 读取当前角色，`RolePicker` 和 `RoleSwitcher` 显示选择界面，`RoleAvatar` 显示头像。角色列表由接口返回，不再内置固定的 `USERS` 列表。使用这些组件需要 React 和 React DOM 18 或更新版本。

先调用 `configureWebShared({ apiHost })`。组件会请求 `<apiHost>/users`，预期响应为 `{ data: UserProfile[] }`；每个角色至少包含 `id`、`name` 和 `avatar`。

```tsx
import { configureWebShared, useUser, RolePicker } from "web-shared";
import "web-shared/style.css";

configureWebShared({ apiHost: "https://your-api.example/api/v1" });

function App() {
  const { loading, error, switchUser, currentUser } = useUser();

  if (loading) return <p>加载角色中…</p>;
  if (error) return <p>加载角色失败：{error.message}</p>;

  if (!currentUser) {
    return <RolePicker onSelect={switchUser} />;
  }

  return <YourApp user={currentUser} />;
}
```

上例中的 `YourApp` 是接入项目自己的页面。

角色 ID 保存在 `nichijou_current_user` Cookie 中。在 `yuxino.cn` 及其子域下，Cookie 的 domain 为 `.yuxino.cn`，其他子域下的应用也能读取同一次选择；其他域名只在当前主机保存。组件同时保留 localStorage 记录以兼容旧版。角色选择本身不提供登录或权限校验。

`RolePicker` 和 `RoleSwitcher` 的 `users` 属性可以指定要显示的角色。`useUser()` 不接收自定义列表，它始终用接口返回的列表校验当前角色。

## 网站语言

`web-shared/region-language` 可供 React、Next.js 和普通 JavaScript 网站使用，无需加载角色组件或 React。

没有手动选择语言时，页面先显示英文，再根据 Country.is 返回的 IP 所在国家或地区决定是否切换中文。手动选择、语言 URL 和已保存的选择优先；查询失败时保留英文。接入方法、查询范围及隐私说明见[网站语言规则](docs/language-policy.md)。

## 维护

```bash
npm run build
npm test
```

检查构建结果并提交改动后，由接入项目更新固定的提交或版本及依赖锁文件。语言模块的生成文件 `runtime/region-language.js` 也需要提交。

保留现有 Cookie 名；更改它会让线上用户重新选择角色。
