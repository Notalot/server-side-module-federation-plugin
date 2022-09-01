import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

const render = App => {
  const root = document.getElementById('root');

  ReactDOM.hydrateRoot(
    root,
    <App />,
  );
};

render(App);
