import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Euro,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

// Configuración de Stripe - Reemplaza con tu clave pública de Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_your_publishable_key_here"
);

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: any) => void;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = "eur",
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "succeeded" | "failed"
  >("idle");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ES",
  });

  // Crear Payment Intent cuando el monto esté disponible
  useEffect(() => {
    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe espera amount en centavos
          currency: currency.toLowerCase(),
          metadata: {
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear el payment intent");
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo inicializar el proceso de pago",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setPaymentStatus("processing");

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: {
                line1: customerInfo.address,
                city: customerInfo.city,
                postal_code: customerInfo.postalCode,
                country: customerInfo.country,
              },
            },
          },
        }
      );

      if (error) {
        setPaymentStatus("failed");
        toast({
          title: "Error en el pago",
          description: error.message,
          variant: "destructive",
        });
        onError?.(error);
      } else if (paymentIntent.status === "succeeded") {
        setPaymentStatus("succeeded");
        toast({
          title: "¡Pago exitoso!",
          description: "Tu pago ha sido procesado correctamente",
          variant: "default",
        });
        onSuccess?.(paymentIntent);
      }
    } catch (error) {
      setPaymentStatus("failed");
      toast({
        title: "Error",
        description: "Ocurrió un error durante el proceso de pago",
        variant: "destructive",
      });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
        backgroundColor: "#ffffff",
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: true,
  };

  if (paymentStatus === "succeeded") {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-semibold text-green-700">
          ¡Pago Completado!
        </h3>
        <p className="text-gray-600">
          Tu pago de {amount}€ ha sido procesado exitosamente.
        </p>
        <Button onClick={() => setPaymentStatus("idle")} className="mt-4">
          Realizar otro pago
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del cliente */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Información del cliente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              value={customerInfo.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="juan@ejemplo.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+34 612 345 678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Select
              value={customerInfo.country}
              onValueChange={(value) => handleInputChange("country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ES">España</SelectItem>
                <SelectItem value="FR">Francia</SelectItem>
                <SelectItem value="DE">Alemania</SelectItem>
                <SelectItem value="IT">Italia</SelectItem>
                <SelectItem value="PT">Portugal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={customerInfo.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Calle Principal 123"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={customerInfo.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Madrid"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input
              id="postalCode"
              value={customerInfo.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
              placeholder="28001"
            />
          </div>
        </div>
      </div>

      {/* Información de pago */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Información de pago
        </h3>

        <div className="border rounded-lg p-4 bg-gray-50">
          <Label htmlFor="card-element">Datos de la tarjeta *</Label>
          <div className="mt-2 p-3 border rounded-md bg-white">
            <CardElement id="card-element" options={cardElementOptions} />
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Tus datos de pago están protegidos y encriptados
          </p>
        </div>

        {/* Resumen del pago */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Resumen del pago</h4>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total a pagar:</span>
            <span className="text-2xl font-bold text-blue-800 flex items-center gap-1">
              <Euro className="h-5 w-5" />
              {amount.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {currency.toUpperCase()} • Impuestos incluidos
          </div>
        </div>
      </div>

      {/* Botón de pago */}
      <Button
        type="submit"
        disabled={
          !stripe || loading || !clientSecret || paymentStatus === "processing"
        }
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
        size="lg"
      >
        {loading || paymentStatus === "processing" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Procesando pago...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Pagar {amount.toFixed(2)}€
          </>
        )}
      </Button>

      {paymentStatus === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error en el pago</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            Por favor, verifica tus datos e intenta nuevamente.
          </p>
        </div>
      )}

      {/* Información de seguridad */}
      <div className="text-center text-xs text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Lock className="h-3 w-3" />
          <span>Pago seguro con Stripe</span>
        </div>
        <p>Tus datos están protegidos por encriptación SSL de 256-bit</p>
      </div>
    </form>
  );
};

interface StripePaymentProps extends PaymentFormProps {
  title?: string;
  description?: string;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  title = "Pasarela de Pago Segura",
  description = "Completa tu pago de forma segura con Stripe",
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              {title}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {description}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            <Lock className="h-3 w-3 mr-1" />
            Secure
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Paso 1 de 2</span>
            <span>Información de pago</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default StripePayment;
