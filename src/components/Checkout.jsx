import { useState } from 'react'
import { ArrowLeft, MapPin, Store, Truck, MessageCircle, X } from 'lucide-react'
import { STORE } from '../data/store'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function Checkout({ items, onClose, onBack }) {
  const [fulfillment, setFulfillment] = useState('delivery')
  const [payment, setPayment] = useState('PIX')
  const [form, setForm] = useState({ name: '', phone: '', street: '', number: '', neighborhood: '', complement: '', reference: '', note: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const fee = fulfillment === 'pickup' || subtotal >= STORE.freeDeliveryAbove ? 0 : STORE.deliveryFee
  const update = e => setForm(old => ({ ...old, [e.target.name]: e.target.value }))
  const send = async e => {
    e.preventDefault()
    if (sending) return
    if (!items.length) return setError('Adicione pelo menos um produto ao pedido.')
    if (!form.name.trim()) return setError('Informe seu nome.')
    if (fulfillment === 'delivery' && (!form.street.trim() || !form.number.trim() || !form.neighborhood.trim())) return setError('Preencha rua, número e bairro para a entrega.')
    if (!/^\d{10,15}$/.test(STORE.whatsapp)) return setError('Configure o número de WhatsApp da pizzaria em src/data/store.js (somente números, com DDI e DDD).')
    const lines = items.map((item, i) => {
      const extras = item.extras?.length ? `\n   + ${item.extras.map(x => `${x.name} (${money(x.price)})`).join(', ')}` : ''
      const size = item.size ? ` ${item.size}` : ''
      const note = item.note ? `\n   📝 Obs.: ${item.note}` : ''
      return `${i + 1}. ${item.qty}x ${item.name}${size}${extras}${note}\n   ${money(item.unitPrice * item.qty)}`
    }).join('\n\n')
    const address = fulfillment === 'pickup' ? 'Retirada no balcão' : `${form.street}, ${form.number}${form.complement ? ` — ${form.complement}` : ''}\n${form.neighborhood}${form.reference ? `\nReferência: ${form.reference}` : ''}\nSão José do Rio Preto - SP`
    const message = `🍕 *NOVO PEDIDO — ${STORE.name.toUpperCase()}*\n\n👤 *Cliente:* ${form.name.trim()}${form.phone.trim() ? `\n📞 *Telefone:* ${form.phone.trim()}` : ''}\n\n📦 *PEDIDO*\n${lines}\n\n━━━━━━━━━━━━━━\nSubtotal: ${money(subtotal)}\nEntrega: ${fee === 0 ? 'Grátis' : money(fee)}\n💰 *TOTAL: ${money(subtotal + fee)}*\n\n📍 *${fulfillment === 'pickup' ? 'RETIRADA' : 'ENTREGA'}*\n${address}\n\n💳 *Pagamento:* ${payment}${form.note.trim() ? `\n\n📝 *Observação geral:*\n${form.note.trim()}` : ''}`
    const whatsappWindow = window.open('about:blank', '_blank')
    setSending(true)
    try {
      if (isSupabaseConfigured) {
        const { error: saveError } = await supabase.rpc('create_order', {
          p_customer_name: form.name.trim(),
          p_customer_phone: form.phone.trim(),
          p_fulfillment: fulfillment,
          p_address: address,
          p_payment_method: payment,
          p_notes: form.note.trim(),
          p_delivery_fee: fee,
          p_items: items.map(item => ({ product_id: item.productId, size: item.size || '', quantity: item.qty, extras: (item.extras || []).map(extra => ({ id: extra.id })), note: item.note || '' }))
        })
        if (saveError) throw saveError
      }
      const waUrl = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`
      if (whatsappWindow) whatsappWindow.location.href = waUrl
      else window.location.assign(waUrl)
    } catch (err) {
      if (whatsappWindow) whatsappWindow.close()
      setError(`Não foi possível registrar o pedido no sistema. Tente novamente ou entre em contato com a loja. ${err.message || ''}`)
    } finally { setSending(false) }
  }
  return <div className="modal-backdrop checkout-backdrop"><section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Finalizar pedido">
    <div className="checkout-top"><button className="back-button" onClick={onBack}><ArrowLeft size={18}/> Voltar ao carrinho</button><button className="icon-button" onClick={onClose}><X/></button></div>
    <div className="checkout-title"><span className="eyebrow">SÓ MAIS UM PASSO</span><h2>Finalizar pedido</h2><p>Confira seus dados para preparar tudo do seu jeito.</p></div>
    <form onSubmit={send}>
      <h3 className="form-section-title">Como você quer receber?</h3><div className="fulfillment-options">
        <button type="button" className={fulfillment === 'delivery' ? 'fulfillment-option selected' : 'fulfillment-option'} onClick={() => setFulfillment('delivery')}><Truck size={20}/><span><b>Entrega</b><small>{subtotal >= STORE.freeDeliveryAbove ? 'Entrega grátis' : money(STORE.deliveryFee)}</small></span></button>
        <button type="button" className={fulfillment === 'pickup' ? 'fulfillment-option selected' : 'fulfillment-option'} onClick={() => setFulfillment('pickup')}><Store size={20}/><span><b>Retirada</b><small>Buscar no local</small></span></button>
      </div>
      <h3 className="form-section-title">Seus dados</h3><div className="form-grid">
        <label className="field full"><span>Nome completo *</span><input name="name" value={form.name} onChange={update} placeholder="Como podemos te chamar?" autoComplete="name" required/></label>
        <label className="field full"><span>Telefone / WhatsApp <small>(opcional)</small></span><input name="phone" value={form.phone} onChange={update} placeholder="DDD + telefone" autoComplete="tel"/></label>
        {fulfillment === 'delivery' && <>
          <label className="field full"><span>Rua / Avenida *</span><input name="street" value={form.street} onChange={update} placeholder="Nome da rua" autoComplete="street-address" required/></label>
          <label className="field"><span>Número *</span><input name="number" value={form.number} onChange={update} placeholder="Nº" required/></label>
          <label className="field"><span>Bairro *</span><input name="neighborhood" value={form.neighborhood} onChange={update} placeholder="Seu bairro" required/></label>
          <label className="field full"><span>Complemento</span><input name="complement" value={form.complement} onChange={update} placeholder="Apto, bloco, casa..."/></label>
          <label className="field full"><span>Ponto de referência</span><input name="reference" value={form.reference} onChange={update} placeholder="Próximo a..."/></label>
        </>}
      </div>
      <h3 className="form-section-title">Forma de pagamento</h3><div className="payment-options">{['PIX', 'Dinheiro', 'Cartão na entrega'].map(p => <button type="button" key={p} onClick={() => setPayment(p)} className={payment === p ? 'payment-option selected' : 'payment-option'}>{p}</button>)}</div>
      <label className="field general-note"><span>Observação geral <small>(opcional)</small></span><textarea name="note" value={form.note} onChange={update} placeholder="Ex.: entregar na portaria..." rows="2"/></label>
      {error && <p className="form-error">{error}</p>}
      <div className="checkout-total"><span>Total estimado</span><strong>{money(subtotal + fee)}</strong></div>
      <button type="submit" className="primary-button send-order" disabled={sending}><MessageCircle size={19}/> {sending ? 'Registrando pedido…' : 'Enviar pedido pelo WhatsApp'}</button>
      <p className="checkout-disclaimer">Nenhum pagamento é feito neste site. Com o banco configurado, o pedido também fica registrado no painel da loja.</p>
    </form>
  </section></div>
}