import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, Clock3, MapPin, Star, Leaf, Flame, Search, X, ShoppingBag, Instagram, MessageCircle, ChevronRight } from 'lucide-react'
import Header from './components/Header'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import { PRODUCTS } from './data/products'
import { CATEGORIES, STORE } from './data/store'
import { isSupabaseConfigured, mapProduct, supabase } from './lib/supabase'

const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const [products, setProducts] = useState(PRODUCTS)
  const [category, setCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [items, setItems] = useState([])
  const count = items.reduce((s, i) => s + i.qty, 0)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    supabase.from('products').select('*').eq('available', true).order('id').then(({ data, error }) => {
      if (active && !error && data) setProducts(data.map(mapProduct))
    })
    return () => { active = false }
  }, [])
  const promoCouple = products.find(p => p.name === 'Combo Casal') || PRODUCTS[6]
  const promoFamily = products.find(p => p.name === 'Combo Família') || PRODUCTS[7]
  const promoExtra = products.find(p => p.name === 'Borda de Catupiry') || PRODUCTS[11]
  const promoCouplePrice = promoCouple.prices ? Math.min(...Object.values(promoCouple.prices).map(Number)) : Number(promoCouple.price || 0)
  const promoFamilyPrice = promoFamily.prices ? Math.min(...Object.values(promoFamily.prices).map(Number)) : Number(promoFamily.price || 0)
  const promoExtraPrice = Number(promoExtra.price || 0)
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const filtered = useMemo(() => products.filter(p => (category === 'Todos' || p.category === category) && `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(search.toLowerCase().trim())), [products, category, search])
  const addToCart = item => setItems(old => [...old, item])
  const openCheckout = () => { setCartOpen(false); setCheckoutOpen(true) }
  const closeCheckout = () => { setCheckoutOpen(false) }
  const closeProduct = () => setSelected(null)

  return <div className="app-shell">
    <Header count={count} onCart={() => setCartOpen(true)}/>
    <main>
      <section className="hero" id="inicio">
        <div className="hero-image" />
        <div className="hero-overlay"/>
        <div className="hero-content">
          <span className="hero-kicker"><span className="kicker-line"/> O SABOR DE MOMENTOS ESPECIAIS</span>
          <h1>Sua noite merece<br/>uma pizza <em>dessas.</em></h1>
          <p>Massa artesanal, ingredientes selecionados e aquele sabor que transforma qualquer encontro em uma ocasião especial.</p>
          <div className="hero-actions"><a href="#cardapio" className="primary-button">Explorar cardápio <ArrowRight size={18}/></a><a href="#localizacao" className="text-link">Onde estamos <ArrowDownRight size={17}/></a></div>
          <div className="hero-rating"><div className="rating-stars"><Star/><Star/><Star/><Star/><Star/></div><strong>{STORE.rating}</strong><span>· {STORE.reviewCount} avaliações</span><i/></div>
        </div>
        <div className="hero-side-note"><span>FEITO À MÃO</span><b>Desde a<br/>primeira fatia.</b></div>
        <div className="hero-bottom"><span><span className="status-dot"/> DEMONSTRAÇÃO DE CARDÁPIO</span><span>ARTESANAL, SEM PRESSA.</span></div>
      </section>

      <section className="trust-strip">
        <div className="trust-item"><span className="trust-icon"><Clock3/></span><div><strong>{STORE.deliveryTime}</strong><small>Tempo estimado de entrega</small></div></div>
        <div className="trust-item"><span className="trust-icon"><Leaf/></span><div><strong>Ingredientes selecionados</strong><small>Preparados com cuidado, diariamente</small></div></div>
        <div className="trust-item"><span className="trust-icon"><Flame/></span><div><strong>Forno sempre aceso</strong><small>Massa e sabor feitos para compartilhar</small></div></div>
      </section>

      <section className="promotions section-wrap" id="promocoes">
        <div className="section-heading"><div><span className="eyebrow">BOAS ESCOLHAS, MELHOR AINDA JUNTAS</span><h2>Promoções que dão <em>fome.</em></h2></div><a className="subtle-link" href="#cardapio">Ver cardápio completo <ArrowRight size={16}/></a></div>
        <div className="promo-grid">
          <article className="promo-card promo-main"><img src={promoCouple.image} alt="Combo de pizza"/><div className="promo-shade"/><span className="promo-label">O FAVORITO DA CASA</span><div className="promo-copy"><span>PARA UMA NOITE A DOIS</span><h3>Combo Casal</h3><p>Pizza grande + Coca-Cola 2L</p><div><strong>{money(promoCouplePrice)}</strong><button onClick={() => setSelected(promoCouple)} aria-label="Escolher Combo Casal"><ArrowRight/></button></div></div></article>
          <article className="promo-card promo-family"><img src={promoFamily.image} alt="Combo família"/><div className="promo-shade"/><span className="promo-label">MESA CHEIA, CORAÇÃO TAMBÉM</span><div className="promo-copy"><span>FEITA PARA COMPARTILHAR</span><h3>Combo Família</h3><p>2 pizzas grandes + refrigerante</p><div><strong>{money(promoFamilyPrice)}</strong><button onClick={() => setSelected(promoFamily)} aria-label="Escolher Combo Família"><ArrowRight/></button></div></div></article>
          <article className="promo-mini"><div className="mini-icon"><Flame/></div><div><span>UM TOQUE A MAIS</span><h3>Borda recheada</h3><p>Catupiry cremoso em cada pedaço.</p><strong>+ {money(promoExtraPrice)}</strong></div><button onClick={() => setSelected(promoExtra)} aria-label="Escolher borda recheada"><ArrowRight/></button></article>
        </div>
      </section>

      <section className="menu-section section-wrap" id="cardapio">
        <div className="section-heading menu-heading"><div><span className="eyebrow">PREPARADO NA HORA, PENSADO EM VOCÊ</span><h2>Escolha seus <em>favoritos.</em></h2><p>Da clássica de sempre àquela que você ainda vai descobrir.</p></div><div className="menu-count">{filtered.length.toString().padStart(2,'0')} <span>opções</span></div></div>
        <div className="menu-toolbar"><div className="category-list">{CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} className={category === c ? 'category-pill active' : 'category-pill'}>{c}</button>)}</div><label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar no cardápio..."/>{search && <button onClick={() => setSearch('')} aria-label="Limpar busca"><X size={15}/></button>}</label></div>
        {filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} onChoose={setSelected}/>)}</div> : <div className="no-results"><Search size={28}/><h3>Nenhum resultado por aqui</h3><p>Tente buscar por outro nome ou escolha outra categoria.</p><button className="outline-button" onClick={() => {setSearch('');setCategory('Todos')}}>Limpar filtros</button></div>}
      </section>

      <section className="closing-banner"><div className="closing-image"/><div className="closing-copy"><span className="eyebrow">A GENTE CUIDA DO SABOR</span><h2>Reúna quem você ama.<br/><em>A pizza fica por nossa conta.</em></h2><a className="primary-button" href="#cardapio">Escolher minha pizza <ArrowRight size={18}/></a></div><span className="closing-stamp">MASSA<br/>ARTESANAL<br/><b>♥</b></span></section>

      <section className="location-section section-wrap" id="localizacao"><div className="location-copy"><span className="eyebrow">SERÁ UM PRAZER RECEBER VOCÊ</span><h2>Venha nos <em>visitar.</em></h2><p>O cheirinho de pizza saindo do forno fica ainda melhor quando você chega.</p><div className="location-detail"><span className="detail-icon"><MapPin/></span><div><strong>Nosso endereço</strong><p>{STORE.address}</p></div></div><div className="location-detail"><span className="detail-icon"><Clock3/></span><div><strong>Horário de funcionamento</strong><p>{STORE.hours}</p></div></div><a className="outline-button" href={STORE.mapsUrl} target="_blank" rel="noreferrer">Abrir no Google Maps <ArrowRight size={16}/></a></div><div className="location-visual"><div className="location-photo"/><div className="location-card"><span className="location-card-mark">F&S</span><div><strong>Forno & Sabor</strong><small>São José do Rio Preto · SP</small></div><ChevronRight size={19}/></div></div></section>
    </main>

    <footer className="site-footer"><div className="footer-top"><a className="brand footer-brand" href="#inicio"><span className="brand-mark"><Flame size={22}/></span><span><strong>FORNO <i>&</i> SABOR</strong><small>ARTESANAL PIZZERIA</small></span></a><p>Pizza artesanal, ingredientes selecionados<br/>e bons momentos à mesa.</p><div className="footer-social"><a href={STORE.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram/></a><a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle/></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Forno & Sabor. Todos os direitos reservados.</span><span>Uma boa noite começa com uma boa pizza. · <a href="/admin">Área do lojista</a></span></div><div className="demo-notice">Projeto demonstrativo · Produtos, preços, avaliações, endereço e contato são fictícios.</div></footer>

    {count > 0 && !cartOpen && !checkoutOpen && <button className="floating-cart" onClick={() => setCartOpen(true)}><span className="floating-cart-icon"><ShoppingBag size={20}/><b>{count}</b></span><span>Ver meu pedido</span><strong>{money(subtotal)}</strong></button>}
    {selected && <ProductModal key={selected.id} product={selected} onClose={closeProduct} onAdd={addToCart}/>}
    {cartOpen && <Cart items={items} setItems={setItems} onClose={() => setCartOpen(false)} onCheckout={openCheckout}/>}
    {checkoutOpen && <Checkout items={items} onClose={closeCheckout} onBack={() => {setCheckoutOpen(false);setCartOpen(true)}}/>}
  </div>
}