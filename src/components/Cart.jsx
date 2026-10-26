import { Minus, Plus, Trash2, X, ShoppingBag, ArrowRight, Bike, Gift } from 'lucide-react'
import { STORE } from '../data/store'

const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function Cart({ items, setItems, onClose, onCheckout }) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const remaining = Math.max(0, STORE.freeDeliveryAbove - subtotal)
  const changeQty = (key, delta) => setItems(old => old.map(i => i.key === key ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  return <div className="drawer-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Seu pedido">
      <div className="drawer-header"><div><span className="eyebrow">SUA SELEÇÃO</span><h2>Meu pedido <span>({items.reduce((s, i) => s + i.qty, 0)})</span></h2></div><button className="icon-button" onClick={onClose}><X/></button></div>
      {items.length === 0 ? <div className="empty-cart"><span className="empty-icon"><ShoppingBag size={30}/></span><h3>Seu carrinho está esperando</h3><p>Que tal escolher algo delicioso no nosso cardápio?</p><button className="primary-button" onClick={onClose}>Explorar cardápio</button></div> :
      <>
        <div className="delivery-progress"><div className="delivery-progress-icon"><Gift size={18}/></div><div><strong>{remaining > 0 ? `Faltam ${money(remaining)} para entrega grátis` : 'Você ganhou entrega grátis!'}</strong><div className="progress-track"><span style={{width: `${Math.min(100, subtotal / STORE.freeDeliveryAbove * 100)}%`}}/></div></div></div>
        <div className="cart-items">{items.map(item => <article className="cart-item" key={item.key}><img src={item.image} alt=""/><div className="cart-item-main"><h3>{item.name}</h3>{item.size && <small>Tamanho {item.size}</small>}{item.extras?.length > 0 && <small>+ {item.extras.map(x => x.name).join(', ')}</small>}{item.note && <small>Obs.: {item.note}</small>}<strong>{money(item.unitPrice * item.qty)}</strong><div className="quantity-control compact"><button onClick={() => changeQty(item.key, -1)}><Minus size={13}/></button><b>{item.qty}</b><button onClick={() => changeQty(item.key, 1)}><Plus size={13}/></button></div></div><button className="remove-item" onClick={() => setItems(old => old.filter(i => i.key !== item.key))} aria-label="Remover"><Trash2 size={17}/></button></article>)}</div>
        <div className="cart-footer"><div className="summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-line"><span><Bike size={16}/> Entrega</span><strong>{subtotal >= STORE.freeDeliveryAbove ? 'Grátis' : money(STORE.deliveryFee)}</strong></div><div className="summary-line total-line"><span>Total estimado</span><strong>{money(subtotal + (subtotal >= STORE.freeDeliveryAbove ? 0 : STORE.deliveryFee))}</strong></div><button className="primary-button checkout-button" onClick={onCheckout}>Continuar pedido <ArrowRight size={18}/></button><p className="secure-note">Você confirma os detalhes antes de enviar pelo WhatsApp.</p></div>
      </>}
    </aside>
  </div>
}