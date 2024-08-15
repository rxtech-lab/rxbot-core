import { parseQuery, queryStringify } from "./router.utils";

describe("parse url string", () => {
  const testCases = [
    {
      input: "https://google.com/?page=1&sort=desc",
      expected: { page: "1", sort: "desc" },
    },
    {
      input: "https://google,com?query=hello%20world",
      expected: { query: "hello world" },
    },
    {
      input: "a/b/c/?page=1&sort=desc",
      expected: { page: "1", sort: "desc" },
    },
    {
      input: "a/b/c/?page=true&b=&c=a",
      expected: { page: true, b: null, c: "a" },
    },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should return ${JSON.stringify(expected)} for ${input}`, () => {
      expect(parseQuery(input)).toEqual(expected);
    });
  });
});

describe("query stringify", () => {
  const testCases = [
    {
      qs: { page: "1", sort: "desc" },
      url: "https://google.com",
      expected: "https://google.com/?page=1&sort=desc",
    },
    {
      qs: { page: 1, sort: "desc" },
      url: "https://google.com",
      expected: "https://google.com/?page=1&sort=desc",
    },
    {
      qs: { page: 1, sort: "desc", query: null },
      url: "https://google.com",
      expected: "https://google.com/?page=1&sort=desc",
    },
    {
      qs: { page: 1, sort: "desc", query: undefined },
      url: "https://google.com",
      expected: "https://google.com/?page=1&sort=desc",
    },
    {
      qs: { page: 1, sort: "desc", query: false },
      url: "https://google.com",
      expected: "https://google.com/?page=1&sort=desc&query=false",
    },
  ];

  testCases.forEach(({ qs, url, expected }) => {
    it(`should return ${expected} for ${JSON.stringify(qs)} and ${url}`, () => {
      expect(queryStringify(url, qs)).toEqual(expected);
    });
  });
});
