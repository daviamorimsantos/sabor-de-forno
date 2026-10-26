import { ShoppingBag, Pizza, Settings } from 'lucide-react'
import { STORE } from '../data/store'

export default function Header({ count, onCart }) {
  return <header className="site-header">
    <a className="brand" href="#inicio" aria-label={STORE.name}>
      <span className="brand-mark"><Pizza size={22} /></span>
      <span><strong>FORNO <i>&</i> SABOR</strong><small>ARTESANAL PIZZERIA</small></span>
    </a>
    <nav className="desktop-nav">
      <a href="#inicio">Início</a><a href="#cardapio">Cardápio</a><a href="#promocoes">Promoções</a><a href="#localizacao">Localização</a>
    </nav>
    <button className="header-cart" onClick={onCart}><ShoppingBag size={18} /><span>Meu pedido</span><b>{count}</b></button>
  </header>
}