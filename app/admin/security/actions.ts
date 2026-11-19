'use server';
import QRCode from 'qrcode';
import {requirePrimaryOwner, ownerMfa} from '@/lib/server/identity/access';
import {MfaError} from '@/lib/server/identity/mfa';

// Server Actions enforce the request origin. Identity, role and session are
// resolved on the server for every call; no browser-supplied user/session IDs.
export async function mfaAction(action: string, code = '', recovery = false) {
  const {context} = await requirePrimaryOwner();
  try {
    if (typeof code !== 'string' || code.length > 100 || typeof recovery !== 'boolean') throw new MfaError('Enter a valid code.');
    const mfa = ownerMfa();
    if (action === 'begin') {
      const enrollment = await mfa.begin(context);
      return {ok: true as const, enrollment: {...enrollment, qr: await QRCode.toDataURL(enrollment.uri, {width: 240, margin: 2})}};
    }
    if (action === 'confirm') return {ok: true as const, ...await mfa.confirm(context, code.trim())};
    if (action === 'verify') { await mfa.verify(context, code.trim(), recovery); return {ok: true as const}; }
    if (action === 'rotate') return {ok: true as const, ...await mfa.rotateRecovery(context, code.trim())};
    if (action === 'reset') { await mfa.reset(context, code.trim(), recovery); return {ok: true as const}; }
    throw new MfaError('Unknown security action.');
  } catch (error) {
    if (error instanceof MfaError) return {ok: false as const, error: error.message};
    console.error('Owner MFA operation failed', error instanceof Error ? error.name : 'UnknownError');
    return {ok: false as const, error: 'Security check could not complete. Please try again.'};
  }
}
