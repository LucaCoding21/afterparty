import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // Meta pixel (components/MetaPixel.tsx): fbevents.js and its config load
    // from connect.facebook.net, events are sent to www.facebook.com. Both are
    // merged into Hydrogen's defaults. Scripts and images fall back to
    // default-src; connect-src is its own directive.
    //
    // The two cloud hosts are the pixel's Conversions API Gateway, which the
    // pixel config (connect.facebook.net/signals/config/<id>, "openbridge")
    // tells fbevents.js to copy every event to. If the gateway is moved in
    // Events Manager these go stale; events still reach www.facebook.com.
    defaultSrc: ['https://connect.facebook.net', 'https://www.facebook.com'],
    connectSrc: [
      'https://connect.facebook.net',
      'https://www.facebook.com',
      'https://v5-b75ccb2b73c54aa4a5098ab7f8533696.ecs.us-east-2.on.aws',
      'https://bded8a3c6ae-1-1053047382554.us-central1.run.app',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
