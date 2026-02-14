import Script from 'next/script';

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox';
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-expect-error Paddle global
          if (typeof Paddle !== 'undefined') {
            if (paddleEnv === 'sandbox') {
              // @ts-expect-error Paddle global
              Paddle.Environment.set('sandbox');
            }
            // @ts-expect-error Paddle global
            Paddle.Setup({ token: clientToken });
          }
        }}
      />
      {children}
    </>
  );
}
