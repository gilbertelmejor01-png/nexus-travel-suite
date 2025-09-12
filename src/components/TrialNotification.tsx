import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Crown, Clock, AlertTriangle } from "lucide-react";

export function TrialNotification() {
  const [trialData, setTrialData] = useState<{
    trial_gratuito: boolean;
    trial_fecha_inicio: any;
    trial_fecha_fin: any;
    trial_activo: boolean;
  } | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [lastNotificationDate, setLastNotificationDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrialData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setTrialData(userData);
          
          if (userData.trial_gratuito && userData.trial_activo) {
            const now = new Date();
            const trialEnd = userData.trial_fecha_fin.toDate();
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setDaysRemaining(Math.max(0, diffDays));
            
            // Verificar si debemos mostrar la notificación
            const today = new Date().toDateString();
            const storedDate = localStorage.getItem('lastTrialNotification');
            
            if (storedDate !== today && diffDays >= 0) {
              setShowNotification(true);
              setLastNotificationDate(today);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching trial data:", error);
      }
    };

    fetchTrialData();
  }, []);

  const handleCloseNotification = () => {
    setShowNotification(false);
    if (lastNotificationDate) {
      localStorage.setItem('lastTrialNotification', lastNotificationDate);
    }
  };

  const getNotificationContent = () => {
    if (daysRemaining > 3) {
      return {
        icon: <Crown className="h-5 w-5 text-green-600" />,
        title: "🎉 ¡Trial Gratuito Activo!",
        message: `Disfruta de ${daysRemaining} días más de acceso premium. ¡Actualiza tu plan para continuar después del trial!`,
        variant: "default" as const,
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        borderColor: "border-green-200"
      };
    } else if (daysRemaining > 1) {
      return {
        icon: <Clock className="h-5 w-5 text-yellow-600" />,
        title: "⏰ Trial por Expirar",
        message: `Solo quedan ${daysRemaining} días de tu trial gratuito. ¡Actualiza ahora para no perder el acceso!`,
        variant: "default" as const,
        bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50",
        borderColor: "border-yellow-200"
      };
    } else if (daysRemaining === 1) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        title: "⚠️ Último Día",
        message: "¡Este es tu último día de trial gratuito! Actualiza ahora para mantener el acceso premium.",
        variant: "destructive" as const,
        bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
        borderColor: "border-red-200"
      };
    } else {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        title: "❌ Trial Expirado",
        message: "Tu trial gratuito ha expirado. Actualiza tu plan para continuar disfrutando de todas las funciones.",
        variant: "destructive" as const,
        bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
        borderColor: "border-red-200"
      };
    }
  };

  if (!showNotification || !trialData?.trial_gratuito || !trialData?.trial_activo) {
    return null;
  }

  const content = getNotificationContent();

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      <Alert className={`${content.bgColor} ${content.borderColor} border-2 shadow-lg`}>
        <div className="flex items-start gap-3">
          {content.icon}
          <div className="flex-1">
            <AlertDescription className="space-y-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {content.title}
                </h4>
                <p className="text-sm text-gray-700">
                  {content.message}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Actualizar Plan
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCloseNotification}
                >
                  Recordar más tarde
                </Button>
              </div>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseNotification}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
