// api/cards/delete.js
// Este es un ejemplo de cómo podría verse tu archivo de API de Vercel.
// Necesitarás adaptarlo a tu lógica de base de datos real.

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { id } = req.query; // Obtener el ID de la tarjeta de los parámetros de la URL

    if (!id) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Se requiere el ID de la tarjeta para eliminar.",
        });
    }

    try {
      // Aquí iría tu lógica para interactuar con tu base de datos
      // Por ejemplo, si usas Firestore:
      // import { doc, deleteDoc } from 'firebase/firestore';
      // const cardRef = doc(db, 'cards', id);
      // await deleteDoc(cardRef);

      // Si usas una base de datos diferente, la lógica será distinta.
      console.log(`Intentando eliminar tarjeta con ID: ${id}`);
      // Simulación de eliminación exitosa
      const deletionSuccessful = true; // Replace with actual database deletion logic

      if (deletionSuccessful) {
        return res
          .status(200)
          .json({
            success: true,
            message: `Tarjeta con ID ${id} eliminada exitosamente.`,
          });
      } else {
        // En caso de que la tarjeta no exista o falle la eliminación en la DB
        return res
          .status(404)
          .json({
            success: false,
            error: "Tarjeta no encontrada o no se pudo eliminar.",
          });
      }
    } catch (error) {
      console.error("Error al eliminar tarjeta en el backend:", error);
      return res
        .status(500)
        .json({
          success: false,
          error: "Error interno del servidor al eliminar la tarjeta.",
        });
    }
  } else {
    // Si la solicitud no es DELETE, devuelve un error 405 Method Not Allowed
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
