import { renderToString } from "react-dom/server";
import React from "react";
import App from "../components/App";

export default (useApp2 = false) => {
  const html = renderToString(<App useApp2={useApp2} />);
  
  return { html, css: global.css || [] };
};
