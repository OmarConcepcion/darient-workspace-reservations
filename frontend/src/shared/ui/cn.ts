export const cn = (
  ...inputs: Array<string | undefined | null | false>
): string => inputs.filter(Boolean).join(" ");
