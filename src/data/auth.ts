/**
 * Controle de acesso por ID (lado cliente).
 * O ID é guardado no localStorage e enviado no header `x-access-id` em toda
 * operação de escrita. A validação real acontece no servidor (/api/auth e os
 * endpoints de escrita), então o ID nunca fica embutido no bundle.
 */
const KEY = 'fg_access_id'

export function getAccessId(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAccessId(id: string): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
}

export function clearAccessId(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function isAuthed(): boolean {
  return getAccessId().length > 0
}

/** Header de autenticação para requests de escrita. */
export function authHeader(extra?: Record<string, string>): Record<string, string> {
  return { ...(extra ?? {}), 'x-access-id': getAccessId() }
}
