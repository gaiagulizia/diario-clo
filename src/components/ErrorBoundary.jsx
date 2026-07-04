import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Diario - errore catturato:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen">
          <div className="crash-box">
            <h1>Qualcosa è andato storto</h1>
            <p>
              L'app ha incontrato un errore e non può essere mostrata. Il dettaglio qui sotto
              aiuta a capire la causa:
            </p>
            <pre>{String(this.state.error?.message || this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
