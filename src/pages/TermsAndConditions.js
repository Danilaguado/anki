// src/pages/TermsAndConditions.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TermsAndConditions.css";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Vuelve a la página anterior
  };

  return (
    <div className='terms-container'>
      <div className='terms-content'>
        {/* Header con botón de regreso */}
        <div className='terms-header'>
          <button onClick={handleGoBack} className='back-button'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M19 12H5M12 19l-7-7 7-7' />
            </svg>
            Volver
          </button>
          <h1 className='terms-title'>Términos y Condiciones de Compra</h1>
          <p className='terms-subtitle'>Proyecto Kaizen</p>
          <p className='terms-date'>
            Última actualización: 13 de octubre de 2025
          </p>
        </div>

        {/* Contenido */}
        <div className='terms-body'>
          <p className='terms-intro'>
            Bienvenido a Proyecto Kaizen. Antes de realizar la compra de
            nuestros productos digitales (en adelante, "Ebooks"), te pedimos que
            leas detenidamente los siguientes Términos y Condiciones. Al
            completar el proceso de compra, declaras haber leído, entendido y
            aceptado en su totalidad las condiciones que se describen a
            continuación.
          </p>

          <section className='terms-section'>
            <h2>1. Objeto del Contrato</h2>
            <p>
              El presente documento regula la relación contractual de
              compraventa entre Proyecto Kaizen (el "Vendedor") y el cliente (el
              "Usuario") que adquiere nuestros Ebooks a través de nuestro sitio
              web. La compra confiere al Usuario una licencia de uso personal,
              intransferible y no exclusiva sobre el material adquirido.
            </p>
          </section>

          <section className='terms-section'>
            <h2>2. Proceso de Compra y Entrega</h2>
            <p>
              <strong>Compra:</strong> El Usuario realizará el pago a través de
              las plataformas de pago seguras dispuestas en el sitio web.
            </p>
            <p>
              <strong>Entrega:</strong> Una vez confirmado el pago, el acceso al
              Ebook será inmediato. El Usuario recibirá un correo electrónico a
              la dirección proporcionada durante la compra, con un enlace para
              la descarga directa del producto digital. Es responsabilidad del
              Usuario proporcionar una dirección de correo electrónico válida y
              asegurarse de poder recibir nuestros correos (revisando la carpeta
              de spam si es necesario).
            </p>
            <p>
              <strong>Verificación de Pago y Medidas Antifraude:</strong> Los
              pagos son procesados por un sistema automatizado. Aunque nos
              esforzamos por garantizar su correcto funcionamiento, este sistema
              puede cometer fallos. Si se detecta un intento de fraude, o si un
              pago es revertido o resulta ser inválido después de la entrega del
              producto, Proyecto Kaizen se reserva el derecho de tomar acciones,
              incluyendo, pero no limitándose a, la revocación del acceso al
              Ebook adquirido y la negación de acceso futuro a otros materiales,
              cursos, talleres o cualquier servicio impartido por nuestra
              empresa.
            </p>
          </section>

          <section className='terms-section'>
            <h2>3. Precios, Moneda y Formas de Pago</h2>
            <p>
              <strong>Modificación de Precios:</strong> Siendo los Ebooks
              productos digitales de nuestra autoría, Proyecto Kaizen se reserva
              el derecho de modificar sus precios en cualquier momento y a su
              entera discreción, sin necesidad de notificación previa. El precio
              aplicable a la compra será el que se muestre en el sitio web en el
              momento de la transacción.
            </p>
            <p>
              <strong>Moneda y Legislación:</strong> En cumplimiento con la
              legislación venezolana, todos los precios serán mostrados y
              procesados en la moneda de curso legal local.
            </p>
            <p>
              <strong>Métodos de Pago Alternativos:</strong> Con el fin de
              facilitar el acceso a nuestro material a usuarios internacionales
              y promover el libre comercio, también aceptamos pagos a través de
              criptomonedas seleccionadas. Las condiciones y la tasa de cambio
              aplicable para pagos con criptomonedas serán las especificadas
              durante el proceso de pago.
            </p>
          </section>

          <section className='terms-section'>
            <h2>4. Política de No Reembolso</h2>
            <p>
              Debido a la naturaleza digital e intangible de nuestros Ebooks y a
              su entrega inmediata, que permite el consumo completo del producto
              desde el momento de la compra,{" "}
              <strong>
                no se realizarán reembolsos, devoluciones ni cancelaciones bajo
                ninguna circunstancia
              </strong>{" "}
              una vez que la transacción haya sido completada. El Usuario acepta
              y entiende esta condición al realizar la compra.
            </p>
          </section>

          <section className='terms-section'>
            <h2>5. Propiedad Intelectual y Derechos de Autor</h2>
            <p>
              <strong>Copyright:</strong> Todo el contenido de los Ebooks,
              incluyendo texto, imágenes, diseño y estructura, está protegido
              por las leyes de propiedad intelectual y derechos de autor. La
              titularidad de estos derechos pertenece a Proyecto Kaizen.
            </p>
            <p>
              <strong>Prohibiciones:</strong> Queda estrictamente prohibida la
              reproducción, copia, distribución, modificación, reventa,
              transmisión o cualquier tipo de uso del contenido, ya sea de forma
              parcial o total, sin la autorización previa y por escrito del
              Vendedor. El plagio o la distribución no autorizada del material
              constituirá una violación de los derechos de autor y podrá dar
              lugar a acciones legales.
            </p>
          </section>

          <section className='terms-section'>
            <h2>5. Política de Privacidad y Tratamiento de Datos</h2>
            <p>
              Al realizar la compra, el Usuario consiente de manera expresa el
              tratamiento de sus datos personales de acuerdo con las siguientes
              condiciones:
            </p>
            <p>
              <strong>Datos Recopilados:</strong> Se solicitarán datos básicos
              como nombre, apellidos y dirección de correo electrónico para
              procesar la compra y la entrega del producto.
            </p>
            <p>
              <strong>Finalidad del Tratamiento:</strong> El Usuario acepta que
              sus datos sean utilizados para:
            </p>
            <ul>
              <li>Gestionar el pedido y la entrega del Ebook.</li>
              <li>
                Enviar comunicaciones comerciales y de marketing relacionadas
                con nuestros productos, ofertas y novedades (fines de
                marketing).
              </li>
              <li>
                Realizar análisis internos para la mejora de nuestros productos
                y servicios.
              </li>
            </ul>
            <p>
              <strong>Confidencialidad:</strong> Proyecto Kaizen se compromete a
              no vender, ceder ni compartir los datos personales de los Usuarios
              con terceros, salvo obligación legal.
            </p>
            <p>
              <strong>
                Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición):
              </strong>{" "}
              El Usuario tiene derecho a solicitar el acceso, la rectificación o
              la supresión de sus datos de nuestra base de datos en cualquier
              momento. Para ejercer este derecho, deberá enviar una solicitud al
              correo electrónico:{" "}
              <a href='mailto:[email protected]'>[email protected]</a>
            </p>
          </section>

          <section className='terms-section'>
            <h2>6. Obligaciones del Usuario</h2>
            <p>El Usuario se compromete a:</p>
            <ul>
              <li>
                Proporcionar información veraz y exacta durante el proceso de
                compra.
              </li>
              <li>
                Hacer un uso lícito y personal del Ebook adquirido, respetando
                en todo momento los derechos de autor.
              </li>
              <li>
                No compartir sus credenciales de acceso o los enlaces de
                descarga con terceros.
              </li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>7. Limitación de Responsabilidad</h2>
            <p>
              Proyecto Kaizen no se hace responsable de problemas técnicos
              derivados del equipo o la conexión a internet del Usuario que le
              impidan descargar o visualizar el Ebook.
            </p>
          </section>

          <section className='terms-section'>
            <h2>
              8. Descargo de Responsabilidad y Responsabilidad del Usuario
            </h2>
            <p>
              <strong>Carácter Informativo:</strong> © Proyectokz. Todo el
              contenido de este sitio y de los Ebooks es de carácter informativo
              y educativo. No constituye asesoramiento profesional (financiero,
              legal, médico o de cualquier otro tipo).
            </p>
            <p>
              <strong>Variabilidad de Resultados:</strong> Los resultados
              derivados de la aplicación del contenido pueden variar
              significativamente según la persona, su contexto, y el esfuerzo
              invertido. No se garantiza ningún resultado específico.
            </p>
            <p>
              <strong>Fuentes y Opiniones:</strong> El contenido de los Ebooks,
              aunque en ocasiones se fundamenta en bases científicas o estudios,
              está basado en gran medida en experiencias y opiniones personales.
              Proyecto Kaizen no se hace responsable de la exactitud o
              aplicabilidad de las teorías de los autores citados.
            </p>
            <p>
              <strong>Exención de Responsabilidad por Daños:</strong> No nos
              hacemos responsables por ningún daño, pérdida o perjuicio, directo
              o indirecto, que el Usuario pueda sufrir como resultado del uso o
              la incapacidad de uso de la información contenida en los Ebooks.
            </p>
            <p>
              <strong>Responsabilidad del Usuario:</strong> El Usuario entiende
              y acepta que, al comprar y utilizar este material, es el único y
              total responsable de sus propias acciones, decisiones y de los
              resultados que obtenga a partir de ellas.
            </p>
          </section>

          <section className='terms-section'>
            <h2>9. Modificación de los Términos</h2>
            <p>
              Proyecto Kaizen se reserva el derecho de modificar estos Términos
              y Condiciones en cualquier momento. Las modificaciones serán
              publicadas en este mismo medio y entrarán en vigor de forma
              inmediata.
            </p>
          </section>

          <section className='terms-section'>
            <h2>10. Legislación Aplicable</h2>
            <p>
              Cualquier controversia derivada de la aplicación o interpretación
              de estos términos se regirá por la legislación vigente y se
              someterá a la jurisdicción de los tribunales competentes.
            </p>
          </section>

          <section className='terms-section'>
            <p>
              Al hacer clic en el botón de "Comprar", usted confirma que es
              mayor de edad y que acepta de forma vinculante todos los términos
              aquí expuestos.
            </p>
          </section>
        </div>

        {/* Botón de regreso al final */}
        <div className='terms-footer'>
          <button onClick={handleGoBack} className='back-button-footer'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M19 12H5M12 19l-7-7 7-7' />
            </svg>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
