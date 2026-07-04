import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        login(email.trim(), password);
      } else {
        register(email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <p className="login-eyebrow">Il tuo diario</p>
        <h1 className="login-title">Diario</h1>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuamail@esempio.it"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary">
            {mode === 'login' ? 'Entra' : 'Crea account'}
          </button>

          <p className="login-switch">
            {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </form>

        <p className="login-footnote">
          Salvato sul dispositivo · la sincronizzazione cloud arriverà presto
        </p>
      </div>
    </div>
  );
}
