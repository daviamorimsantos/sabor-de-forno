import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownToLine, BarChart3, Check, ChefHat, ChevronDown, CircleDollarSign, Clock3, Eye, ImagePlus, LogOut, Package, Pencil, Plus, RefreshCw, Save, Search, ShoppingBag, Trash2, TrendingUp, X } from 'lucide-react'
import { isSupabaseConfigured, mapProduct } from '../lib/supabase'
import { adminRequest, fileToBase64, getAdminToken, setAdminToken } from '../lib/adminApi'
import './admin.css'

const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const statuses = { pending: 'Pendente', confirmed: 'Confirmado', preparing: 'Em preparo', delivered: 'Entregue', cancelled: 'Cancelado' }
const emptyProduct = { name: '', category: 'Pizzas', description: '', price: '0', image_url: '', pricesText: '', popular: false, badge: '', available: true }
const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AdminApp() {
  const [session, setSession] = useState(() => getAdminToken())
  const [password, setPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('7')

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true); setError('')
    try {
      const data = await adminRequest('dashboardData', {}, session)
      setProducts((data.products || []).map(mapProduct))
      setOrders(data.orders || [])
      setOrderItems(data.orderItems || [])
    } catch (err) {
      if (/sessão expirou|não autorizado|unauthorized/i.test(err.message || '')) {
        setAdminToken('')
        setSession(null)
      }
      setError((err.message || 'Não foi possível carregar os dados.') + ' — confira a configuração do banco e as variáveis privadas da Vercel.')
    } finally { setLoading(false) }
  }, [session])
  useEffect(() => { loadData() }, [loadData])

  const signIn = async e => {
    e.preventDefault(); setLoginError(''); setLoginBusy(true)
    try {
      const result = await adminRequest('login', { password }, '')
      setAdminToken(result.token)
      setSession(result.token)
      setPassword('')
    } catch (err) {
      setLoginError(err.message || 'Não foi possível entrar. Confira a senha e a configuração da Vercel.')
    } finally { setLoginBusy(false) }
  }

  const openNewProduct = () => { setEditingId(null); setProductForm(emptyProduct); setImageFile(null); setProductModal(true) }
  const openEditProduct = p => { setEditingId(p.id); setProductForm({ name: p.name || '', category: p.category || 'Pizzas', description: p.description || '', price: String(p.price ?? 0), image_url: p.image_url || p.image || '', pricesText: p.prices ? JSON.stringify(p.prices, null, 2) : '', popular: Boolean(p.popular), badge: p.badge || '', available: p.available !== false }); setImageFile(null); setProductModal(true) }

  const saveProduct = async e => {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      let imageUrl = productForm.image_url.trim()
      if (imageFile) {
        const base64 = await fileToBase64(imageFile)
        const uploaded = await adminRequest('uploadImage', { name: imageFile.name, contentType: imageFile.type, base64 }, session)
        imageUrl = uploaded.imageUrl
      }
      let prices = null
      if (productForm.pricesText.trim()) { prices = JSON.parse(productForm.pricesText); if (!prices || typeof prices !== 'object' || Array.isArray(prices)) throw new Error('Preços por tamanho devem ser um objeto JSON, por exemplo: {"Média": 42.90, "Grande": 49.90}.') }
      const payload = { name: productForm.name.trim(), category: productForm.category, description: productForm.description.trim(), price: Number(productForm.price), image_url: imageUrl, prices, popular: productForm.popular, badge: productForm.badge.trim() || null, available: productForm.available }
      if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0) throw new Error('Informe um nome e um preço válido.')
      await adminRequest('saveProduct', { id: editingId, product: payload }, session)
      setProductModal(false); setNotice('Produto salvo com sucesso.'); await loadData()
    } catch (err) { setError(err.message || 'Não foi possível salvar o produto.') }
    setSaving(false)
  }

  const deleteProduct = async p => {
    if (!window.confirm(`Excluir “${p.name}” do catálogo? Essa ação não pode ser desfeita.`)) return
    try { await adminRequest('deleteProduct', { id: p.id }, session); setNotice('Produto excluído.'); await loadData() }
    catch (err) { setError(err.message || 'Não foi possível excluir o produto.') }
  }
  const updateStatus = async (order, status) => {
    try { await adminRequest('updateOrderStatus', { id: order.id, status }, session); setNotice('Status do pedido atualizado.'); await loadData() }
    catch (err) { setError(err.message || 'Não foi possível atualizar o pedido.') }
  }

  const daysCutoff = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - Number(period) + 1); d.setHours(0,0,0,0); return d }, [period])
  const filteredOrders = useMemo(() => orders.filter(o => new Date(o.created_at) >= daysCutoff), [orders, daysCutoff])
  const completedOrders = filteredOrders.filter(o => o.status !== 'cancelled')
  const revenue = completedOrders.reduce((s,o) => s + Number(o.total || 0), 0)
  const average = completedOrders.length ? revenue / completedOrders.length : 0
  const dayBars = useMemo(() => days.map((label, day) => ({ label, value: completedOrders.filter(o => new Date(o.created_at).getDay() === day).reduce((s,o) => s + Number(o.total || 0), 0) })), [completedOrders])
  const hourBars = useMemo(() => Array.from({ length: 24 }, (_, hour) => ({ label: `${String(hour).padStart(2,'0')}h`, value: completedOrders.filter(o => new Date(o.created_at).getHours() === hour).length })), [completedOrders])
  const topProducts = useMemo(() => {
    const orderById = new Map(filteredOrders.filter(o => o.status !== 'cancelled').map(o => [o.id, o]))
    const totals = new Map()
    orderItems.filter(i => orderById.has(i.order_id)).forEach(i => { const k = i.product_name || 'Produto'; totals.set(k, (totals.get(k) || 0) + Number(i.quantity || 0)) })
    return [...totals.entries()].map(([name, qty]) => ({ name, qty })).sort((a,b) => b.qty-a.qty).slice(0,5)
  }, [orderItems, filteredOrders])
  const maxDay = Math.max(1, ...dayBars.map(x => x.value))
  const maxHour = Math.max(1, ...hourBars.map(x => x.value))
  const visibleProducts = products.filter(p => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query.toLowerCase()))

  if (!isSupabaseConfigured) return <div className="admin-root"><div className="admin-login-card"><div className="admin-brand-mark"><ChefHat/></div><p className="admin-eyebrow">FORNO & SABOR · ADMINISTRAÇÃO</p><h1>Configure seu banco</h1><p>Adicione a URL e a chave publishable do Supabase nas variáveis de ambiente da Vercel e no arquivo <code>.env.local</code> para desenvolver localmente.</p><p>Consulte o arquivo <code>README-ADMIN.md</code> incluído neste projeto.</p><a className="admin-primary" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Abrir Supabase</a></div></div>

  if (!session) return <div className="admin-root"><form className="admin-login-card" onSubmit={signIn}><a className="admin-back-link" href="/">← Voltar à loja</a><div className="admin-brand-mark"><ChefHat/></div><p className="admin-eyebrow">ÁREA RESTRITA</p><h1>Bem-vindo de volta.</h1><p className="admin-subtitle">Digite a senha de acesso para gerenciar produtos e acompanhar os pedidos.</p><label>Senha de acesso<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required inputMode="numeric" placeholder="Digite sua senha"/></label>{loginError && <p className="admin-error">{loginError}</p>}<button className="admin-primary" disabled={loginBusy}>{loginBusy ? 'Entrando…' : 'Entrar no painel'}</button><small className="admin-login-help">Área restrita do lojista.</small></form></div>

  return <div className="admin-root"><aside className="admin-sidebar"><a href="/" className="admin-logo"><span className="admin-brand-mark"><ChefHat/></span><span><b>FORNO & SABOR</b><small>PAINEL DA LOJA</small></span></a><div className="admin-nav-label">GERENCIAMENTO</div><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}><BarChart3/> Visão geral</button><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}><ShoppingBag/> Pedidos <span className="admin-nav-count">{orders.filter(o=>o.status==='pending').length}</span></button><button className={tab==='products'?'active':''} onClick={()=>setTab('products')}><Package/> Produtos</button><div className="admin-sidebar-bottom"><span className="admin-online-dot"/> Banco conectado<button onClick={()=>{setAdminToken('');setSession(null);setProducts([]);setOrders([]);setOrderItems([])}}><LogOut/> Sair</button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><p className="admin-eyebrow">PAINEL ADMINISTRATIVO</p><h1>{tab==='overview'?'Visão geral':tab==='orders'?'Pedidos recebidos':'Catálogo de produtos'}</h1></div><div className="admin-top-actions"><button className="admin-icon-button" onClick={loadData} title="Atualizar"><RefreshCw size={17}/></button><a className="admin-view-store" href="/" target="_blank" rel="noreferrer"><Eye size={16}/> Ver loja</a></div></header>
      {error && <div className="admin-alert error"><span>{error}</span><button onClick={()=>setError('')}><X size={16}/></button></div>}{notice && <div className="admin-alert success"><Check size={17}/>{notice}<button onClick={()=>setNotice('')}><X size={16}/></button></div>}
      {loading && <div className="admin-loading"><RefreshCw className="spin" size={18}/> Atualizando dados…</div>}
      {tab==='overview' && <>
        <div className="admin-toolbar"><div><h2>Desempenho da loja</h2><p>Indicadores calculados a partir dos pedidos registrados no sistema.</p></div><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></div>
        <div className="admin-metrics"><article><span className="metric-icon wine"><CircleDollarSign/></span><small>Faturamento* </small><strong>{money(revenue)}</strong><em>Pedidos não cancelados</em></article><article><span className="metric-icon green"><ShoppingBag/></span><small>Pedidos</small><strong>{completedOrders.length}</strong><em>No período selecionado</em></article><article><span className="metric-icon gold"><TrendingUp/></span><small>Ticket médio</small><strong>{money(average)}</strong><em>Faturamento ÷ pedidos</em></article><article><span className="metric-icon blue"><Clock3/></span><small>Aguardando</small><strong>{filteredOrders.filter(o=>o.status==='pending').length}</strong><em>Pedidos pendentes</em></article></div>
        <div className="admin-charts-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><h3>Faturamento por dia da semana</h3><p>Distribuição dos pedidos no período</p></div><BarChart3/></div><div className="bar-chart">{dayBars.map(d=><div className="bar-column" key={d.label}><span>{d.value?money(d.value):'—'}</span><div className="bar-track"><i style={{height:`${Math.max(d.value?5:0,d.value/maxDay*100)}%`}}/></div><small>{d.label}</small></div>)}</div></section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h3>Horários de maior movimento</h3><p>Quantidade de pedidos por hora</p></div><Clock3/></div><div className="hour-chart">{hourBars.map(h=><div key={h.label} title={`${h.label}: ${h.value} pedidos`}><i style={{height:`${Math.max(h.value?5:0,h.value/maxHour*100)}%`}}/><small>{Number(h.label.slice(0,2))%3===0?h.label:''}</small></div>)}</div><div className="chart-legend"><span/> Cada barra representa um horário do dia</div></section></div>
        <div className="admin-bottom-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><h3>Produtos mais vendidos</h3><p>Unidades em pedidos não cancelados</p></div><Package/></div>{topProducts.length?topProducts.map((p,i)=><div className="top-product" key={p.name}><b>{i+1}</b><span>{p.name}</span><strong>{p.qty} un.</strong></div>):<div className="admin-empty">Os produtos mais vendidos aparecerão após registrar pedidos reais.</div>}</section><section className="admin-panel"><div className="admin-panel-heading"><div><h3>Pedidos recentes</h3><p>Últimas movimentações</p></div><button className="admin-text-button" onClick={()=>setTab('orders')}>Ver todos →</button></div>{orders.slice(0,5).map(o=><div className="recent-order" key={o.id}><div><b>{o.customer_name}</b><small>{new Date(o.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</small></div><strong>{money(o.total)}</strong><span className={`status-pill ${o.status}`}>{statuses[o.status]||o.status}</span></div>)}{!orders.length&&<div className="admin-empty">Nenhum pedido registrado ainda.</div>}</section></div>
        <p className="admin-footnote">* O faturamento é uma estimativa de pedidos não cancelados registrados no site, não um relatório contábil. Os gráficos ficam mais úteis conforme entram pedidos reais.</p>
      </>}
      {tab==='products' && <><div className="admin-toolbar"><div><h2>Seu catálogo</h2><p>Alterações salvas aqui aparecem na loja pública.</p></div><button className="admin-primary compact" onClick={openNewProduct}><Plus size={17}/> Novo produto</button></div><div className="admin-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar produto ou categoria…"/></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Preço inicial</th><th>Disponibilidade</th><th>Ações</th></tr></thead><tbody>{visibleProducts.map(p=><tr key={p.id}><td><div className="admin-product-cell"><img src={p.image_url||p.image} alt=""/><span><b>{p.name}</b><small>{p.description}</small></span></div></td><td>{p.category}</td><td><b>{money(p.prices?Math.min(...Object.values(p.prices).map(Number)):p.price)}</b></td><td><span className={`availability ${p.available?'on':'off'}`}>{p.available?'Disponível':'Oculto'}</span></td><td><div className="admin-row-actions"><button title="Editar" onClick={()=>openEditProduct(p)}><Pencil size={16}/></button><button title={p.available?'Ocultar':'Reativar'} onClick={async()=>{try{await adminRequest('toggleAvailability',{id:p.id,available:!p.available},session);setNotice(p.available?'Produto ocultado da loja.':'Produto reativado.');loadData()}catch(err){setError(err.message||'Não foi possível alterar a disponibilidade.')}}}><Eye size={16}/></button><button title="Excluir" onClick={()=>deleteProduct(p)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!visibleProducts.length&&<div className="admin-empty">Nenhum produto encontrado.</div>}</div></>}
      {tab==='orders' && <><div className="admin-toolbar"><div><h2>Pedidos</h2><p>Consulte os pedidos e atualize o andamento.</p></div><button className="admin-secondary" onClick={()=>{const csv=[['Pedido','Cliente','Telefone','Data','Status','Entrega','Pagamento','Total'],...orders.map(o=>[o.id,o.customer_name,o.customer_phone,new Date(o.created_at).toLocaleString('pt-BR'),statuses[o.status]||o.status,o.fulfillment,o.payment_method,o.total])].map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));a.download='pedidos-forno-sabor.csv';a.click();URL.revokeObjectURL(a.href)}}><ArrowDownToLine size={16}/> Exportar CSV</button></div><div className="admin-orders-list">{orders.map(o=><article className="admin-order-card" key={o.id}><div className="order-card-head"><div><span className="order-id">PEDIDO #{o.id.slice(0,8).toUpperCase()}</span><h3>{o.customer_name}</h3><p>{new Date(o.created_at).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'})}</p></div><strong>{money(o.total)}</strong></div><div className="order-card-details"><span><b>Recebimento:</b> {o.fulfillment==='pickup'?'Retirada':'Entrega'}</span><span><b>Pagamento:</b> {o.payment_method}</span>{o.customer_phone&&<span><b>Telefone:</b> {o.customer_phone}</span>}</div>{o.address&&<p className="order-address">{o.address}</p>}{o.notes&&<p className="order-address">Obs.: {o.notes}</p>}<div className="order-items-list">{orderItems.filter(item=>item.order_id===o.id).map(item=><div key={item.id}><span>{item.quantity}× {item.product_name}{item.size?` · ${item.size}`:''}</span><strong>{money(Number(item.unit_price)*Number(item.quantity))}</strong></div>)}</div><div className="order-status-row"><span className={`status-pill ${o.status}`}>{statuses[o.status]||o.status}</span><label>Atualizar status <select value={o.status} onChange={e=>updateStatus(o,e.target.value)}><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="preparing">Em preparo</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option></select></label></div></article>)}{!orders.length&&<div className="admin-empty big"><ShoppingBag/><h3>Nenhum pedido por enquanto</h3><p>Quando um cliente concluir um pedido pela loja, ele aparecerá aqui.</p></div>}</div></>}
    </main>
    {productModal&&<div className="admin-modal-backdrop"><form className="admin-product-modal" onSubmit={saveProduct}><header><div><p className="admin-eyebrow">CATÁLOGO</p><h2>{editingId?'Editar produto':'Adicionar produto'}</h2></div><button type="button" className="admin-icon-button" onClick={()=>setProductModal(false)}><X/></button></header><label>Nome do produto<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="Ex.: Pizza de calabresa"/></label><div className="admin-form-row"><label>Categoria<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{['Pizzas','Combos','Bebidas','Sobremesas','Adicionais'].map(c=><option key={c}>{c}</option>)}</select></label><label>Preço base (R$)<input type="number" min="0" step="0.01" required value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label></div><label>Descrição<textarea rows="3" value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} placeholder="Descreva o produto"/></label><label>Foto do produto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setImageFile(e.target.files?.[0]||null)}/><small>Selecione uma imagem do computador para enviar ao armazenamento seguro do Supabase.</small></label><label>Ou cole o endereço da imagem<input type="url" value={productForm.image_url} onChange={e=>setProductForm({...productForm,image_url:e.target.value})} placeholder="https://..."/></label><label>Preços por tamanho (opcional)<textarea rows="3" value={productForm.pricesText} onChange={e=>setProductForm({...productForm,pricesText:e.target.value})} placeholder={'{"Média": 42.90, "Grande": 49.90, "Família": 59.90}'}/><small>Para pizzas, defina os preços de cada tamanho aqui. O campo “Preço base” é usado para produtos sem tamanhos.</small></label><label>Selo promocional (opcional)<input value={productForm.badge} onChange={e=>setProductForm({...productForm,badge:e.target.value})} placeholder="Ex.: QUERIDINHO"/></label><div className="admin-check-row"><label><input type="checkbox" checked={productForm.popular} onChange={e=>setProductForm({...productForm,popular:e.target.checked})}/> Mais pedido</label><label><input type="checkbox" checked={productForm.available} onChange={e=>setProductForm({...productForm,available:e.target.checked})}/> Disponível na loja</label></div>{error&&<p className="admin-error">{error}</p>}<footer><button type="button" className="admin-secondary" onClick={()=>setProductModal(false)}>Cancelar</button><button className="admin-primary" disabled={saving}><Save size={16}/>{saving?'Salvando…':'Salvar produto'}</button></footer></form></div>}
  </div>
}
