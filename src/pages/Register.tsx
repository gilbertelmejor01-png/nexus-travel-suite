import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Mail, Lock, Eye, EyeOff, Loader2, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const validateName = (name: string) => {
    return name.trim().length >= 2;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validaciones en tiempo real
    if (field === "name" && value && !validateName(value)) {
      setErrors((prev) => ({
        ...prev,
        name: "El nombre debe tener al menos 2 caracteres",
      }));
    } else if (field === "email" && value && !validateEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Formato de email inválido" }));
    } else if (field === "password" && value && !validatePassword(value)) {
      setErrors((prev) => ({
        ...prev,
        password: "La contraseña debe tener al menos 8 caracteres",
      }));
    } else if (
      field === "confirmPassword" &&
      value &&
      value !== formData.password
    ) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Las contraseñas no coinciden",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const createUserDocument = async (
    user: any,
    additionalData: { name?: string; isFreeTrial?: boolean } = {}
  ) => {
    try {
      const trialEndDate = additionalData.isFreeTrial 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días desde ahora
        : null;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: additionalData.name || user.displayName || "",
        rol: "user",
        preferencias: {
          idioma: "es",
          moneda: "EUR",
        },
        fecha_creacion: new Date(),
        ultimo_login: new Date(),
        // Información del trial gratuito
        trial_gratuito: additionalData.isFreeTrial || false,
        trial_fecha_inicio: additionalData.isFreeTrial ? new Date() : null,
        trial_fecha_fin: trialEndDate,
        trial_activo: additionalData.isFreeTrial || false,
        ...additionalData,
      });
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password, confirmPassword } = formData;

    if (
      !validateName(name) ||
      !validateEmail(email) ||
      !validatePassword(password) ||
      password !== confirmPassword
    ) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await createUserDocument(userCredential.user, { name, isFreeTrial });

      toast({
        title: isFreeTrial ? "¡Trial gratuito activado!" : "¡Cuenta creada!",
        description: isFreeTrial 
          ? "Tu trial gratuito de 7 días ha sido activado" 
          : "Tu cuenta ha sido creada exitosamente",
      });
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = "Error al crear la cuenta";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email ya está registrado";
      }
      toast({
        title: "Error de registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await createUserDocument(userCredential.user);

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión con Google correctamente",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: "Error al iniciar sesión con Google",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const isNameValid = formData.name && validateName(formData.name);
  const isEmailValid = formData.email && validateEmail(formData.email);
  const isPasswordValid =
    formData.password && validatePassword(formData.password);
  const isConfirmPasswordValid =
    formData.confirmPassword && formData.confirmPassword === formData.password;

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-flowmatic rounded-2xl mb-4 shadow-flowmatic">
            <span className="text-2xl font-bold text-white">✈️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Flowmatic Travel
          </h1>
          <p className="text-muted-foreground">Crea tu cuenta para comenzar</p>
        </div>

        <Card className="shadow-flowmatic border-0">
          <CardContent className="p-6">
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full mb-6 border-flowmatic-teal text-flowmatic-teal hover:bg-flowmatic-teal hover:text-white"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O registrarse con email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nombre completo
                </label>
                <Input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  iconPosition="left"
                  error={!!errors.name}
                  success={isNameValid}
                  className="transition-all duration-300"
                />
                {isNameValid && (
                  <div className="flex items-center gap-2 text-success text-sm">
                    <Check className="h-4 w-4" />
                    <span>Nombre válido</span>
                  </div>
                )}
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  iconPosition="left"
                  error={!!errors.email}
                  success={isEmailValid}
                  className="transition-all duration-300"
                />
                {isEmailValid && (
                  <div className="flex items-center gap-2 text-success text-sm">
                    <Check className="h-4 w-4" />
                    <span>Email válido</span>
                  </div>
                )}
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    icon={<Lock className="h-4 w-4" />}
                    iconPosition="left"
                    error={!!errors.password}
                    success={isPasswordValid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    icon={<Lock className="h-4 w-4" />}
                    iconPosition="left"
                    error={!!errors.confirmPassword}
                    success={isConfirmPasswordValid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Free Trial Option */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="freeTrial"
                    checked={isFreeTrial}
                    onChange={(e) => setIsFreeTrial(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="freeTrial" className="text-sm font-medium text-gray-900 cursor-pointer">
                      🎉 Registro gratuito por 7 días
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Prueba todas las funciones premium sin costo. Sin tarjeta de crédito requerida.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                variant="flowmatic"
                size="lg"
                className="w-full"
                disabled={
                  loading ||
                  !isNameValid ||
                  !isEmailValid ||
                  !isPasswordValid ||
                  !isConfirmPasswordValid
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isFreeTrial ? "Activando trial gratuito..." : "Creando cuenta..."}
                  </>
                ) : (
                  isFreeTrial ? "🎉 Iniciar Trial Gratuito" : "Crear cuenta"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="text-flowmatic-teal hover:text-flowmatic-green font-medium"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
