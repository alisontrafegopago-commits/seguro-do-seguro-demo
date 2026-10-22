// Portal do cliente em modo demonstração. Usa brl, mil e mensalidade de app.js.
const portal = document.getElementById('portal');
const p$ = (id) => document.getElementById(id);
const CARENCIA_DIAS = 90;
// Clube de indicação aprovado por Alison em 2026-10-21 (conta amigos ativos)
const CLUBE = [
  { nome: 'Amigo', min: 1, desc: 0, faixa: '1 a 2', beneficio: '1 mês grátis por amigo' },
  { nome: 'Embaixador', min: 3, desc: 0.10, faixa: '3 a 5', beneficio: '10% de desconto todo mês' },
  { nome: 'Padrinho', min: 6, desc: 0.25, faixa: '6 a 49', beneficio: '25% de desconto todo mês' },
  { nome: 'Sócio do Clube', min: 50, desc: 1, faixa: '50 ou mais', beneficio: 'Mensalidade grátis' },
];
const nivelClube = (amigos) => [...CLUBE].reverse().find((n) => amigos >= n.min) || null;
let cliente = null;
let indicacoes = 0;
let etapaAcionamento = 0;

const dataBR = (d) => d.toLocaleDateString('pt-BR');
const somarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Cliente de exemplo para quem abre o portal sem passar pela contratação
function clienteExemplo() {
  const f = 6000;
  return {
    nome: 'Cliente Exemplo', cpf: '111.444.777-35', celular: '(85) 99999-0000', email: 'cliente@exemplo.com',
    placa: 'ABC1D23', modelo: 'Hyundai HB20 1.0', ano: '2023', seguradora: 'Porto Seguro',
    franquia: f, mensal: mensalidade(f), primeira: mensalidade(f), pagamento: 'Pix',
    codigo: 'SDS-EXEMPLO1', contratadoEm: somarDias(new Date(), -43),
  };
}

function codigoIndicacao(c) {
  const nome = c.nome.split(/\s+/)[0].normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8) || 'CLIENTE';
  return `SDS-${nome}-${c.codigo.replace(/\D/g, '').slice(-4).padStart(4, '7')}`;
}

function abrirPortal(dados) {
  cliente = dados || clienteExemplo();
  indicacoes = 0;
  etapaAcionamento = 0;
  p$('pularCarencia').checked = false;
  p$('acionarForm').reset();
  p$('acionarAcomp').hidden = true;
  preencher();
  portal.hidden = false;
  trocarAba('inicio');
  document.body.classList.add('travado');
  window.scrollTo(0, 0);
}

function fecharPortal() {
  portal.hidden = true;
  document.body.classList.remove('travado');
}

function diasPassados() {
  if (p$('pularCarencia').checked) return CARENCIA_DIAS + 12;
  return Math.max(0, Math.floor((Date.now() - new Date(cliente.contratadoEm)) / 86400000));
}

