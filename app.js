const http = require('http');
const crypto = require('crypto');

const VERSION = '2.0';
const PORT = process.env.PORT || 3000;
const ENVIO = 8;            // costo de envío (S/)
const ENVIO_GRATIS = 80;    // envío gratis desde (S/)

const PRODUCTS = [
  { id: 1, name: 'Quinua roja', cat: 'Granos', unit: '500 g', price: 14.5, emoji: '🌾', desc: 'Grano entero de Puno, ideal para sopas y ensaladas.' },
  { id: 2, name: 'Kiwicha', cat: 'Granos', unit: '400 g', price: 11.9, emoji: '🌱', desc: 'Pequeño grano andino rico en hierro y calcio.' },
  { id: 3, name: 'Cañihua', cat: 'Granos', unit: '400 g', price: 12.9, emoji: '🌿', desc: 'Parienta de la quinua, de sabor tostado.' },
  { id: 4, name: 'Papa nativa surtida', cat: 'Tubérculos', unit: '1 kg', price: 16, emoji: '🥔', desc: 'Mezcla de variedades de colores de Huancavelica.' },
  { id: 5, name: 'Chuño blanco', cat: 'Tubérculos', unit: '500 g', price: 18, emoji: '🧊', desc: 'Papa deshidratada de forma tradicional en las alturas.' },
  { id: 6, name: 'Maíz morado', cat: 'Tubérculos', unit: '1 kg', price: 13.5, emoji: '🌽', desc: 'Para chicha morada y mazamorra.' },
  { id: 7, name: 'Maca en polvo', cat: 'Superfoods', unit: '250 g', price: 24, emoji: '⚡', desc: 'De Junín. Energía natural para batidos y avena.' },
  { id: 8, name: 'Lúcuma en polvo', cat: 'Superfoods', unit: '250 g', price: 19.9, emoji: '🍊', desc: 'Endulzante natural para postres y helados.' },
  { id: 9, name: 'Pasta de ají amarillo', cat: 'Ajíes y salsas', unit: '300 g', price: 12, emoji: '🌶️', desc: 'La base de la cocina peruana: ají mirasol molido.' },
  { id: 10, name: 'Rocoto fresco', cat: 'Ajíes y salsas', unit: '500 g', price: 9.5, emoji: '🫑', desc: 'Picante y carnoso, perfecto para rellenar.' },
  { id: 11, name: 'Café de Cusco', cat: 'Bebidas y dulces', unit: '250 g', price: 28, emoji: '☕', desc: 'Tostado medio, grano de altura de La Convención.' },
  { id: 12, name: 'Chocolate de cacao chuncho', cat: 'Bebidas y dulces', unit: '100 g', price: 15.5, emoji: '🍫', desc: 'Barra 70 % con cacao nativo cusqueño.' },
];

const PAGOS = {
  yape: 'Yapea el total al 999 888 777 (Andina Market) y envía la captura por WhatsApp con tu código de pedido.',
  plin: 'Plinea el total al 999 888 777 (Andina Market) y envía la captura por WhatsApp con tu código de pedido.',
  tarjeta: 'Te enviaremos un enlace seguro de pago a tu teléfono. (Conecta aquí Culqi, Izipay o Stripe.)',
  contraentrega: 'Pagas en efectivo al recibir tu pedido. Ten el monto exacto a la mano.',
};

const orders = []; // en memoria; usa una base de datos en producción

