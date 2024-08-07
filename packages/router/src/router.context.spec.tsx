/**
 * @jest-environment jsdom
 */

import React, { act } from "react";
import { useRegisterLoading } from "./router.hooks.";
import { useEffect, useState } from "react";
import { render, waitFor } from "@testing-library/react";
import { RouterProvider } from "./router.context";

describe("router context", () => {
  function useTestPromise() {
    const registerLoading = useRegisterLoading();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
      const timeout = () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(1);
          }, 500);
        });
      registerLoading(
        timeout().then((data) => {
          setData(data);
        }),
      );
    }, []);

    return data;
  }

  function TestComponent() {
    const data = useTestPromise();
    return <div data-testid={"container"}>Data: {data}</div>;
  }

  it("should render the component after the promise is resolved", async () => {
    const { getByTestId, findByText } = render(
      <RouterProvider>
        <TestComponent />
      </RouterProvider>,
    );

    // Initially, the component should not be rendered
    expect(() => getByTestId("container")).toThrow();

    // Wait for the component to be rendered and updated
    await waitFor(() => {
      expect(findByText("Data: 1")).toBeTruthy();
    });

    jest.useRealTimers();
  });
});
