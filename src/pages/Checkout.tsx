import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// TODO: Reemplazar con clave real de Stripe
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    // Simulación de llamada al backend para autorizar
    setTimeout(() => {
      setLoading(false);
      navigate('/delivery');
    }, 2000);
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
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? 'Procesando retención...' : 'Autorizar Garantía ($650.00)'}
      </Button>
    </form>
  );
};

export const Checkout = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Pago en Garantía</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-green-600" />
              Depósito Seguro
            </CardTitle>
            <CardDescription>
              Retención de fondos. No se te cobrará a menos que haya daños o pérdida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Alquiler (3 días)</span>
                <span className="font-medium">$150.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Depósito de Garantía</span>
                <span className="font-medium">$500.00</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-base font-bold text-slate-900">
                <span>Total a Retener</span>
                <span>$650.00</span>
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
            <Elements stripe={stripePromise}>
              <CheckoutForm />
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
