# web-shared

跨 yuxino 项目共享的 React 组件 / hooks。**私有仓库**，按 git 依赖方式被 ele、nichijou 等项目消费。

## 当前导出

### `useUser()` + `RolePicker` + `USERS`

跨子域共享的角色选择能力。Cookie 名固定为 `nichijou_current_user`，部署在 `*.yuxino.cn` 时 domain 设为 `.yuxino.cn`，所以一处选择、所有子域可见。

```tsx
import { useUser, RolePicker } from "web-shared";
import "web-shared/style.css";

function App() {
  const { hasSelectedUser, switchUser, currentUser } = useUser();

  if (!hasSelectedUser) {
    return <RolePicker onSelect={switchUser} />;
  }

  return <YourApp user={currentUser} />;
}
```

### 自定义角色集

默认导出 `USERS`（dog/cat/doro/hazlank）。也可以传入自定义列表：

```tsx
const { ... } = useUser({ users: customUsers });
<RolePicker users={customUsers} onSelect={...} />
```

## 维护

```bash
# 改完代码
npm run build  # 出 dist/
git tag v0.x.0
git push --tags
# 各项目 pnpm update web-shared 拉新 commit / tag
```

> Cookie name 不要乱改 —— 改了等于让所有线上用户重新选一次角色。
