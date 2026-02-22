console.log('App component is rendering');

export default function App() {
  console.log('App component function called');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '1rem',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          FUNNISH
        </h1>
        
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1.2rem',
          marginBottom: '2rem'
        }}>
          Multiplayer Fun Games
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Enter your username"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              marginBottom: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            style={{
              background: 'linear-gradient(45deg, #FF6B9D, #FF8E53)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Create Lobby
          </button>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Lobby Code"
              maxLength={4}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '16px',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}
            />
            <button
              style={{
                background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                color: 'white',
                border: 'none',
                padding: '15px 25px',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Join
            </button>
          </div>
        </div>

        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem',
          marginTop: '2rem'
        }}>
          Enter a username and create a lobby or join with a code
        </p>
      </div>
    </div>
  );
}
