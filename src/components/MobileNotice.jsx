import React from 'react';
import './MobileNotice.css';

const MobileNotice = () => {
  return (
    <div id="mobileNotice">
      <h1>⚠️<br />Device Not Supported</h1>
      <p>This game is not designed for mobile devices.</p>
      <p>Please switch to a <strong>Laptop</strong> or <strong>PC</strong> to play.</p>
    </div>
  );
};

export default MobileNotice;
