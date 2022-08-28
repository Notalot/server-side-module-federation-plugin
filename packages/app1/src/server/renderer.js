import { renderToString } from "react-dom/server";
import React from "react";
import App from "../components/App";

import {styleCollector} from '@optimaxdev/utils';

export default () => {
  const [html, css] = styleCollector.collectStyles(() => renderToString(<App />));
  
  return { html, css };
};