function preencher() {
  const c = cliente;
  const passados = diasPassados();
  const protegido = passados >= CARENCIA_DIAS;
  const inicio = somarDias(c.contratadoEm, CARENCIA_DIAS);
  const proximo = somarDias(c.contratadoEm, 30 * (Math.floor(passados / 30) + 1));

  p$('pPrimeiroNome').textContent = c.nome.split(/\s+/)[0];
  p$('pStatus').classList.toggle('ok', protegido);
  p$('pStatusRot').textContent = protegido ? 'Situação' : 'Em carência';
  p$('pStatusTxt').textContent = protegido ? 'Sua franquia está protegida' : `Faltam ${CARENCIA_DIAS - passados} dias para a proteção começar`;
  p$('pBarra').style.width = `${Math.min(100, (passados / CARENCIA_DIAS) * 100)}%`;
  p$('pStatusNota').textContent = protegido
    ? 'Bateu o carro? Vá em "Acionar franquia".'
    : `Protegido a partir de ${dataBR(inicio)}.`;

  const nivel = nivelClube(indicacoes);
  const mensalClube = Math.round(c.mensal * (1 - (nivel ? nivel.desc : 0)) * 100) / 100;
  p$('pFranquia').textContent = brl(c.franquia);
  p$('pMensal').textContent = brl(mensalClube);
  p$('pVence').textContent = dataBR(proximo);

  // Carteirinha
  p$('pCarteirinha').innerHTML = document.getElementById('carteirinha').innerHTML;
  const cart = p$('pCarteirinha');
  cart.querySelector('#cNome')?.removeAttribute('id');
  const valores = cart.querySelectorAll('.cart-dados b');
  [c.placa, brl(c.franquia), brl(c.mensal), dataBR(inicio)].forEach((v, i) => { if (valores[i]) valores[i].textContent = v; });
  cart.querySelector('.cart-nome').textContent = c.nome;
  cart.querySelector('.cart-codigo b').textContent = c.codigo;
  cart.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

  // Acionar
  p$('acionarData').textContent = dataBR(inicio);
  p$('acionarBloqueado').hidden = protegido;
  p$('acionarForm').hidden = !protegido || etapaAcionamento > 0;
  p$('acionarAcomp').hidden = etapaAcionamento === 0;

  // Pagamentos
  const desconto = Math.min(indicacoes, 12);
  p$('pgValor').textContent = mensalClube === 0 ? 'R$ 0,00 (Sócio do Clube)'
    : desconto > 0 ? 'R$ 0,00 (mês grátis por indicação)' : brl(mensalClube);
  p$('pgVence').textContent = `vence em ${dataBR(proximo)}`;
  const lista = p$('pgLista');
  lista.replaceChildren();
  const pagas = Math.floor(passados / 30) + 1;
  for (let i = 0; i < pagas; i++) {
    const tr = document.createElement('tr');
    const valor = i === 0 ? c.primeira : c.mensal;
    [dataBR(somarDias(c.contratadoEm, 30 * i)), brl(valor), 'Paga'].forEach((t, j) => {
      const td = document.createElement('td'); td.textContent = t;
      if (j === 2) td.className = 'pago';
      tr.append(td);
    });
    lista.append(tr);
  }

  // Indique
  const codigo = codigoIndicacao(c);
  p$('meuCodigo').textContent = codigo;
  const texto = `Conheci a Seguro do Seguro: eles pagam a franquia do seguro do carro quando você bate. Use meu código ${codigo} e ganhe 50% de desconto na primeira mensalidade.`;
  p$('indicarWhats').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  p$('indAmigos').textContent = indicacoes;
  p$('indMeses').textContent = desconto;
  p$('indEconomia').textContent = mensalClube === 0 ? 'Grátis' : brl(mensalClube);
  p$('pIndicCont').textContent = `${indicacoes} ${indicacoes === 1 ? 'amigo' : 'amigos'}`;

  // Clube: nível, barra até o próximo nível e tabela
  const prox = CLUBE.find((n) => n.min > indicacoes);
  const base = nivel ? nivel.min : 0;
  p$('clubeCaixa').dataset.nivel = nivel ? nivel.nome.split(' ')[0].toLowerCase() : 'nenhum';
  p$('clubeNivel').textContent = nivel ? `${nivel.nome} · ${nivel.beneficio}` : 'Indique 1 amigo para entrar no clube';
  p$('clubeBarra').style.width = prox ? `${Math.round(((indicacoes - base) / (prox.min - base)) * 100)}%` : '100%';
  p$('clubeFalta').textContent = prox
    ? `${prox.min - indicacoes === 1 ? 'Falta 1 amigo ativo' : `Faltam ${prox.min - indicacoes} amigos ativos`} para o nível ${prox.nome}: ${prox.beneficio.toLowerCase()}.`
    : 'Você chegou ao topo do clube. Sua mensalidade é por nossa conta!';
  const tabela = p$('clubeNiveis');
  tabela.replaceChildren();
  CLUBE.forEach((n) => {
    const tr = document.createElement('tr');
    if (n === nivel) tr.className = 'atual';
    [n.nome, n.faixa, n.beneficio].forEach((t) => { const td = document.createElement('td'); td.textContent = t; tr.append(td); });
    tabela.append(tr);
  });

  // Documentos e dados
  p$('docContrato').textContent = `Código ${c.codigo}, assinado em ${dataBR(new Date(c.contratadoEm))}`;
  p$('docComprovante').textContent = `${brl(c.primeira)} via ${c.pagamento}`;
  const dl = p$('pDados');
  dl.replaceChildren();
  [
    ['Nome', c.nome], ['CPF', c.cpf], ['Celular', c.celular], ['E-mail', c.email],
    ['Carro', `${c.modelo} ${c.ano}`], ['Placa', c.placa], ['Seguradora', c.seguradora], ['Franquia', brl(c.franquia)],
  ].forEach(([a, b]) => {
    const div = document.createElement('div');
    const dt = document.createElement('dt'); dt.textContent = a;
    const dd = document.createElement('dd'); dd.textContent = b;
    div.append(dt, dd); dl.append(div);
  });
}

