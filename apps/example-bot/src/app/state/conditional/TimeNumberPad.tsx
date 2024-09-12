type Props = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Create a number pad component for DateTime input.
 * 1 2 3
 * 4 5 6
 * 7 8 9
 * C 0 <-
 *
 * Default value is ****-**-** **:**
 * If user clicks 1, then it will be 1***-**-** **:**
 * If user clicks 2, then it will be 12**-**-** **:**
 * ... and so on
 *
 * If user clicks <-, it removes the last entered digit
 * If user clicks C, it resets to the default value
 * @param props
 * @constructor
 */
export function DateTimeNumberPad({ onChange, value }: Props) {
  const handleClick = (digit: number | "C" | "<-"): void => {
    let newValue: string;
    if (digit === "C") {
      newValue = "****-**-** **:**";
    } else if (digit === "<-") {
      const lastNonAsterisk = value
        .split("")
        .reverse()
        .findIndex(
          (char) =>
            char !== "*" && char !== "-" && char !== ":" && char !== " ",
        );
      if (lastNonAsterisk !== -1) {
        const index = value.length - 1 - lastNonAsterisk;
        newValue = value.substring(0, index) + "*" + value.substring(index + 1);
      } else {
        newValue = value;
      }
    } else {
      const firstAsterisk = value.indexOf("*");
      if (firstAsterisk !== -1) {
        newValue =
          value.substring(0, firstAsterisk) +
          digit +
          value.substring(firstAsterisk + 1);
      } else {
        newValue = value;
      }
    }
    onChange(newValue);
  };

  const renderButton = (content: number | "C" | "<-") => (
    <button
      onClick={() => handleClick(content)}
      className="w-12 h-12 m-1 text-lg font-bold bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      key={content}
    >
      {content}
    </button>
  );

  return (
    <div>
      <div>
        {renderButton(1)}
        {renderButton(2)}
        {renderButton(3)}
      </div>
      <div>
        {renderButton(4)}
        {renderButton(5)}
        {renderButton(6)}
      </div>
      <div>
        {renderButton(7)}
        {renderButton(8)}
        {renderButton(9)}
      </div>
      <div>
        {renderButton("C")}
        {renderButton(0)}
        {renderButton("<-")}
      </div>
    </div>
  );
}
