import React, {useEffect} from "react";
import { default as App2Shared } from "app2/Shared";
import { default as App3Shared } from "app3/Shared";

import styles from './app.css';

export default function App({useApp2}) {
  useEffect(() => {
    console.log('Влад, кажется, ты сломал хуки');
  }, []);
  return (
      <div className={styles.app}>
        I'm in App1
        {useApp2 && <App2Shared /> }
        <App3Shared />
      </div>
  );
}
