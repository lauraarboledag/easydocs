import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1a2b4a] rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              Términos y Condiciones
            </h1>
            <p className="text-xs text-gray-400">
              EasyDocs — EduDynamis: Asesores Educativos
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Intro */}
        <div className="bg-[#1a2b4a] rounded-2xl p-8 mb-8 text-white">
          <img
            src="/logo_easydocs_blanco.png"
            alt="EasyDocs"
            className="h-16 w-auto object-contain mb-6"
          />
          <h2 className="text-2xl font-bold mb-2">
            Términos y Condiciones de Uso
          </h2>
          <p className="text-blue-200 text-sm">
            Última actualización: junio de 2026 · Vigente para la plataforma
            EasyDocs
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">
          {/* 1 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              1. Identificación del Prestador del Servicio
            </h3>
            <p>
              <strong>EasyDocs</strong> es una plataforma de gestión documental
              para instituciones de Educación para el Trabajo y el Desarrollo
              Humano (ETDH) en Colombia, desarrollada y operada por{" "}
              <strong>EduDynamis: Asesores Educativos</strong>, empresa
              domiciliada en Medellín, Colombia, con NIT pendiente de
              actualización.
            </p>
            <p className="mt-3">
              EduDynamis es un grupo de profesionales en diversas áreas de la
              educación y otras disciplinas con amplia experiencia, que pone a
              disposición de sus clientes un amplio portafolio de servicios para
              el sector educativo, garantizando el diseño y ejecución de
              asesorías, procesos y productos pertinentes, ajustados a las
              expectativas y requerimientos de los clientes, a la normatividad
              legal vigente y a los contextos donde se ofrezca el servicio.
            </p>
            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-1">
              <p>
                <span className="font-medium">Correo de contacto:</span>{" "}
                edudynamis1@gmail.com
              </p>
              <p>
                <span className="font-medium">Sitio web:</span>{" "}
                <a
                  href="https://edudynamis.org/Edudynamis/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2952cc] hover:underline"
                >
                  https://edudynamis.org/Edudynamis/
                </a>
              </p>
              <p>
                <span className="font-medium">Ciudad:</span> Medellín,
                Antioquia, Colombia
              </p>
              <p>
                <span className="font-medium">Redes sociales:</span> Facebook e
                Instagram como <strong>EduDynamis</strong>
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              2. Aceptación de los Términos
            </h3>
            <p>
              Al registrarse y utilizar EasyDocs, el usuario declara haber
              leído, comprendido y aceptado en su totalidad los presentes
              Términos y Condiciones, así como la Política de Privacidad de la
              plataforma. Si no está de acuerdo con alguno de estos términos,
              debe abstenerse de usar el servicio.
            </p>
            <p className="mt-3">
              El uso continuado de la plataforma después de cualquier
              modificación a estos términos constituye la aceptación de los
              cambios realizados.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              3. Descripción del Servicio
            </h3>
            <p>
              EasyDocs ofrece a las instituciones ETDH las siguientes
              funcionalidades, según el plan de suscripción activo:
            </p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                "Generación de libros reglamentarios LR001 a LR009 en formato PDF",
                "Generación de certificados de aptitud ocupacional y constancias",
                "Gestión de programas académicos, estudiantes y matrículas",
                "Asistente de orientación normativa EduBot",
                "Almacenamiento y consulta del historial de documentos generados",
                "Configuración de datos institucionales y logo en documentos",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2952cc] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              4. Registro y Cuenta de Usuario
            </h3>
            <p>
              Para acceder a EasyDocs, el representante legal de la institución
              debe registrarse proporcionando información veraz, completa y
              actualizada. El usuario es responsable de mantener la
              confidencialidad de sus credenciales de acceso y de todas las
              actividades realizadas bajo su cuenta.
            </p>
            <p className="mt-3">
              EduDynamis se reserva el derecho de suspender o cancelar cuentas
              que proporcionen información falsa, incumplan estos términos o
              hagan uso indebido de la plataforma.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              5. Planes y Pagos
            </h3>
            <p>
              EasyDocs ofrece distintos planes de suscripción con diferentes
              funcionalidades y límites de uso. Los precios y condiciones de
              cada plan se publican en la plataforma y pueden ser modificados
              con previo aviso.
            </p>
            <p className="mt-3">
              Los pagos por planes de pago deben realizarse según las
              instrucciones indicadas en la plataforma. La activación del plan
              queda sujeta a la confirmación del pago por parte del equipo de
              EduDynamis.{" "}
              <strong>
                Próximamente se habilitará el pago en línea mediante la pasarela
                Wompi.
              </strong>
            </p>
            <p className="mt-3">
              No se realizarán reembolsos una vez activado el plan, salvo en
              casos justificados a criterio de EduDynamis.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              6. Responsabilidades del Usuario
            </h3>
            <p>El usuario se compromete a:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Usar la plataforma exclusivamente para fines lícitos relacionados con la gestión documental de su institución ETDH.",
                "Garantizar la veracidad y exactitud de los datos ingresados en los documentos generados.",
                "No compartir sus credenciales de acceso con terceros no autorizados.",
                "No intentar acceder de forma no autorizada a otros datos o cuentas de la plataforma.",
                "Cumplir con la normativa vigente aplicable a instituciones ETDH en Colombia.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2952cc] flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              7. Limitación de Responsabilidad
            </h3>
            <p>
              EduDynamis no se hace responsable por errores en los documentos
              generados derivados de información incorrecta suministrada por el
              usuario, ni por el uso que se dé a dichos documentos ante
              autoridades educativas u otras entidades.
            </p>
            <p className="mt-3">
              La plataforma EasyDocs es una herramienta de apoyo a la gestión
              documental y no reemplaza la asesoría jurídica o normativa
              especializada. EduBot es un asistente de orientación general y sus
              respuestas no constituyen concepto legal vinculante.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              8. Protección de Datos Personales
            </h3>
            <p>
              EduDynamis trata los datos personales de los usuarios conforme a
              la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos
              Personales de Colombia) y sus decretos reglamentarios. Los datos
              recopilados se utilizan exclusivamente para la prestación del
              servicio y no se comparten con terceros sin consentimiento
              expreso, salvo obligación legal.
            </p>
            <p className="mt-3">
              El usuario tiene derecho a conocer, actualizar, rectificar y
              suprimir sus datos personales. Para ejercer estos derechos puede
              escribir a <strong>edudynamis1@gmail.com</strong>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              9. Propiedad Intelectual
            </h3>
            <p>
              Todos los elementos de EasyDocs — incluyendo diseño, código,
              plantillas, logotipos y contenidos — son propiedad de EduDynamis:
              Asesores Educativos y están protegidos por las leyes de propiedad
              intelectual vigentes en Colombia. Queda prohibida su reproducción,
              distribución o modificación sin autorización expresa.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              10. Modificaciones y Terminación
            </h3>
            <p>
              EduDynamis se reserva el derecho de modificar, suspender o
              discontinuar EasyDocs en cualquier momento, con o sin previo
              aviso. Ante cambios sustanciales en estos Términos, se notificará
              a los usuarios registrados por correo electrónico.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              11. Legislación Aplicable
            </h3>
            <p>
              Los presentes Términos y Condiciones se rigen por las leyes de la
              República de Colombia. Cualquier controversia derivada del uso de
              EasyDocs se someterá a la jurisdicción de los tribunales
              competentes de la ciudad de Medellín, Antioquia.
            </p>
          </section>

          {/* Contacto */}
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              ¿Tienes preguntas?
            </h3>
            <p className="text-gray-600 mb-3">
              Si tienes dudas sobre estos Términos y Condiciones, puedes
              contactarnos:
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Correo:</span>{" "}
                edudynamis1@gmail.com
              </p>
              <p>
                <span className="font-medium">Sitio web:</span>{" "}
                <a
                  href="https://edudynamis.org/Edudynamis/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2952cc] hover:underline"
                >
                  https://edudynamis.org/Edudynamis/
                </a>
              </p>
              <p>
                <span className="font-medium">Empresa:</span> EduDynamis:
                Asesores Educativos
              </p>
              <p>
                <span className="font-medium">Ciudad:</span> Medellín,
                Antioquia, Colombia
              </p>
            </div>
          </section>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 EduDynamis: Asesores Educativos · Todos los derechos reservados
          · EasyDocs v1.0
        </p>
      </div>
    </div>
  );
}
