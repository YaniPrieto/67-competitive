import React from 'react';
import '../styles/QueueScreen.css';

export const QueueScreen = ({ onCancel, wsUrl }) => {
  const [queueTime, setQueueTime] = React.useState(0);
  const [message, setMessage] = React.useState('Finding opponent...');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setQueueTime(t => t + 1);
      
      if (queueTime % 5 === 0) {
        setMessage(m => m === 'Finding opponent...' ? 'Finding opponent... .' : 
                        m === 'Finding opponent... .' ? 'Finding opponent... ..' :
                        'Finding opponent...');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [queueTime]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="queue-screen">
      <div className="queue-container">
        <div className="queue-animation">
          <div className="pulse-ring"></div>
          <div className="pulse-ring" style={{ animationDelay: '0.5s' }}></div>
          <div className="pulse-ring" style={{ animationDelay: '1s' }}></div>
        </div>

        <h2>{message}</h2>
        <p className="queue-time">Queue time: {formatTime(queueTime)}</p>

        <div className="tips-while-waiting">
          <p>💡 While waiting:</p>
          <ul>
            <li>Make sure your camera is well-lit</li>
            <li>Practice your hand movements</li>
            <li>Prepare your mind for battle!</li>
          </ul>
        </div>

        <button onClick={onCancel} className="cancel-btn">
          Cancel Queue
        </button>
      </div>
    </div>
  );
};
