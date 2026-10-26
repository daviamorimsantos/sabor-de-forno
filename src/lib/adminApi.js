const TOKEN_KEY = 'forno_sabor_admin_token'

export function getAdminToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export function setAdminToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export async function adminRequest(action, payload = {}, token = getAdminToken()) {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  })
  let result = {}
  try { result = await response.json() } catch {}
  if (!response.ok) {
    if (response.status === 401 && action !== 'login') setAdminToken('')
    throw new Error(result.error || `Falha na solicitação (${response.status}).`)
  }
  return result
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      resolve(value.includes(',') ? value.split(',')[1] : value)
    }
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  })
}
