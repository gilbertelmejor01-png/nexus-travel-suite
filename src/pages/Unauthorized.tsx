import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Acceso no autorizado
        </h1>
        <p className="text-muted-foreground">
          No tienes permiso para acceder a esta página. Por favor, contacta al
          administrador si crees que esto es un error.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Volver atrás
          </Button>
          <Button onClick={() => navigate("/dashboard")}>Ir al inicio</Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
