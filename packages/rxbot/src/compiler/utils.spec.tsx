import { describe } from "node:test";
// @ts-ignore
import mockJsonAst2 from "../tests/mock/react-ast-metadata.mock.json";
// @ts-ignore
import mockJsonAst1 from "../tests/mock/react-ast.mock.json";
import {
  extractJSXKeyAttributes,
  generateClientComponentTag,
  isClientComponent,
  isRouteGroup,
  parseSourceCode,
  processRouteGroup,
  readMetadata,
} from "./utils";

describe("isClientComponent", () => {
  const testCases = [
    {
      source: `
      
      `,
      expected: false,
    },
    {
      source: `
        export async function page() {
        
        }
      `,
      expected: false,
    },
    {
      source: `
       "use"
        export async function page() {
        
        }
      `,
      expected: false,
    },
    {
      source: `
      "use client"
        export async function page() {
        
        }
      `,
      expected: true,
    },
  ];

  testCases.forEach(({ source, expected }) => {
    it(`should return ${expected} for ${source}`, async () => {
      const ast = await parseSourceCode("typescript", source);
      const result = await isClientComponent(ast);
      expect(result).toBe(expected);
    });
  });
});

describe("generateClientComponentTag", () => {
  const testCases = [
    {
      source: `

      `,
      expected: undefined,
    },
    {
      source: `
       "use client"
        export function Page() {
            return <div></div>
        }
        export function Page2() {
            return <div></div>
        }
      `,
      expected:
        'Page.$$typeof = Symbol("react.element.client");\n' +
        'Page2.$$typeof = Symbol("react.element.client");\n',
    },
    {
      source: `
       "use client"
        export function Page() {
            return <div></div>
        }
      `,
      expected: 'Page.$$typeof = Symbol("react.element.client");\n',
    },
    {
      source: `
       "use client"
        function Page() {
            return <div></div>
        }
      `,
      expected: undefined,
    },
    {
      source: `
       "use client"
       export const metadata = {
        title: "hello"
       }
        function Page() {
            return <div></div>
        }
      `,
      expected: undefined,
    },
    {
      source: `
import { RouteMetadata } from "@rx-lab/common";
import { CommandButton } from "@rx-lab/core";

export const metadata: RouteMetadata = {
  title: "State Management",
  description: "Learn how to manage states in your bot",
  includeInMenu: true,
};

export default function page() {
  return (
    <div>
      <h1>Use State Demo</h1>
      <p>
        State management is a fundamental aspect of the Rx-Lab framework. We
        offer a straightforward approach to managing states in your bot, which
        differs from traditional single-page web applications.
      </p>
      <br />
      <br />
      <h1>Key Difference</h1>
      <p>
        Unlike web applications, bot states cannot be stored directly in the
        application. Instead, Rx-Lab utilizes external storage for state
        management.
      </p>
      <menu>
        <div>
          <CommandButton command={"/state/simple"}>Counter Demo</CommandButton>
        </div>
      </menu>
    </div>
  );
}
      `,
      expected: undefined,
    },
  ];

  testCases.forEach(({ source, expected }) => {
    it(`should return ${expected} for ${source}`, async () => {
      const ast = await parseSourceCode("typescript", source);
      const result = await generateClientComponentTag(ast);
      expect(result).toBe(expected);
    });
  });
});

describe("extractJSXKeyAttributes", () => {
  describe("parsed from source code", () => {
    const testCases = [
      {
        source: `
      <button key="key"></button>
      `,
        expected: [
          {
            value: "key",
          },
        ],
      },
    ];

    testCases.forEach(({ source, expected }) => {
      it(`should return ${expected} for ${source}`, async () => {
        const ast = await parseSourceCode("typescript", source);
        const result = await extractJSXKeyAttributes(ast);
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("from parsed AST", () => {
    const testcases = [
      {
        source: mockJsonAst1,
        expected: [
          {
            value: "header",
          },
        ],
      },
    ];

    testcases.forEach(({ source, expected }) => {
      it(`should return ${expected} for ${source}`, async () => {
        const result = await extractJSXKeyAttributes(source as any);
        expect(result).toStrictEqual(expected);
      });
    });
  });
});

describe("readMetadata", () => {
  describe("read from json", () => {
    const testcases = [
      {
        source: mockJsonAst2,
        expected: {
          title: "State Management",
          description: "Learn how to manage states in your bot",
          includeInMenu: true,
        },
      },
    ];

    testcases.forEach(({ source, expected }) => {
      it(`should return ${expected} for ${source}`, async () => {
        const result = await readMetadata(source as any);
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("read from source code", () => {
    const testCases = [
      {
        source: ``,
        expected: undefined,
      },
      {
        source: `
        export const metadata = {
          title: "hello"
        }
        `,
        expected: {
          title: "hello",
        },
      },
    ];
    testCases.forEach(({ source, expected }) => {
      it(`should return ${expected} for ${source}`, async () => {
        const ast = await parseSourceCode("typescript", source);
        const result = await readMetadata(ast);
        expect(result).toStrictEqual(expected);
      });
    });
  });
});
