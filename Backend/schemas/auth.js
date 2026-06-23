const { z } = require("zod");

const registroSchema = z.object({
  nombre: z.string().min(1).max(100).trim(),
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  rol: z
    .enum(["usuario", "negocio", "propietario"])
    .optional()
    .default("usuario"),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

// PUT /api/auth/perfil — solo el nombre es editable aquí.
// La foto se sube por endpoint separado (multipart). El email NO es
// editable: es el identificador de la cuenta y cambiar de propietario
// de bandeja requiere verificación, que no implementamos aquí.
const actualizarPerfilSchema = z.object({
  nombre: z.string().min(1).max(100).trim(),
});

// PUT /api/auth/password — cambio de contraseña.
// La contraseña actual es obligatoria para evitar que un atacante con
// sesión robada (ej. token filtrado, dispositivo desbloqueado) pueda
// cambiar la contraseña y expulsar al dueño legítimo de la cuenta.
const passwordSchema = z
  .object({
    passwordActual: z.string().min(1).max(128).optional(),
    passwordNueva: z.string().min(8).max(128),
  })
  .refine(
    (data) =>
      /[A-Z]/.test(data.passwordNueva) && /[0-9]/.test(data.passwordNueva),
    {
      message:
        "La nueva contraseña debe contener al menos una mayúscula y un número",
      path: ["passwordNueva"],
    },
  );

module.exports = {
  registroSchema,
  loginSchema,
  actualizarPerfilSchema,
  passwordSchema,
};
