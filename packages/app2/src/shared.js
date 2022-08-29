import React, { useEffect, useState } from "react";
import styles from './shared.css';

export default function Shared() {
  const [state, setState] = useState('Hey!');
  useEffect(() => {
    console.log('HOOK FROM APP2');
    setState('Hello!')
  }, []);
  return <div className={styles.b}>{state} I'm from App2</div>;
}
