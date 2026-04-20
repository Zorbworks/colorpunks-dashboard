interface Props {
  size?: number;
}

/** Inline Farcaster logomark. Uses currentColor, so the icon colour is
 *  driven by the parent's CSS `color` — lets us put a white mark on a
 *  purple circle, or a purple mark on a transparent background. */
export function FarcasterIcon({ size = 14 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M257.778 155.556h484.444v688.888h-71.111V528.889h-.697c-7.86-87.212-81.156-155.556-170.414-155.556-89.258 0-162.554 68.344-170.414 155.556h-.697v315.555h-71.111V155.556z"
      />
      <path
        fill="currentColor"
        d="M128.889 253.333l28.889 97.778h24.444v395.556c-12.273 0-22.222 9.949-22.222 22.222v26.667h-4.444c-12.273 0-22.223 9.949-22.223 22.222v26.667h248.889v-26.667c0-12.273-9.949-22.222-22.222-22.222h-4.444v-26.667c0-12.273-9.95-22.222-22.223-22.222h-26.666V253.333H128.889z"
      />
      <path
        fill="currentColor"
        d="M675.556 746.667c-12.273 0-22.223 9.949-22.223 22.222v26.667h-4.444c-12.273 0-22.222 9.949-22.222 22.222v26.667h248.889v-26.667c0-12.273-9.95-22.222-22.223-22.222h-4.444v-26.667c0-12.273-9.949-22.222-22.222-22.222V351.111h24.444l28.889-97.778H693.333v493.334h-17.777z"
      />
    </svg>
  );
}
