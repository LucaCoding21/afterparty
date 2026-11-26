import type {
  CartReturn,
  HydrogenCart,
  HydrogenSession,
} from '@shopify/hydrogen';
import {blackFridayWindow, type BlackFriday} from '~/lib/blackFriday';

/**
 * Black Friday preview.
 *
 * Opening any page with `?bf_preview=<token>` turns the sale on in that
 * browser before it starts; `?bf_preview=off` turns it off again. The token
 * is kept in the session and stamped on the cart as the hidden
 * `_bf_preview` attribute. The keycap-gift discount function compares it
 * with the token in its configuration metafield, so checkout gives the sale
 * prices to that cart only.
 *
 * This repo is public, so only the token's SHA-256 is kept here. The token
 * itself is in the "Free Nhím Keycap Clicker" discount's configuration.
 */
const PREVIEW_PARAM = 'bf_preview';
const PREVIEW_SESSION_KEY = 'bfPreview';
const PREVIEW_CART_ATTRIBUTE = '_bf_preview';
const PREVIEW_TOKEN_SHA256 =
  'd862bbbd5c1c34501060940a996a6c46a105897314138d2b4e8e43944cd99d6e';

type BlackFridayRequestState = BlackFriday & {previewToken: string | null};

/** The root loader, the /cart loader and the cart action share one result per request. */
const perRequest = new WeakMap<Request, Promise<BlackFridayRequestState>>();

export function getBlackFriday(request: Request, session: HydrogenSession) {
  let pending = perRequest.get(request);
  if (!pending) {
    pending = resolveBlackFriday(request, session);
    perRequest.set(request, pending);
  }
  return pending;
}

async function resolveBlackFriday(
  request: Request,
  session: HydrogenSession,
): Promise<BlackFridayRequestState> {
  // The visitor's own country, not the market: everyone outside VN, KR, JP
  // and AU shares the US market but keeps their own local time.
  const {starts, ends} = blackFridayWindow(
    request.headers.get('Oxygen-Buyer-Country'),
  );
  const now = Date.now();
  const live = now >= starts && now < ends;

  let token: string | null = session.get(PREVIEW_SESSION_KEY) ?? null;
  const param = new URL(request.url).searchParams.get(PREVIEW_PARAM);
  if (param !== null) {
    if (await isPreviewToken(param)) {
      session.set(PREVIEW_SESSION_KEY, param);
      token = param;
    } else if (token !== null) {
      session.unset(PREVIEW_SESSION_KEY);
      token = null;
    }
  }

  const preview =
    !live && now < ends && token !== null
      ? await isPreviewToken(token)
      : false;
  return {on: live || preview, preview, previewToken: preview ? token : null};
}

async function isPreviewToken(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return hex === PREVIEW_TOKEN_SHA256;
}

/**
 * Keep the cart's `_bf_preview` attribute in step with the visitor's
 * preview: add it for a previewing browser, drop it otherwise. Carts without
 * a preview never have it, so this costs live shoppers no request.
 */
export async function syncBlackFridayPreview(
  cart: HydrogenCart,
  current: CartReturn,
  previewToken: string | null,
): Promise<CartReturn> {
  const attributes = current.attributes ?? [];
  const stamped =
    attributes.find((a) => a.key === PREVIEW_CART_ATTRIBUTE)?.value ?? null;
  if (stamped === previewToken) return current;

  const others = attributes
    .filter((a) => a.key !== PREVIEW_CART_ATTRIBUTE)
    .map(({key, value}) => ({key, value: value ?? ''}));
  const result = await cart.updateAttributes(
    previewToken
      ? [...others, {key: PREVIEW_CART_ATTRIBUTE, value: previewToken}]
      : others,
  );
  if (result.userErrors?.length) {
    console.error('black friday preview attribute failed', result.userErrors);
    return current;
  }
  return result.cart?.lines ? result.cart : ((await cart.get()) ?? current);
}
