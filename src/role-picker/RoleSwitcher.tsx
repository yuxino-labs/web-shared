import { useEffect } from "react";
import type { UserProfile } from "./types";
import { useUsers } from "./useUsers";

export type RoleSwitcherProps = {
  open: boolean;
  users?: UserProfile[];
  currentUserId: string;
  title?: string;
  onSelect: (userId: string) => void;
  onClose: () => void;
};

export function RoleSwitcher({
  open,
  users: usersProp,
  currentUserId,
  title = "切换角色",
  onSelect,
  onClose,
}: RoleSwitcherProps) {
  const { users: fetchedUsers } = useUsers();
  const users = usersProp ?? fetchedUsers;

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="role-switcher-overlay" onClick={onClose}>
      <div
        className="role-switcher-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="role-switcher-title">{title}</h3>
        <div className="role-switcher-grid">
          {users.map((user) => {
            const isActive = user.id === currentUserId;
            return (
              <button
                key={user.id}
                type="button"
                className={`role-switcher-card ${isActive ? "active" : ""}`}
                onClick={() => onSelect(user.id)}
              >
                <div className="role-switcher-avatar">
                  <img src={user.avatar} alt={user.name} loading="eager" decoding="async" />
                </div>
                <span className="role-switcher-name">{user.name}</span>
                {isActive ? (
                  <svg
                    className="role-switcher-check"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
        <button type="button" className="role-switcher-close" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
