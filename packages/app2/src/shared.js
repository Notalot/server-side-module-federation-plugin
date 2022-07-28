import React, { useEffect, useState } from "react";

export default function Shared() {
  const [state, setState] = useState('Hey!');
  useEffect(() => {
    console.log('HOOK FROM APP2');
    setState('Hello!')
  }, []);
  return <div>{state} I'm from App2</div>;
}
