import { USERS, type UserProfile } from "./users";

export type RolePickerProps = {
  users?: UserProfile[];
  title?: string;
  subtitle?: string;
  onSelect: (userId: string) => void;
};

export function RolePicker({
  users = USERS,
  title = "欢迎",
  subtitle = "请选择你的角色",
  onSelect,
}: RolePickerProps) {
  return (
    <div className="role-picker-screen" role="dialog" aria-modal="true" aria-label={title}>
      <div className="role-picker-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

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
    </div>
  );
}
