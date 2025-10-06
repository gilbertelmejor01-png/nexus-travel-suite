import { useState, useEffect } from "react";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, Clock, AlertTriangle } from "lucide-react";

interface TrialProgressProps {
  collapsed?: boolean;
}

interface TrialData {
  trial_gratuito?: boolean;
  trial_fecha_inicio?: any;
  trial_fecha_fin?: any;
  trial_activo?: boolean;
}

export function TrialProgress({ collapsed = false }: TrialProgressProps) {
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(100);

  useEffect(() => {
    const fetchTrialData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Extraer solo las propiedades que necesitamos y asignar al estado
          const trialDataFromFirebase: TrialData = {
            trial_gratuito: userData.trial_gratuito,
            trial_fecha_inicio: userData.trial_fecha_inicio,
            trial_fecha_fin: userData.trial_fecha_fin,
            trial_activo: userData.trial_activo,
          };
          setTrialData(trialDataFromFirebase);
          
          if (userData.trial_gratuito && userData.trial_activo && userData.trial_fecha_fin) {
            const now = new Date();
            const trialEnd = userData.trial_fecha_fin.toDate ? userData.trial_fecha_fin.toDate() : new Date(userData.trial_fecha_fin);
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const clampedDays = Math.max(0, Math.min(7, diffDays));
            setDaysRemaining(clampedDays);
            const totalDays = 7;
            const percentage = (clampedDays / totalDays) * 100;
            setProgressPercentage(percentage);
          } else {
            setDaysRemaining(0);
            setProgressPercentage(0);
          }
        } else {
          setTrialData(null);
          setDaysRemaining(0);
          setProgressPercentage(0);
        }
      } catch (error) {
        console.error("Error fetching trial data:", error);
        setTrialData(null);
        setDaysRemaining(0);
        setProgressPercentage(0);
      }
    };

    fetchTrialData();
  }, []);

  // Siempre renderizar; si no hay trial activo, mostraremos estado neutral y 0%

  const getProgressColor = () => {
    if (daysRemaining > 3) return "bg-green-500";
    if (daysRemaining > 1) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusIcon = () => {
    if (daysRemaining > 3) return <Crown className="h-4 w-4 text-green-600" />;
    if (daysRemaining > 1) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (!trialData?.trial_gratuito) return "Sin trial";
    if (!trialData?.trial_activo) return "Trial inactivo";
    if (daysRemaining > 3) return "Trial activo";
    if (daysRemaining > 1) return "Trial por expirar";
    return "Trial expirado";
  };

  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {!collapsed && (
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className="text-xs text-gray-500">
            {daysRemaining} días restantes
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-2"
        />
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {daysRemaining === 0 ? "Trial expirado" : `${daysRemaining} días restantes`}
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6 px-2"
            >
              Actualizar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
