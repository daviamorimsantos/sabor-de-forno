import { useEffect, useMemo, useState } from 'react'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { EXTRAS } from '../data/products'

const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function ProductModal({ product, onClose, onAdd }) {
  const [size, setSize] = useState(product?.prices ? (Object.keys(product.prices).includes('Grande') ? 'Grande' : Object.keys(product.prices)[0]) : '')
  const [extras, setExtras] = useState([])
  const [note, setNote] = useState('')
  const [qty, setQty] = useState(1)
  const [comboNote, setComboNote] = useState('')
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])
  const base = product.prices ? product.prices[size] : product.price
  const total = useMemo(() => (base + extras.reduce((sum, id) => sum + EXTRAS.find(x => x.id === id).price, 0)) * qty, [base, extras, qty])
  if (!product) return null
  const toggle = id => setExtras(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id])
  const add = () => { onAdd({ key: `${product.id}-${Date.now()}`, productId: product.id, name: product.name, category: product.category, size, extras: extras.map(id => EXTRAS.find(x => x.id === id)), note: note.trim() || comboNote.trim(), unitPrice: base + extras.reduce((sum, id) => sum + EXTRAS.find(x => x.id === id).price, 0), qty, image: product.image }); onClose() }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="product-modal" role="dialog" aria-modal="true" aria-label={`Personalizar ${product.name}`}>
      <button className="modal-close" onClick={onClose} aria-label="Fechar"><X /></button>
      <div className="modal-image"><img src={product.image} alt={product.name} /></div>
      <div className="modal-content"><span className="eyebrow">{product.category} · FEITO COM CARINHO</span><h2>{product.name}</h2><p className="modal-description">{product.description}</p>
        {product.prices && <div className="option-section"><h4>Escolha o tamanho</h4><div className="size-options">{Object.entries(product.prices).map(([label, price]) => <button key={label} className={`size-option ${size === label ? 'selected' : ''}`} onClick={() => setSize(label)}><span>{label}</span><b>{money(price)}</b></button>)}</div></div>}
        {product.category === 'Pizzas' && <div className="option-section"><h4>Adicionais <small>(opcional)</small></h4>{EXTRAS.map(extra => <label className="extra-option" key={extra.id}><span><input type="checkbox" checked={extras.includes(extra.id)} onChange={() => toggle(extra.id)} />{extra.name}</span><b>+ {money(extra.price)}</b></label>)}</div>}
        <div className="option-section"><h4>Observações <small>(opcional)</small></h4><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: sem cebola, cortar em 8 pedaços..." rows="2" /></div>
        <div className="modal-actions"><div className="quantity-control"><button onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16}/></button><b>{qty}</b><button onClick={() => setQty(q => q + 1)}><Plus size={16}/></button></div><button className="primary-button modal-add" onClick={add}><ShoppingBag size={18}/> Adicionar · {money(total)}</button></div>
      </div>
    </section>
  </div>
}