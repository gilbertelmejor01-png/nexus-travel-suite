import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Formato de email inválido" }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value && !validatePassword(value)) {
      setErrors((prev) => ({
        ...prev,
        password: "La contraseña debe tener al menos 8 caracteres",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email) || !validatePassword(password)) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: "Email o contraseña incorrectos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserDocument = async (user: any) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || "",
          rol: "user",
          preferencias: {
            idioma: "es",
            moneda: "EUR",
          },
          fecha_creacion: new Date(),
          ultimo_login: new Date(),
        });
      }
    } catch (error) {
      console.error("Error creating user document:", error);
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

  const isEmailValid = email && validateEmail(email);
  const isPasswordValid = password && validatePassword(password);

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
          <p className="text-muted-foreground">
            Gestión inteligente de presupuestos
          </p>
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
                  O inicia sesión con email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={handleEmailChange}
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
                    value={password}
                    onChange={handlePasswordChange}
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

              {/* Submit Button */}
              <Button
                type="submit"
                variant="flowmatic"
                size="lg"
                className="w-full"
                disabled={loading || !isEmailValid || !isPasswordValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Acceder"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="text-flowmatic-teal hover:text-flowmatic-green font-medium"
          >
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