const PAGE = String.raw`<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Andina Market</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Figtree:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#F3F1F7;--ink:#231A33;--mag:#B0215F;--teal:#0F6B66;--sun:#F2A71B;--card:#fff;--line:#DDD7E8;--mut:#6B6380}
@media(prefers-color-scheme:dark){:root{--bg:#171220;--ink:#F1ECF8;--card:#241C33;--line:#3A2F4F;--mut:#A99FC0;--mag:#E0568C;--teal:#3FB5AC}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 Figtree,system-ui,sans-serif}
h1,h2,h3{font-family:'Bricolage Grotesque',Georgia,serif;margin:0}
button,input,select{font:inherit;color:inherit}
:focus-visible{outline:3px solid var(--sun);outline-offset:2px}
.band{height:10px;background:repeating-linear-gradient(90deg,var(--mag) 0 24px,var(--sun) 24px 48px,var(--teal) 48px 72px,var(--ink) 72px 96px)}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;max-width:1100px;margin:auto}
header h1{font-size:1.7rem;font-weight:800}header small{color:var(--mut)}
.btn{border:0;border-radius:10px;padding:10px 16px;font-weight:600;cursor:pointer;background:var(--mag);color:#fff}
.btn.alt{background:transparent;color:var(--ink);border:1px solid var(--line)}
.btn:disabled{opacity:.5;cursor:not-allowed}
main{max-width:1100px;margin:auto;padding:0 20px 60px}
.tools{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 20px}
.tools input{flex:1 1 200px;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:var(--card)}
.chip{border:1px solid var(--line);background:var(--card);border-radius:99px;padding:8px 14px;cursor:pointer}
.chip[aria-pressed=true]{background:var(--teal);color:#fff;border-color:var(--teal)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.tile{height:110px;display:grid;place-items:center;font-size:3rem;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--sun) 22%,var(--card)) 0 14px,var(--card) 14px 28px)}
.card div.b{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}
.card p{margin:0;color:var(--mut);font-size:.9rem;flex:1}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.price{font-weight:800;font-size:1.1rem}
aside{position:fixed;top:0;right:0;height:100%;width:min(420px,100%);background:var(--card);border-left:1px solid var(--line);transform:translateX(100%);transition:transform .25s;display:flex;flex-direction:column;z-index:5}
aside.open{transform:none}
.sec{padding:16px 20px;overflow:auto;flex:1}.foot{padding:16px 20px;border-top:1px solid var(--line)}
.item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}
.qty{display:flex;align-items:center;gap:8px}.qty button{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:transparent;cursor:pointer}
label{display:block;margin:10px 0 4px;font-weight:600;font-size:.9rem}
.f{width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg)}
.pay{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pay label{display:flex;gap:8px;align-items:center;margin:0;padding:10px;border:1px solid var(--line);border-radius:10px;font-weight:400;cursor:pointer}
.tot{display:flex;justify-content:space-between;color:var(--mut)}.tot.g{color:var(--ink);font-weight:800;font-size:1.15rem}
.err{color:var(--mag);min-height:1.2em;font-size:.9rem}
.ok{background:color-mix(in srgb,var(--teal) 15%,var(--card));border-radius:12px;padding:16px}
.badge{background:var(--sun);color:#231A33;border-radius:99px;padding:0 8px;font-weight:800;margin-left:6px}
@media(prefers-reduced-motion:reduce){aside{transition:none}}
</style></head><body>
<div class="band"></div>
<header><div><h1>Andina Market</h1><small>Sabores de los Andes · v__V__</small></div>
<button class="btn" id="open" aria-label="Abrir carrito">Carrito<span class="badge" id="count">0</span></button></header>
<main>
<div class="tools"><input id="q" type="search" placeholder="Buscar quinua, maca, ají…" aria-label="Buscar productos"><span id="cats" style="display:contents"></span></div>
<div class="grid" id="grid" aria-live="polite"></div>
</main>
<aside id="cart" aria-label="Carrito de compras">
<div class="row" style="padding:16px 20px;border-bottom:1px solid var(--line)"><h2 id="ttl">Tu carrito</h2><button class="btn alt" id="close">Cerrar</button></div>
<div class="sec" id="body"></div><div class="foot" id="foot"></div>
</aside>
<script>
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var money=function(n){return 'S/ '+n.toFixed(2)};
var products=[],cart={},cat='Todos',term='',step='cart',cfg={envio:8,gratis:80};
try{cart=JSON.parse(localStorage.getItem('andina-cart')||'{}')}catch(e){}
function save(){try{localStorage.setItem('andina-cart',JSON.stringify(cart))}catch(e){}}
function byId(id){return products.find(function(p){return p.id==id})}
function lines(){return Object.keys(cart).map(function(id){return {p:byId(id),q:cart[id]}}).filter(function(l){return l.p})}
function totals(){var s=lines().reduce(function(a,l){return a+l.p.price*l.q},0);var e=s===0||s>=cfg.gratis?0:cfg.envio;return {s:s,e:e,t:s+e}}
function add(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];save();draw()}

function drawGrid(){
  var cats=['Todos'].concat(products.map(function(p){return p.cat}).filter(function(c,i,a){return a.indexOf(c)===i}));
  $('#cats').innerHTML=cats.map(function(c){return '<button class="chip" aria-pressed="'+(c===cat)+'" data-c="'+esc(c)+'">'+esc(c)+'</button>'}).join('');
  var list=products.filter(function(p){return (cat==='Todos'||p.cat===cat)&&(p.name+' '+p.desc).toLowerCase().indexOf(term)>-1});
  $('#grid').innerHTML=list.length?list.map(function(p){return '<article class="card"><div class="tile" aria-hidden="true">'+p.emoji+'</div><div class="b"><h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p><div class="row"><span class="price">'+money(p.price)+' <small style="color:var(--mut);font-weight:400">/ '+esc(p.unit)+'</small></span></div><button class="btn" data-a="'+p.id+'">Agregar al carrito</button></div></article>'}).join(''):'<p>No encontramos productos con esa búsqueda. Prueba con otra palabra.</p>';
}
function drawCart(){
  var L=lines(),T=totals();
  $('#count').textContent=L.reduce(function(a,l){return a+l.q},0);
  if(step==='done')return;
  if(!L.length){step='cart';$('#ttl').textContent='Tu carrito';$('#body').innerHTML='<p>Tu carrito está vacío. Agrega productos para empezar.</p>';$('#foot').innerHTML='';return}
  var tot='<div class="tot"><span>Subtotal</span><span>'+money(T.s)+'</span></div><div class="tot"><span>Envío</span><span>'+(T.e?money(T.e):'Gratis')+'</span></div><div class="tot g"><span>Total</span><span>'+money(T.t)+'</span></div>';
  if(step==='cart'){
    $('#ttl').textContent='Tu carrito';
    $('#body').innerHTML=L.map(function(l){return '<div class="item"><div><strong>'+esc(l.p.name)+'</strong><br><small>'+money(l.p.price)+' · '+esc(l.p.unit)+'</small></div><div class="qty"><button data-m="'+l.p.id+'" aria-label="Quitar uno">−</button><span>'+l.q+'</span><button data-p="'+l.p.id+'" aria-label="Agregar uno">+</button></div></div>'}).join('')+(T.e?'<p style="color:var(--mut)">Te faltan '+money(cfg.gratis-T.s)+' para envío gratis.</p>':'');
    $('#foot').innerHTML=tot+'<button class="btn" style="width:100%;margin-top:12px" id="go">Continuar con el pedido</button>';
  }else{
    $('#ttl').textContent='Datos y pago';
    $('#body').innerHTML='<label for="n">Nombre completo</label><input class="f" id="n" autocomplete="name"><label for="t">Teléfono</label><input class="f" id="t" type="tel" autocomplete="tel"><label for="d">Dirección de entrega</label><input class="f" id="d" autocomplete="street-address"><label>Forma de pago</label><div class="pay">'+[['yape','Yape'],['plin','Plin'],['tarjeta','Tarjeta'],['contraentrega','Contra entrega']].map(function(x,i){return '<label><input type="radio" name="pay" value="'+x[0]+'"'+(i===0?' checked':'')+'>'+x[1]+'</label>'}).join('')+'</div><p class="err" id="err" role="alert"></p>';
    $('#foot').innerHTML=tot+'<div class="row" style="margin-top:12px"><button class="btn alt" id="back">Volver</button><button class="btn" id="send">Confirmar pedido</button></div>';
  }
}
function draw(){drawGrid();drawCart()}

function send(){
  var v=function(id){return $(id).value.trim()},sel=document.querySelector('input[name=pay]:checked');
  var body={customer:{name:v('#n'),phone:v('#t'),address:v('#d')},payment:sel&&sel.value,items:lines().map(function(l){return {id:l.p.id,qty:l.q}})};
  var b=$('#send');b.disabled=true;b.textContent='Enviando…';
  fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
  .then(function(x){
    if(!x.ok){$('#err').textContent=x.j.error||'No pudimos registrar el pedido.';b.disabled=false;b.textContent='Confirmar pedido';return}
    cart={};save();step='done';$('#ttl').textContent='¡Pedido recibido!';$('#count').textContent='0';
    $('#body').innerHTML='<div class="ok"><h3>Gracias, '+esc(body.customer.name)+'</h3><p>Código de pedido: <strong>'+esc(x.j.id)+'</strong></p><p>Total a pagar: <strong>'+money(x.j.total)+'</strong></p><p>'+esc(x.j.instructions)+'</p></div>';
    $('#foot').innerHTML='<button class="btn" style="width:100%" id="fin">Seguir comprando</button>';
  }).catch(function(){$('#err').textContent='Sin conexión. Intenta de nuevo.';b.disabled=false;b.textContent='Confirmar pedido'});
}
function openCart(o){$('#cart').classList.toggle('open',o);if(o){if(step==='done')step='cart';drawCart()}}

document.addEventListener('click',function(e){
  var t=e.target.closest('button');if(!t)return;
  if(t.dataset.a){add(t.dataset.a,1);openCart(true)}
  else if(t.dataset.c){cat=t.dataset.c;drawGrid()}
  else if(t.dataset.p)add(t.dataset.p,1);
  else if(t.dataset.m)add(t.dataset.m,-1);
  else if(t.id==='open')openCart(true);
  else if(t.id==='close')openCart(false);
  else if(t.id==='go'){step='checkout';drawCart()}
  else if(t.id==='back'){step='cart';drawCart()}
  else if(t.id==='send')send();
  else if(t.id==='fin'){step='cart';openCart(false);drawCart()}
});
$('#q').addEventListener('input',function(e){term=e.target.value.toLowerCase();drawGrid()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')openCart(false)});
fetch('/api/products').then(function(r){return r.json()}).then(function(j){products=j.products;cfg=j.config;
  Object.keys(cart).forEach(function(id){if(!byId(id))delete cart[id]});draw()})
.catch(function(){$('#grid').innerHTML='<p>No pudimos cargar los productos. Recarga la página.</p>'});
</script></body></html>`;

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 10000) { reject(new Error('Solicitud demasiado grande')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('JSON inválido')); } });
  });
}

