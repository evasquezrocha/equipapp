import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function DashboardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 13h6V4H4z" />
      <path d="M14 20h6v-7h-6z" />
      <path d="M14 4h6v4h-6z" />
      <path d="M4 20h6v-3H4z" />
    </BaseIcon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 20V6a2 2 0 0 1 2-2h5v16" />
      <path d="M14 20V8h3a2 2 0 0 1 2 2v10" />
      <path d="M3 20h18" />
      <path d="M8 8h2" />
      <path d="M8 12h2" />
      <path d="M8 16h2" />
      <path d="M16 12h1" />
      <path d="M16 16h1" />
    </BaseIcon>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" />
      <path d="M17 5.5a3 3 0 0 1 0 5.9" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20v-1.2A5.8 5.8 0 0 1 10.8 13h2.4A5.8 5.8 0 0 1 19 18.8V20" />
    </BaseIcon>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8.5" cy="15.5" r="2.5" />
      <path d="M10.2 13.8 20 4" />
      <path d="M14 6l4 4" />
      <path d="M12 8l2 2" />
    </BaseIcon>
  );
}

export function DeviceIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 17v3" />
    </BaseIcon>
  );
}

export function AssignmentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 4h8a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </BaseIcon>
  );
}

export function MaintenanceIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.7 6.3a4 4 0 0 1 0 5.7l-2 2 4.3 4.3-2.8 2.8-4.3-4.3-2 2a4 4 0 0 1-5.7 0l3.3-3.3-2.2-2.2 2.8-2.8 2.2 2.2 3.3-3.3a4 4 0 0 1 5.7 0Z" />
    </BaseIcon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </BaseIcon>
  );
}
