import { PageProps } from "@rx-lab/common";
import { BuyActionArea } from "./BuyActionArea";

export default function Buy(props: PageProps) {
  const currentTime = new Date().toLocaleTimeString();
  if (!props.text) {
    return <span>Enter a token symbol or address to buy</span>;
  }

  return (
    <div>
      <span>
        Buying <code>{props.text}</code> at {currentTime}
      </span>
      <BuyActionArea token={props.text} />
    </div>
  );
}
