import { Component, InstanceType } from "@rx-lab/common";
import { CallbackParser } from "./callbackParser";
import { renderElement } from "./renderer";

class MockComponent extends Component {
  key: string | null = null;
  constructor(
    public id: string,
    public type: InstanceType,
    public props: any,
  ) {
    super();
    if (Array.isArray(props.children)) {
      this.children = props.children;
    } else {
      if (props.children) this.children = [props.children];
    }
  }

  commitUpdate(oldProps: any, newProps: any): boolean {
    return true;
  }

  finalizeBeforeMount(): void {}
}

describe("renderElement", () => {
  const parser = new CallbackParser();

  it("should render text element", () => {
    const textElement = new MockComponent("1", InstanceType.Text, {
      nodeValue: "Hello",
    });
    expect(renderElement(textElement, parser).text).toBe("Hello");
  });

  it("should render inline code", () => {
    const codeElement = new MockComponent("1", InstanceType.Code, {
      children: [
        new MockComponent("1", InstanceType.Text, {
          nodeValue: "const a = 1;",
        }),
      ],
    });
    const rendered = renderElement(codeElement, parser);
    expect(rendered.text).toBe("<code>const a = 1;</code>");
  });

  it("should render code block", () => {
    const codeElement = new MockComponent("1", InstanceType.Pre, {
      children: [
        new MockComponent("1", InstanceType.Code, {
          children: [
            new MockComponent("1", InstanceType.Text, {
              nodeValue: "const a = 1;",
            }),
          ],
        }),
      ],
    });
    const rendered = renderElement(codeElement, parser);
    expect(rendered.text).toBe("<pre><code>const a = 1;</code></pre>");
  });

  it("should render button element", () => {
    const buttonElement = new MockComponent("2", InstanceType.Button, {
      children: [
        {
          type: "text",
          props: { nodeValue: "Click me" },
        },
      ],
    });
    const rendered = renderElement(buttonElement, parser);
    expect(rendered.text).toBe("");
    expect(
      parser.decode(
        (rendered.reply_markup!.inline_keyboard[0][0] as any).callback_data,
      ),
    ).toEqual([
      "onClick",
      {
        id: "2",
        type: "onClick",
      },
    ]);
  });

  it("should render button element with multiple children", () => {
    const buttonElement = new MockComponent("2", InstanceType.Button, {
      children: [
        {
          type: InstanceType.Text,
          props: { nodeValue: "Current State:" },
        },
        {
          type: InstanceType.Text,
          props: { nodeValue: "2" },
        },
      ],
    });
    const rendered = renderElement(buttonElement, parser);
    expect(rendered.text).toBe("");
    expect((rendered.reply_markup!.inline_keyboard[0][0] as any).text).toEqual(
      "Current State:2",
    );
  });

  it("should render link element", () => {
    const textElement = new MockComponent("1", InstanceType.Text, {
      nodeValue: "Visit Example",
    });

    const linkElement = new MockComponent("3", InstanceType.Link, {
      href: "https://example.com",
      children: [],
    });

    linkElement.appendChild(textElement);
    expect(renderElement(linkElement, parser).text).toEqual(
      '<a href="https://example.com">Visit Example</a>',
    );
  });

  it("should render paragraph element", () => {
    const paragraphElement = new MockComponent("4", InstanceType.Paragraph, {});
    paragraphElement.children = [
      new MockComponent("5", InstanceType.Text, {
        nodeValue: "Paragraph content",
      }),
    ];
    expect(renderElement(paragraphElement, parser).text).toEqual(
      "Paragraph content\n \n",
    );
  });

  it("should render header element", () => {
    const headerElement = new MockComponent("6", InstanceType.Header, {});
    headerElement.children = [
      new MockComponent("7", InstanceType.Text, {
        nodeValue: "Header content",
      }),
    ];
    expect(renderElement(headerElement, parser).text).toEqual(
      "<b>Header content</b>\n \n",
    );
  });

  it("should render menu with inline keyboard", () => {
    const menuElement = new MockComponent("8", InstanceType.Menu, {});
    const row1 = new MockComponent("9", InstanceType.Container, {});
    const row2 = new MockComponent("10", InstanceType.Container, {});
    const button1 = new MockComponent("11", InstanceType.Button, {
      children: {
        type: InstanceType.Text,
        props: { nodeValue: "Button 1" },
      },
    });
    const button2 = new MockComponent("12", InstanceType.Button, {
      children: {
        type: InstanceType.Text,
        props: { nodeValue: "Button 2" },
      },
    });
    const button3 = new MockComponent("13", InstanceType.Button, {
      children: {
        type: InstanceType.Text,
        props: { nodeValue: "Button 3" },
      },
    });

    row1.appendChild(button1);
    row2.appendChild(button2);
    row2.appendChild(button3);
    menuElement.appendChild(row1);
    menuElement.appendChild(row2);

    const rendered = renderElement(menuElement, parser);
    expect(rendered.reply_markup.keyboard.length).toBe(2);
    expect(rendered.reply_markup.keyboard[0].length).toBe(1);
    expect(rendered.reply_markup.keyboard[1].length).toBe(2);
    expect(rendered.reply_markup.keyboard[0][0].text).toBe("Button 1");
    expect(rendered.reply_markup.keyboard[1][0].text).toBe("Button 2");
    expect(rendered.reply_markup.keyboard[1][1].text).toBe("Button 3");
  });

  it("should render image element", () => {
    const imageElement = new MockComponent("14", InstanceType.Image, {
      src: "image.jpg",
      caption: "An image",
    });
    expect(renderElement(imageElement, parser)).toEqual({
      type: "photo",
      photo: "image.jpg",
      caption: "An image",
      text: "",
    });
  });

  it("should render container element", () => {
    const containerElement = new MockComponent(
      "15",
      InstanceType.Container,
      {},
    );
    const textElement1 = new MockComponent("16", InstanceType.Text, {
      nodeValue: "Text 1",
    });
    const textElement2 = new MockComponent("17", InstanceType.Text, {
      nodeValue: "Text 2",
    });
    containerElement.appendChild(textElement1);
    containerElement.appendChild(textElement2);

    expect(renderElement(containerElement, parser).text).toEqual(
      "Text 1Text 2",
    );
  });

  it("should render command button", () => {
    const commandElement = new MockComponent("18", InstanceType.Command, {
      variant: "button",
      command: "/start",
      children: "Start",
      renderNewMessage: true,
    });
    const rendered = renderElement(commandElement, parser);
    expect(rendered.text).toBe("");
    expect(
      parser.decode(
        (rendered.reply_markup.inline_keyboard[0][0] as any).callback_data,
      ),
    ).toEqual([
      "onCommand",
      {
        route: "/start",
        new: true,
      },
    ]);
  });

  it("should render inline keyboard with three rows when level is 1", () => {
    const containerElement = new MockComponent(
      "19",
      InstanceType.Container,
      {},
    );
    const button1 = new MockComponent("20", InstanceType.Button, {
      children: "Button 1",
    });
    const button2 = new MockComponent("21", InstanceType.Button, {
      children: "Button 2",
    });
    const button3 = new MockComponent("22", InstanceType.Button, {
      children: "Button 3",
    });

    containerElement.appendChild(button1);
    containerElement.appendChild(button2);
    containerElement.appendChild(button3);

    const rendered = renderElement(containerElement, parser);
    expect(rendered.reply_markup.inline_keyboard.length).toBe(3);
  });

  it("should render inline keyboard with two rows", () => {
    const containerElement = new MockComponent(
      "19",
      InstanceType.Container,
      {},
    );
    const row1 = new MockComponent("20", InstanceType.Container, {});
    const row2 = new MockComponent("21", InstanceType.Container, {});
    const button1 = new MockComponent("20", InstanceType.Button, {
      children: "Button 1",
    });
    const button2 = new MockComponent("21", InstanceType.Button, {
      children: "Button 2",
    });
    const button3 = new MockComponent("22", InstanceType.Button, {
      children: "Button 3",
    });

    row1.appendChild(button1);
    row1.appendChild(button2);

    row2.appendChild(button3);

    containerElement.appendChild(row1);
    containerElement.appendChild(row2);

    const rendered = renderElement(containerElement, parser);
    expect(rendered.reply_markup.inline_keyboard.length).toBe(2);
    expect(rendered.reply_markup.inline_keyboard[0].length).toBe(2);
    expect(rendered.reply_markup.inline_keyboard[1].length).toBe(1);
  });

  describe("command with url", () => {
    it("should render button with url", () => {
      const buttonElement = new MockComponent("18", InstanceType.Command, {
        variant: "button",
        command: "https://example.com",
      });
      const rendered = renderElement(buttonElement, parser);
      expect((rendered.reply_markup!.inline_keyboard[0][0] as any).url).toEqual(
        "https://example.com",
      );
    });
  });

  it("should render button with url in a row", () => {
    const buttonElement = new MockComponent("18", InstanceType.Command, {
      variant: "button",
      command: "https://example.com",
    });

    const containerElement = new MockComponent(
      "19",
      InstanceType.Container,
      {},
    );

    containerElement.appendChild(buttonElement);

    const rendered = renderElement(containerElement, parser);
    expect((rendered.reply_markup!.inline_keyboard[0][0] as any).url).toEqual(
      "https://example.com",
    );
  });

  it("should render button with url in a col", () => {
    const buttonElement = new MockComponent("18", InstanceType.Command, {
      variant: "button",
      command: "https://example.com",
    });

    const containerElement = new MockComponent(
      "19",
      InstanceType.Container,
      {},
    );

    const row1 = new MockComponent("20", InstanceType.Container, {});

    row1.appendChild(buttonElement);
    containerElement.appendChild(row1);

    const rendered = renderElement(containerElement, parser);
    expect((rendered.reply_markup!.inline_keyboard[0][0] as any).url).toEqual(
      "https://example.com",
    );
  });
});
