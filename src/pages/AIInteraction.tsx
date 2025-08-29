import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

const AIInteraction = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Interacción con IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Módulo de interacción con IA en desarrollo.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInteraction;