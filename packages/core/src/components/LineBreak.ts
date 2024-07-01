import { Text, TextProps } from "./Text";
import { InstanceType } from "@rx-lab/common";

interface LineBreakProps extends Omit<TextProps, "text"> {}

/**
 * LineBreak component will insert a new line in the text.
 *
 * ```tsx
 * Header,
 * LineBreak,
 * Text
 * ```
 *
 * will render as:
 * ```md
 * # Space will be added between the two Text components
 *
 * Paragraph
 * ```
 */
export class LineBreak extends Text {
  type = InstanceType.LineBreak;

  constructor(opts: LineBreakProps) {
    super({
      ...opts,
      text: "\n",
    });
  }
}
