import { describe } from "node:test";
import { convertRouteToTGRoute, convertTGRouteToRoute } from "./utils";

describe("Convert route to tg route", () => {
  const testCases = [
    { route: "/home", expected: "/home" },
    { route: "/settings/profile/edit", expected: "/settings_profile_edit" },
    { route: "/settings/profile", expected: "/settings_profile" },
  ];

  for (const { route, expected } of testCases) {
    it(`should convert ${route} to ${expected}`, () => {
      expect(convertRouteToTGRoute(route)).toBe(expected);
    });
  }
});

describe("Convert tg route to route", () => {
  const testCases = [
    { route: { route: "/home", type: "page" }, expected: "/home" },
    {
      route: { route: "/settings_profile_edit", type: "page" },
      expected: "/settings/profile/edit",
    },
    {
      route: { route: "/settings_profile", type: "page" },
      expected: "/settings/profile",
    },
  ];

  for (const { route, expected } of testCases) {
    it(`should convert ${route} to ${expected}`, () => {
      expect(convertTGRouteToRoute(route as any)).toBe(expected);
    });
  }
});
