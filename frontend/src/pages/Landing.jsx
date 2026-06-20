import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — azul oscuro */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Video de fondo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/Landing.mp4" type="video/mp4" />
        </video>

        {/* Capa azul semitransparente */}
        <div className="absolute inset-0 bg-[#1a2b4a]/80" />

        {/* Contenido — todo va con relative z-10 */}
        <div className="relative z-10">
          <div className="mb-12">
            <img
              src="/logo_easydocs_blanco.png"
              alt="EasyDocs"
              className="h-32 w-auto object-contain"
            />
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6">
            Optimización Administrativa para el Sector ETDH
          </h1>
          <p className="text-blue-200 text-lg mb-12">
            Plataforma líder en gestión documental técnica, garantizando
            precisión normativa y eficiencia operativa en cada proceso.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-800/60 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Registro institucional
                </h3>
                <p className="text-blue-200 text-sm mt-1">
                  Ingreso manual de datos institucionales bajo estándares de
                  calidad educativa.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-800/60 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Generación de documentos oficiales
                </h3>
                <p className="text-blue-200 text-sm mt-1">
                  Automatización de certificados, actas y diplomas con validez
                  legal.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-800/60 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Cumplimiento normativo
                </h3>
                <p className="text-blue-200 text-sm mt-1">
                  Actualización constante según las directrices del Ministerio
                  de Educación.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10 mt-12 rounded-xl overflow-hidden">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-200 text-xs text-center">
              Alineado con el{" "}
              <strong className="text-white">Decreto 1075 de 2015</strong> para
              instituciones ETDH en Colombia
            </p>
          </div>
        </div>
      </div>
      {/* Panel derecho — blanco */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12 bg-white animate-fade-in-up">
        <div className="max-w-md mx-auto w-full">
          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-[#1a2b4a] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#1a2b4a]">EasyDocs</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Registra tu institución
          </h2>
          <p className="text-gray-500 mb-8">
            Inicia el proceso de modernización documental de tu institución
            educativa hoy mismo.
          </p>

          <button
            onClick={() => navigate("/registro")}
            className="w-full bg-[#2952cc] hover:bg-[#1e3fa8] text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors mb-4"
          >
            Comenzar registro institucional
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-colors mb-10"
          >
            Iniciar sesión
          </button>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-gray-100 rounded-xl p-4">
              <svg
                className="w-6 h-6 text-[#2952cc] mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Gestión 40% más rápida
              </p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <svg
                className="w-6 h-6 text-[#2952cc] mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Encriptación de nivel bancario
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
            <svg
              className="w-5 h-5 text-[#2952cc] flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="text-xs text-gray-500">
              Alineado estrictamente con los requerimientos del{" "}
              <strong className="text-gray-700">Decreto 1075 de 2015</strong>{" "}
              para Instituciones de Educación para el Trabajo y el Desarrollo
              Humano.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
