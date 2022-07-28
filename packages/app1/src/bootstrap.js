import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

const render = App => {
  const root = document.getElementById('root');

  ReactDOM.hydrate(
    <App />,
    root,
  );
};

render(App);
