import React, {useEffect} from "react";
import { default as App3Shared } from "app3/Shared";
const App2Shared = React.lazy(() => import("./Test"));

import styles from './app.css';

export const App = () => {
  useEffect(() => {
    console.log('Влад, кажется, ты сломал хуки');
  }, []);
  return (
      <div className={styles.app}>
        I'm in App1
        <React.Suspense fallback={'Загружаю'}>
          <App2Shared />
        </React.Suspense>
        <App3Shared />
      </div>
  );
}