// No celular o menu vira uma faixa que desliza: centraliza a aba escolhida sem rolar a página
function centralizarAba(botao) {
  const faixa = botao.parentElement;
  if (faixa.scrollWidth <= faixa.clientWidth) return;
  const desloc = botao.getBoundingClientRect().left - faixa.getBoundingClientRect().left;
  faixa.scrollLeft += desloc - (faixa.clientWidth - botao.offsetWidth) / 2;
}

function trocarAba(nome) {
  portal.querySelectorAll('.p-aba').forEach((s) => { s.hidden = s.dataset.aba !== nome; });
  portal.querySelectorAll('.p-menu button').forEach((b) => {
    b.classList.toggle('ativo', b.dataset.aba === nome);
    if (b.dataset.aba === nome) centralizarAba(b);
  });
  ['pixMsg', 'codigoMsg', 'docMsg', 'dadosMsg'].forEach((id) => { p$(id).textContent = ''; });
  portal.querySelector('.p-conteudo').scrollTop = 0;
}

async function copiar(texto, msgId, ok) {
  try {
    await navigator.clipboard.writeText(texto);
    p$(msgId).textContent = ok;
  } catch {
    p$(msgId).textContent = `Copie manualmente: ${texto}`;
  }
}

portal.querySelectorAll('.p-menu button').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
p$('portalSair').addEventListener('click', fecharPortal);
p$('pularCarencia').addEventListener('change', preencher);

p$('copiarPix').addEventListener('click', () => copiar('00020126DEMONSTRACAO-SEGURO-DO-SEGURO', 'pixMsg', 'Código Pix de demonstração copiado. Na versão final, é o Pix real da empresa.'));
p$('copiarCodigo').addEventListener('click', () => copiar(p$('meuCodigo').textContent, 'codigoMsg', 'Código copiado. Agora é só mandar para os amigos.'));
function simularAmigos(n) {
  const antes = nivelClube(indicacoes);
  indicacoes += n;
  preencher();
  const agora = nivelClube(indicacoes);
  p$('codigoMsg').textContent = agora !== antes
    ? `Você subiu para o nível ${agora.nome}: ${agora.beneficio.toLowerCase()}.`
    : n === 1 ? 'Um amigo contratou e pagou as 2 primeiras mensalidades. Você ganhou 1 mês grátis.'
      : `${n} amigos contrataram com o seu código.`;
}
p$('simularIndicacao').addEventListener('click', () => simularAmigos(1));
p$('simularIndicacao10').addEventListener('click', () => simularAmigos(10));

portal.querySelectorAll('[data-doc]').forEach((b) => b.addEventListener('click', () => {
  p$('docMsg').textContent = 'Na versão final, o documento abre aqui em PDF, com o código de verificação.';
}));
portal.querySelectorAll('[data-dados]').forEach((b) => b.addEventListener('click', () => {
  p$('dadosMsg').textContent = b.dataset.dados;
}));

p$('acionarForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const faltando = ['aData', 'aSinistro', 'aOficina', 'aRelato'].filter((id) => !p$(id).value.trim());
  ['aData', 'aSinistro', 'aOficina', 'aRelato'].forEach((id) => p$(id).classList.toggle('invalido', faltando.includes(id)));
  if (faltando.length) { p$('acionarErro').textContent = 'Preencha os campos marcados em vermelho.'; return; }
  p$('acionarErro').textContent = '';
  etapaAcionamento = 1;
  p$('acNum').textContent = `AC-${String(Date.now()).slice(-6)}`;
  atualizarLinhaTempo();
  preencher();
});

function atualizarLinhaTempo() {
  p$('linhaTempo').querySelectorAll('li').forEach((li, i) => {
    li.classList.toggle('feita', i < etapaAcionamento);
    li.classList.toggle('atual', i === etapaAcionamento - 1);
  });
  p$('avancarStatus').hidden = etapaAcionamento >= 4;
}

p$('avancarStatus').addEventListener('click', () => {
  etapaAcionamento = Math.min(4, etapaAcionamento + 1);
  atualizarLinhaTempo();
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !portal.hidden && fluxo.hidden) fecharPortal(); });
