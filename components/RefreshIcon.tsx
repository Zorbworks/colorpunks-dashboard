interface Props {
  size?: number;
}

/** "Autorenew" style refresh icon — two semi-circular arrows chasing each
 *  other. Uses currentColor so the parent's text colour drives the fill. */
export function RefreshIcon({ size = 12 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 6V3L8 7l4 4V8c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 14c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 9.74A7.93 7.93 0 0 0 4 14c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
      />
    </svg>
  );
}
