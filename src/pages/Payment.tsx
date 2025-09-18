import React, { useState } from "react";
import StripePayment from "@/components/Stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Euro } from "lucide-react";

const PaymentPage = () => {
  const [amount, setAmount] = useState<number>(100); // Valor por defecto de 100€

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setAmount(value);
    }
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log("Pago exitoso:", paymentIntent);
    // Aquí puedes redirigir o mostrar un mensaje de éxito
  };

  const handlePaymentError = (error: any) => {
    console.error("Error en el pago:", error);
    // Aquí puedes manejar el error
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-6 w-6" />
              Configuración del Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto a pagar (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  min="0"
                  step="0.01"
                  placeholder="Ingresa el monto"
                  className="max-w-xs"
                />
              </div>
              <p className="text-sm text-gray-500">
                El monto mínimo para procesar el pago es de 0.50€
              </p>
            </div>
          </CardContent>
        </Card>

        {amount >= 0.5 && (
          <StripePayment
            amount={amount}
            title="Procesar Pago"
            description="Completa la información para procesar tu pago de forma segura"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}

        {amount < 0.5 && amount > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-center text-yellow-800">
                <p>El monto mínimo para procesar el pago es de 0.50€</p>
                <p className="text-sm">Por favor, ingresa un monto válido</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
