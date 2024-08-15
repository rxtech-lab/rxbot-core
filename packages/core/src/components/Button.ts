import { InstanceType } from "@rx-lab/common";
import { BaseComponent } from "./Component";

/**
 * Button component will render a button element.
 */
export class Button extends BaseComponent<any> {
  type = InstanceType.Button;
}
