import { InstanceType } from "@rx-lab/common";
import { BaseComponent } from "./Component";
import { LineBreak } from "./LineBreak";

/**
 * Header component is used to create a header in the bot.
 */
export class Header extends BaseComponent<any> {
  type = InstanceType.Header;

  finalizeBeforeMount() {
    const lineBreakBefore = new LineBreak({
      container: this.props.container,
      context: this.props.context,
      internalInstanceHandle: this.props.internalInstanceHandle,
    });

    const lineBreakAfter = new LineBreak({
      container: this.props.container,
      context: this.props.context,
      internalInstanceHandle: this.props.internalInstanceHandle,
    });

    this.parent?.insertAfter(lineBreakAfter, this);
    this.parent?.insertBefore(lineBreakBefore, this);
  }
}
