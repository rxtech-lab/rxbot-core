import { JSONSchema7Object } from "json-schema";

export interface ExtendedJSONSchema7Object
  extends Exclude<JSONSchema7Object, "title" | "description"> {
  const?: any;
  //@ts-ignore
  title?: string;
  //@ts-ignore
  description?: string;
}
