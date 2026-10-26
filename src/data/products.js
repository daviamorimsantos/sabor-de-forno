// Produtos e imagens de demonstração. Troque as URLs por fotos autorizadas do cliente.
export const PRODUCTS = [
  { id: 1, name: 'Calabresa Especial', category: 'Pizzas', description: 'Molho artesanal, muçarela, calabresa fatiada, cebola roxa e orégano.', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85', prices: { 'Média': 42.90, 'Grande': 49.90, 'Família': 59.90 }, popular: true },
  { id: 2, name: 'Frango com Catupiry', category: 'Pizzas', description: 'Frango desfiado temperado, requeijão cremoso e muçarela.', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=900&q=85', prices: { 'Média': 44.90, 'Grande': 52.90, 'Família': 62.90 } },
  { id: 3, name: 'Quatro Queijos', category: 'Pizzas', description: 'Muçarela, provolone, parmesão e gorgonzola em uma combinação cremosa.', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85', prices: { 'Média': 46.90, 'Grande': 54.90, 'Família': 64.90 } },
  { id: 4, name: 'Portuguesa', category: 'Pizzas', description: 'Presunto, ovos, cebola, azeitonas, muçarela e orégano.', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85', prices: { 'Média': 44.90, 'Grande': 52.90, 'Família': 62.90 } },
  { id: 5, name: 'Pepperoni', category: 'Pizzas', description: 'Muçarela derretida, pepperoni levemente picante e molho da casa.', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=85', prices: { 'Média': 47.90, 'Grande': 56.90, 'Família': 66.90 }, popular: true },
  { id: 6, name: 'Margherita', category: 'Pizzas', description: 'Tomate fresco, muçarela, manjericão e azeite extravirgem.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85', prices: { 'Média': 40.90, 'Grande': 48.90, 'Família': 58.90 } },
  { id: 7, name: 'Combo Casal', category: 'Combos', description: 'Uma pizza grande tradicional + refrigerante de 2 litros.', image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=85', price: 59.90, badge: 'QUERIDINHO' },
  { id: 8, name: 'Combo Família', category: 'Combos', description: 'Duas pizzas grandes tradicionais + refrigerante de 2 litros.', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85', price: 99.90, badge: 'PARA COMPARTILHAR' },
  { id: 9, name: 'Coca-Cola 2L', category: 'Bebidas', description: 'Refrigerante gelado, garrafa de 2 litros.', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=85', price: 12 },
  { id: 10, name: 'Guaraná Antarctica 2L', category: 'Bebidas', description: 'Guaraná original, garrafa de 2 litros.', image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=900&q=85', price: 10 },
  { id: 11, name: 'Brownie com Nutella', category: 'Sobremesas', description: 'Brownie de chocolate com creme de avelã.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', price: 14.90 },
  { id: 12, name: 'Borda de Catupiry', category: 'Adicionais', description: 'Borda recheada cremosa para deixar sua pizza ainda melhor.', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85', price: 8 },
]

export const EXTRAS = [
  { id: 'catupiry', name: 'Catupiry', price: 5 },
  { id: 'bacon', name: 'Bacon', price: 6 },
  { id: 'queijo', name: 'Extra queijo', price: 5 },
]
