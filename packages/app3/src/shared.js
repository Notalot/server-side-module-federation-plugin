import React, { useEffect, useState } from "react";
import styles from './shared.css';

export const Shared = () => {
  // const state = 'hei!';
  const [state, setState] = useState('Hey!');

  useEffect(() => {
    console.log('HOOK FROM APP3');
    setState('Hello!');
  }, []);
  return <div className={styles.shared}>{state} I'm from App3 Deploy!</div>;
}

export default Shared;
