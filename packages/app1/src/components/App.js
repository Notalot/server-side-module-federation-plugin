import React from "react";
import { default as App3Shared } from "app3/Shared";
import { ChildComponent } from "./ChildComponent";

export default function App() {
  return (
      <div>
        I'm in App1
        <ChildComponent />
        {/*<App2Shared />*/}
        <App3Shared />
      </div>
  );
}
