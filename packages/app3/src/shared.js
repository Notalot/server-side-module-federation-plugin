import React, { useEffect, useState } from "react";

export default function Shared() {
  // const state = 'hei!';
  const [state, setState] = useState('Hey!');
  useEffect(() => {
    console.log('HOOK FROM APP3');
    setState('Hello!')
  }, []);
  return <div>{state} I'm from App3 Deploy!</div>;
}
