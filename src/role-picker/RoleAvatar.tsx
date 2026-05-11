import type { UserProfile } from "./users";

export type RoleAvatarProps = {
  user: UserProfile;
  size?: number;
  showName?: boolean;
  onClick?: () => void;
  title?: string;
};

export function RoleAvatar({ user, size = 36, showName = false, onClick, title }: RoleAvatarProps) {
  const Tag = onClick ? "button" : "div";
  const props = onClick ? { type: "button" as const, onClick } : {};
  return (
    <Tag
      {...props}
      className={`role-avatar ${onClick ? "clickable" : ""}`}
      style={{ "--role-avatar-size": `${size}px` } as React.CSSProperties}
      title={title ?? user.name}
      aria-label={user.name}
    >
      <span className="role-avatar-img-wrap">
        <img src={user.avatar} alt={user.name} loading="lazy" decoding="async" />
      </span>
      {showName ? <span className="role-avatar-name">{user.name}</span> : null}
    </Tag>
  );
}
