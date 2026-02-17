interface ProcesandoSpinnerProps {
  className?: string;
}

/** Spinner con texto "Procesando..." para indicar carga de datos */
export default function ProcesandoSpinner({ className = "" }: ProcesandoSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-gray-500 ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <span className="inline-block w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Procesando...</span>
    </div>
  );
}
