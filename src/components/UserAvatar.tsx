import { cn } from '@/lib/utils';

type UserAvatarProps = {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
  className?: string;
  textClassName?: string;
};

export function UserAvatar({
  firstName = '',
  lastName = '',
  profileImageUrl,
  className,
  textClassName,
}: UserAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ''}`.toUpperCase();

  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={`${firstName} ${lastName}`.trim() || 'Avatar'}
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <span className={cn('font-bold', textClassName)}>
      {initials || 'U'}
    </span>
  );
}
