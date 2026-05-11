import type { UserProfile } from "./types";
import { useUsers } from "./useUsers";

export type RolePickerProps = {
  users?: UserProfile[];
  title?: string;
  subtitle?: string;
  onSelect: (userId: string) => void;
};

export function RolePicker({
  users: usersProp,
  title = "欢迎",
  subtitle = "请选择你的角色",
  onSelect,
}: RolePickerProps) {
  const { users: fetchedUsers, loading, error } = useUsers();
  const users = usersProp ?? fetchedUsers;

  return (
    <div className="role-picker-screen" role="dialog" aria-modal="true" aria-label={title}>
      <div className="role-picker-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {loading && users.length === 0 ? (
        <div className="role-picker-loading">加载中…</div>
      ) : error && users.length === 0 ? (
        <div className="role-picker-error">加载角色失败：{error.message}</div>
      ) : (
        <div className="role-picker-grid">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="role-picker-card"
              onClick={() => onSelect(user.id)}
              aria-label={`选择 ${user.name}`}
            >
              <div className="role-picker-avatar">
                <img src={user.avatar} alt={user.name} loading="eager" decoding="async" />
              </div>
              <span className="role-picker-name">{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
