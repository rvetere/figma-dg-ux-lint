import { useEffect, useReducer, useState } from "react";
import * as Networker from "monorepo-networker";
import { NetworkMessages } from "@common/network/messages";

import ReactLogo from "@ui/assets/react.svg?component";
import viteLogo from "@ui/assets/vite.svg?inline";
import figmaLogo from "@ui/assets/figma.png";

import { Button } from "@ui/components/Button";
import "@ui/styles/main.scss";

interface UiState {
  lintErrors: any[];
}

interface UiStateAction {
  type: "set-lint-errors";
  payload?: number | string | any[];
}

function reducer(state: UiState, action: UiStateAction): UiState {
  if (
    action.type === "set-lint-errors" &&
    action.payload &&
    Array.isArray(action.payload)
  ) {
    return {
      lintErrors: action.payload,
    };
  }
  throw Error("Unknown action.");
}

function App() {
  const [state, dispatch] = useReducer(reducer, { lintErrors: [] });

  const startLint = async () => {
    const data = await NetworkMessages.START_LINT.request({});
    console.log({ data });
    if (data) {
      // @ts-ignores
      console.log({ errors: data.errors });
      // @ts-ignores
      dispatch({ type: "set-lint-errors", payload: data.errors });
    }
  };

  useEffect(() => {
    // @ts-ignore
    if (!window.dispatch) {
      // @ts-ignore
      window.dispatch = dispatch;
    }
  }, []);

  return (
    <div className="homepage">
      <h1>Lint for DG UX</h1>
      <Button onClick={startLint}>Start</Button>
      <ul>
        {state.lintErrors.map(({ errors }, index) => (
          <li key={index}>{errors.join(", ")}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
