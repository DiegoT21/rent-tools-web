import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldCheck, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractService, RentalContract } from '../services/contractService';
import { alerts } from '../lib/alerts';

const CheckoutForm = ({ clientSecret, contractUuid }: { clientSecret: string; contractUuid: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Error al procesar el pago con Stripe.");
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await contractService.confirmStripePayment(contractUuid);
        await alerts.success("Pago Completado", "El hold y pago han sido autorizados exitosamente.");
        navigate(`/rentals/contracts/${contractUuid}`);
      } else {
        throw new Error("El pago no pudo completarse. Estado: " + result.paymentIntent?.status);
      }
    } catch (e: any) {
      console.error(e);
      await alerts.error("Error de Pago", e.message || "Hubo un problema al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 p-4 border rounded-md bg-slate-50">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }} />
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-orange-500 hover:bg-orange-600">
        {loading ? 'Procesando pago...' : 'Autorizar y Pagar'}
      </Button>
    </form>
  );
};

export const Checkout = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) return;
    const init = async () => {
      try {
        const c = await contractService.getByUuid(uuid);
        setContract(c);
        const intent = await contractService.createPaymentIntent(uuid);
        setStripeKey(intent.publishableKey);
        setClientSecret(intent.clientSecret);
      } catch (e: any) {
        console.error(e);
        alerts.error("Error", e?.response?.data?.message || "No se pudo iniciar el pago.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [uuid]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-600">Cargando detalles de pago...</div>;
  }

  if (!contract || !clientSecret || !stripeKey) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-red-600">
        No se pudo iniciar el proceso de pago. Asegúrate de que Stripe esté configurado en el servidor.
      </div>
    );
  }

  const stripePromiseInstance = loadStripe(stripeKey);

  const pricePerDay = contract.pricing?.pricePerDay ?? 0;
  const totalDays = contract.pricing?.totalDays ?? 0;
  const rentalSubtotal = pricePerDay * totalDays;
  const depositAmount = contract.pricing?.depositAmount ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Pago en Garantía</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-green-600" />
              Depósito de Garantía
            </CardTitle>
            <CardDescription>
              Solo se cobra el depósito de garantía (hold) ahora. Este monto se retiene temporalmente y se devuelve al finalizar el alquiler si no hay daños. El pago del alquiler se gestiona por separado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Alquiler ({totalDays} días × ${pricePerDay.toFixed(2)})</span>
                <span>${rentalSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Depósito de Garantía (Hold)</span>
                <span className="font-medium">${depositAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-base font-bold text-green-700">
                <span>A pagar ahora (solo hold)</span>
                <span>${depositAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                El alquiler de ${rentalSubtotal.toFixed(2)} se gestiona por separado. Solo se cobra el depósito de garantía en este paso.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Datos de Tarjeta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromiseInstance} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} contractUuid={uuid!} />
            </Elements>
          </CardContent>
          <CardFooter className="text-xs text-slate-500 text-center">
            Pagos procesados de forma segura por Stripe. RentTools no almacena tu tarjeta.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
