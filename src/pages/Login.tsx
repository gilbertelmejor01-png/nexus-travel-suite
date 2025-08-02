import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
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
      setErrors(prev => ({ ...prev, email: "Formato de email inválido" }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    if (value && !validatePassword(value)) {
      setErrors(prev => ({ ...prev, password: "La contraseña debe tener al menos 8 caracteres" }));
    } else {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email) || !validatePassword(password)) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive"
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-foreground">Flowmatic Travel</h1>
          <p className="text-muted-foreground">Gestión inteligente de presupuestos</p>
        </div>

        <Card className="shadow-flowmatic border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
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
                <label className="text-sm font-medium text-foreground">Contraseña</label>
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          ¿Necesitas ayuda? Contacta con soporte
        </div>
      </div>
    </div>
  );
};

export default Login;