function crearPedido(data) {
  const c = data.customer || {};
  const name = String(c.name || '').trim().slice(0, 80);
  const phone = String(c.phone || '').replace(/[^\d+]/g, '');
  const address = String(c.address || '').trim().slice(0, 160);
  if (name.length < 3) return { error: 'Escribe tu nombre completo.' };
  if (phone.replace('+', '').length < 9) return { error: 'Escribe un teléfono válido de al menos 9 dígitos.' };
  if (address.length < 6) return { error: 'Escribe tu dirección de entrega.' };
  if (!PAGOS[data.payment]) return { error: 'Elige una forma de pago.' };
  if (!Array.isArray(data.items) || !data.items.length) return { error: 'Tu carrito está vacío.' };

  let subtotal = 0;
  const items = [];
  for (const it of data.items.slice(0, 50)) {
    const p = PRODUCTS.find((x) => x.id === Number(it.id));
    const qty = Math.floor(Number(it.qty));
    if (!p || !(qty >= 1 && qty <= 99)) return { error: 'Hay un producto no válido en tu carrito.' };
    subtotal += p.price * qty; // el precio siempre se toma del servidor
    items.push({ id: p.id, name: p.name, qty, price: p.price });
  }
  const envio = subtotal >= ENVIO_GRATIS ? 0 : ENVIO;
  const order = {
    id: 'AM-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    customer: { name, phone, address }, payment: data.payment, items,
    subtotal, envio, total: Math.round((subtotal + envio) * 100) / 100,
    status: data.payment === 'contraentrega' ? 'pendiente de entrega' : 'pendiente de pago',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return { order };
}

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  try {
    if (req.method === 'GET' && url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGE.replace('__V__', VERSION));
    }
    if (req.method === 'GET' && url === '/api/products') {
      return json(res, 200, { products: PRODUCTS, config: { envio: ENVIO, gratis: ENVIO_GRATIS } });
    }
    if (req.method === 'POST' && url === '/api/orders') {
      const { order, error } = crearPedido(await readBody(req));
      if (error) return json(res, 400, { error });
      console.log('Nuevo pedido', order.id, order.total, order.payment);
      return json(res, 201, { id: order.id, total: order.total, instructions: PAGOS[order.payment] });
    }
    if (req.method === 'GET' && url === '/health') return json(res, 200, { ok: true, version: VERSION });
    json(res, 404, { error: 'No encontrado' });
  } catch (e) {
    json(res, 400, { error: e.message });
  }
}).listen(PORT, () => console.log('Andina Market v' + VERSION + ' en el puerto ' + PORT));
