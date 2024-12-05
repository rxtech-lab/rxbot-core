import { InstanceType } from "@rx-lab/common";
import { BaseComponent } from "./Component";

export class Paragraph extends BaseComponent<any> {
  type = InstanceType.Paragraph;
}

export class InlineParagraph extends BaseComponent<any> {
  type = InstanceType.InlineParagraph;
}
