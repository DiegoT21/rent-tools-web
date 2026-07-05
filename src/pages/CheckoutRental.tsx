import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { DollarSign, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractService, RentalContract } from '../services/contractService';
import { alerts } from '../lib/alerts';

const CheckoutRentalForm = ({ clientSecret, contractUuid }: { clientSecret: string; contractUuid: string }) => {
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
        throw new Error(result.error.message || 'Error al procesar el pago con Stripe.');
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await contractService.confirmRentalPayment(contractUuid);
        await alerts.success('Pago Completado', 'El alquiler fue pagado exitosamente.');
        navigate(`/rentals/contracts/${contractUuid}`);
      } else {
        throw new Error('El pago no pudo completarse. Estado: ' + result.paymentIntent?.status);
      }
    } catch (e: any) {
      console.error(e);
      await alerts.error('Error de Pago', e.message || 'Hubo un problema al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 p-4 border rounded-md bg-slate-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#9e2146' },
            },
          }}
        />
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-orange-500 hover:bg-orange-600">
        {loading ? 'Procesando pago...' : 'Pagar Alquiler'}
      </Button>
    </form>
  );
};

export const CheckoutRental = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [rentalAmount, setRentalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uuid) return;
    const init = async () => {
      try {
        const c = await contractService.getByUuid(uuid);
        setContract(c);
        const intent = await contractService.createRentalPaymentIntent(uuid);
        setStripeKey(intent.publishableKey);
        setClientSecret(intent.clientSecret);
        setRentalAmount(intent.rentalAmount ?? 0);
      } catch (e: any) {
        console.error(e);
        const msg = e?.response?.data?.message || 'No se pudo iniciar el pago del alquiler.';
        await alerts.error('Error', msg);
        if (uuid) navigate(`/rentals/contracts/${uuid}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [uuid]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-600">
        Cargando detalles de pago...
      </div>
    );
  }

  if (!contract || !clientSecret || !stripeKey) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-red-600">
        No se pudo iniciar el pago del alquiler. Asegúrate de que el contrato esté activo y Stripe esté configurado.
      </div>
    );
  }

  const stripePromiseInstance = loadStripe(stripeKey);
  const pricePerDay = contract.pricing?.pricePerDay ?? 0;
  const totalDays = contract.pricing?.totalDays ?? 0;
  const depositAmount = contract.pricing?.depositAmount ?? 0;
  const amount = rentalAmount || pricePerDay * totalDays;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Pago del Alquiler</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-orange-500" />
              Monto del Alquiler
            </CardTitle>
            <CardDescription>
              Este es el costo del alquiler por los días acordados. El depósito de garantía (${depositAmount.toFixed(2)}) ya fue cobrado anteriormente y será reembolsado al devolver la herramienta en buen estado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  {totalDays} días × ${pricePerDay.toFixed(2)}/día
                </span>
                <span>${(pricePerDay * totalDays).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 line-through">
                <span>Depósito (ya pagado)</span>
                <span>${depositAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between text-base font-bold text-orange-600">
                <span>A pagar ahora</span>
                <span>${amount.toFixed(2)}</span>
              </div>
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
              <CheckoutRentalForm clientSecret={clientSecret} contractUuid={uuid!} />
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
