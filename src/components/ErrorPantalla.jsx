import { Component } from 'react'

// Si una pantalla falla, muestra el error en vez de dejar la pantalla en blanco.
// Los datos no se tocan: están guardados en el celular.
export default class ErrorPantalla extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="min-h-dvh max-w-xl mx-auto px-5 pt-16 pb-10 pt-safe">
        <h1 className="text-2xl font-bold mb-2">Algo falló en esta pantalla</h1>
        <p className="text-on-surface-variant mb-6">Tus datos están a salvo. Sacale una captura a este mensaje y mandásela a quien te ayuda con la app.</p>
        <pre className="text-xs bg-surface-container rounded-2xl p-4 whitespace-pre-wrap break-words mb-6">
          {String(error?.message ?? error)}
          {'\n\n'}
          {navigator.userAgent}
        </pre>
        <button
          onClick={() => {
            location.hash = '#/'
            this.setState({ error: null })
          }}
          className="w-full min-h-12 rounded-full bg-primary text-white font-semibold"
        >
          Volver al inicio
        </button>
      </div>
    )
  }
}
