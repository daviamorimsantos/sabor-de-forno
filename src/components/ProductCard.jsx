import { Plus } from 'lucide-react'

const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function ProductCard({ product, onChoose }) {
  const price = product.prices ? Math.min(...Object.values(product.prices)) : product.price
  return <article className="product-card">
    <button className="product-photo" onClick={() => onChoose(product)} aria-label={`Escolher ${product.name}`}>
      <img src={product.image} alt={product.name} loading="lazy" />
      {product.popular && <span className="photo-tag">MAIS PEDIDO</span>}
      {product.badge && <span className="photo-tag">{product.badge}</span>}
    </button>
    <div className="product-info">
      <span className="product-category">{product.category}</span>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-bottom"><div><small>{product.prices ? 'A partir de' : 'Por apenas'}</small><strong>{money(price)}</strong></div>
        <button className="add-button" onClick={() => onChoose(product)} aria-label={`Adicionar ${product.name}`}><Plus size={20} /></button>
      </div>
    </div>
  </article>
}