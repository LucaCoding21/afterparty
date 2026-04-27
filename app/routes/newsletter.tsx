import type {Route} from './+types/newsletter';
import {data} from 'react-router';

/**
 * Resource route for the footer newsletter signup. POST { email } and we
 * create a Shopify customer with `acceptsMarketing: true`, which puts them
 * in Shopify Admin → Customers and qualifies them for Shopify Email /
 * marketing campaigns. The Storefront customerCreate mutation requires a
 * password we don't need; we generate a random one. The customer can claim
 * the account later via password reset if they ever want to log in.
 */
export async function loader() {
  // GET should not render anything — this route only exists for POSTs.
  throw new Response('Not Found', {status: 404});
}

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return data({error: 'Please enter a valid email.'}, {status: 400});
  }

  const password = `np_${crypto.randomUUID()}${crypto.randomUUID()}`;

  try {
    const result = await context.storefront.mutate(NEWSLETTER_MUTATION, {
      variables: {input: {email, password, acceptsMarketing: true}},
    });
    const errors = result?.customerCreate?.customerUserErrors ?? [];
    if (errors.length > 0) {
      // "Already a customer" is a successful outcome from the user's POV.
      const alreadyExists = errors.some(
        (e: any) =>
          e.code === 'TAKEN' ||
          (e.message ?? '').toLowerCase().includes('taken') ||
          (e.message ?? '').toLowerCase().includes('already'),
      );
      if (alreadyExists) return data({ok: true});
      return data(
        {error: errors[0]?.message ?? 'Could not subscribe.'},
        {status: 400},
      );
    }
    return data({ok: true});
  } catch (err) {
    return data({error: 'Something went wrong. Try again.'}, {status: 500});
  }
}

const NEWSLETTER_MUTATION = `#graphql
  mutation NewsletterSignup($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id }
      customerUserErrors { code field message }
    }
  }
` as const;
