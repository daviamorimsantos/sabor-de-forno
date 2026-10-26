import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'

const TOKEN_TTL_SECONDS = 12 * 60 * 60
const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'])
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const failedLogins = new Map()

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  return res.status(status).json(body)
}

function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVER_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const password = process.env.ADMIN_PASSWORD
  if (!url || !key || !password) return { error: 'Configuração incompleta na Vercel. Confira ADMIN_PASSWORD, VITE_SUPABASE_URL e SUPABASE_SERVER_KEY (ou SUPABASE_SERVICE_ROLE_KEY).' }
  return { url, key, password }
}

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

function verify(token, secret) {
  if (typeof token !== 'string' || token.length > 2000) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const expected = createHmac('sha256', secret).update(parts[0]).digest()
  let actual
  try { actual = Buffer.from(parts[1], 'base64url') } catch { return false }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    return Number(payload.exp) > Math.floor(Date.now() / 1000)
  } catch { return false }
}

function getClient(url, key) {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

function checkLoginLimit(ip) {
  const now = Date.now()
  const entry = failedLogins.get(ip)
  if (!entry || now - entry.startedAt > 15 * 60 * 1000) {
    failedLogins.set(ip, { count: 0, startedAt: now })
    return true
  }
  return entry.count < 8
}

function recordFailedLogin(ip) {
  const now = Date.now()
  let entry = failedLogins.get(ip)
  if (!entry || now - entry.startedAt > 15 * 60 * 1000) entry = { count: 0, startedAt: now }
  entry.count += 1
  failedLogins.set(ip, entry)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' })
  const config = getConfig()
  if (config.error) return send(res, 503, { error: config.error })

  const { url, key, password: configuredPassword } = config
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { action } = body
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()

  if (action === 'login') {
    if (!checkLoginLimit(ip)) return send(res, 429, { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' })
    const supplied = String(body.password || '')
    if (supplied !== configuredPassword) {
      recordFailedLogin(ip)
      return send(res, 401, { error: 'Senha incorreta. Confira a senha de acesso.' })
    }
    failedLogins.delete(ip)
    const now = Math.floor(Date.now() / 1000)
    const token = sign({ iat: now, exp: now + TOKEN_TTL_SECONDS, nonce: randomUUID() }, key)
    return send(res, 200, { token, expiresIn: TOKEN_TTL_SECONDS })
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!verify(token, key)) return send(res, 401, { error: 'Sua sessão expirou. Entre novamente com a senha do painel.' })

  const supabase = getClient(url, key)
  try {
    if (action === 'dashboardData') {
      const [products, orders, items] = await Promise.all([
        supabase.from('products').select('*').order('id'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('order_items').select('*').order('created_at', { ascending: false }).limit(5000),
      ])
      const error = products.error || orders.error || items.error
      if (error) throw error
      return send(res, 200, { products: products.data || [], orders: orders.data || [], orderItems: items.data || [] })
    }

    if (action === 'uploadImage') {
      const contentType = String(body.contentType || '')
      const base64 = String(body.base64 || '')
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) return send(res, 400, { error: 'Use uma imagem PNG, JPG ou WebP.' })
      if (!base64 || base64.length > 3_600_000) return send(res, 413, { error: 'A imagem deve ter até 2,5 MB.' })
      const bytes = Buffer.from(base64, 'base64')
      if (bytes.length > 2_500_000) return send(res, 413, { error: 'A imagem deve ter até 2,5 MB.' })
      const original = String(body.name || 'produto').toLowerCase().replace(/[^a-z0-9.-]/g, '-').slice(-100)
      const path = `${Date.now()}-${randomUUID()}-${original}`
      const { error } = await supabase.storage.from('product-images').upload(path, bytes, { upsert: false, contentType, cacheControl: '3600' })
      if (error) throw error
      const imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
      return send(res, 200, { imageUrl })
    }

    if (action === 'saveProduct') {
      const product = body.product || {}
      const name = String(product.name || '').trim()
      const price = Number(product.price)
      if (!name || name.length > 160 || !Number.isFinite(price) || price < 0) return send(res, 400, { error: 'Informe um nome e um preço válido.' })
      const payload = {
        name,
        category: String(product.category || 'Pizzas').slice(0, 80),
        description: String(product.description || '').slice(0, 2000),
        price,
        image_url: String(product.image_url || '').slice(0, 2000),
        prices: product.prices && typeof product.prices === 'object' && !Array.isArray(product.prices) ? product.prices : null,
        popular: Boolean(product.popular),
        badge: product.badge ? String(product.badge).slice(0, 100) : null,
        available: product.available !== false,
      }
      const query = body.id
        ? supabase.from('products').update(payload).eq('id', Number(body.id)).select().single()
        : supabase.from('products').insert(payload).select().single()
      const { data, error } = await query
      if (error) throw error
      return send(res, 200, { product: data })
    }

    if (action === 'deleteProduct') {
      const id = Number(body.id)
      if (!Number.isFinite(id)) return send(res, 400, { error: 'Produto inválido.' })
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      return send(res, 200, { success: true })
    }

    if (action === 'toggleAvailability') {
      const id = Number(body.id)
      if (!Number.isFinite(id)) return send(res, 400, { error: 'Produto inválido.' })
      const { data, error } = await supabase.from('products').update({ available: Boolean(body.available) }).eq('id', id).select().single()
      if (error) throw error
      return send(res, 200, { product: data })
    }

    if (action === 'updateOrderStatus') {
      const id = String(body.id || '')
      const status = String(body.status || '')
      if (!id || !ALLOWED_STATUSES.has(status)) return send(res, 400, { error: 'Pedido ou status inválido.' })
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (error) throw error
      return send(res, 200, { success: true })
    }

    return send(res, 400, { error: 'Ação desconhecida.' })
  } catch (error) {
    console.error('Forno & Sabor admin API error:', error?.message || error)
    return send(res, 500, { error: error?.message || 'Erro interno ao processar a solicitação.' })
  }
}
