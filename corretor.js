// Portal do corretor em modo demonstração. Usa brl e mensalidade de app.js.
const portalCorretor = document.getElementById('portalCorretor');
const c$ = (id) => document.getElementById(id);

// Regras aprovadas por Alison em 2026-10-21
const NIVEIS = [
  { nome: 'Parceiro', min: 0, pct: 0.15, faixa: '1 a 24' },
  { nome: 'Prata', min: 25, pct: 0.20, faixa: '25 a 49' },
  { nome: 'Ouro', min: 50, pct: 0.25, faixa: '50 a 99' },
  { nome: 'Diamante', min: 100, pct: 0.30, faixa: '100 ou mais' },
];
const PREMIOS = [[5, 100], [10, 250], [20, 600], [40, 1500]];

// Dados de exemplo para a demonstração
const NOMES = ['Ana Paula', 'Bruno Lima', 'Carla Mendes', 'Diego Rocha', 'Elaine Costa', 'Fábio Nunes', 'Gabriela Reis', 'Henrique Alves', 'Isabela Freitas', 'João Pedro', 'Karina Duarte', 'Lucas Martins'];
const FRANQUIAS = [4000, 5000, 6000, 3500, 8000, 4500, 7000, 10000, 5500, 3000];
let corretorNome = 'Corretor Exemplo';

const nivelDe = (ativos) => [...NIVEIS].reverse().find((n) => ativos >= n.min);
const proximoNivel = (ativos) => NIVEIS.find((n) => n.min > ativos);
const premioDe = (novos) => PREMIOS.filter(([meta]) => novos >= meta).pop()?.[1] || 0;

function carteira(ativos) {
  return Array.from({ length: ativos }, (_, i) => {
    const franquia = FRANQUIAS[i % FRANQUIAS.length];
    return { nome: `${NOMES[i % NOMES.length]}${i >= NOMES.length ? ` ${Math.floor(i / NOMES.length) + 1}` : ''}`, franquia, mensal: mensalidade(franquia) };
  });
}

function atualizarCorretor() {
  const ativos = Number(c$('cdAtivos').value);
  const novos = Number(c$('cdNovos').value);
  c$('cdAtivosVal').textContent = ativos;
  c$('cdNovosVal').textContent = novos;

  const lista = carteira(ativos);
  const somaMensal = lista.reduce((t, c) => t + c.mensal, 0);
  const nivel = nivelDe(ativos);
  const prox = proximoNivel(ativos);
  const comissao = somaMensal * nivel.pct;
  const premio = premioDe(novos);
  const media = somaMensal / (ativos || 1) || mensalidade(FRANQUIAS[0]);

  // Início
  c$('corNome').textContent = corretorNome.split(/\s+/)[0];
  c$('cNivelNome').textContent = nivel.nome;
  c$('cNivelPct').textContent = `${nivel.pct * 100}%`;
  c$('cNivelCaixa').dataset.nivel = nivel.nome.toLowerCase();
  if (prox) {
    const base = nivel.min;
    c$('cNivelBarra').style.width = `${Math.round(((ativos - base) / (prox.min - base)) * 100)}%`;
    c$('cNivelFalta').textContent = `Faltam ${prox.min - ativos} clientes ativos para o nível ${prox.nome} (${prox.pct * 100}%).`;
    const futura = media * prox.min * prox.pct;
    c$('cDica').innerHTML = `<b>Ao chegar no ${prox.nome},</b> a comissão de ${prox.pct * 100}% vale para a carteira toda. Com ${prox.min} clientes ativos, a sua comissão mensal fica em cerca de ${brl(futura)}.`;
  } else {
    c$('cNivelBarra').style.width = '100%';
    c$('cNivelFalta').textContent = 'Você está no nível mais alto. Parabéns!';
    c$('cDica').innerHTML = '<b>Nível Diamante:</b> atendimento direto com o gerente e a maior comissão do programa.';
  }
  c$('cAtivos').textContent = ativos;
  c$('cComissao').textContent = brl(comissao);
  c$('cNovos').textContent = novos;
  c$('cPremio').textContent = brl(premio);

  // Clientes (mostra até 15 para não pesar a tela)
  const corpo = c$('cLista');
  corpo.replaceChildren();
  lista.slice(0, 15).forEach((c, i) => {
    const tr = document.createElement('tr');
    const novo = i >= ativos - Math.min(novos, ativos);
    [c.nome, brl(c.franquia), brl(c.mensal), novo ? 'Novo este mês' : 'Em dia'].forEach((t, j) => {
      const td = document.createElement('td'); td.textContent = t;
      if (j === 3) td.className = novo ? 'novo' : 'pago';
      tr.append(td);
    });
    corpo.append(tr);
  });
  c$('cListaMais').textContent = ativos === 0 ? 'Você ainda não tem clientes. Use o seu código na aba Divulgar.' : ativos > 15 ? `E mais ${ativos - 15} clientes.` : '';

  // Comissões
  c$('cComissao2').textContent = brl(comissao + premio);
  c$('cComissaoConta').textContent = `${nivel.pct * 100}% de ${brl(somaMensal)} em mensalidades${premio ? ' + prêmio de meta' : ''}`;
  const extrato = c$('cExtrato');
  extrato.replaceChildren();
  [
    [`Mensalidades pagas por ${ativos} clientes ativos`, brl(somaMensal)],
    [`Sua comissão (nível ${nivel.nome}, ${nivel.pct * 100}%)`, brl(comissao)],
    [`Prêmio de meta (${novos} clientes novos)`, brl(premio)],
    ['Total previsto no mês', brl(comissao + premio)],
  ].forEach(([a, b], i, arr) => {
    const tr = document.createElement('tr');
    if (i === arr.length - 1) tr.className = 'total';
    [a, b].forEach((t) => { const td = document.createElement('td'); td.textContent = t; tr.append(td); });
    extrato.append(tr);
  });

  // Metas
  const metas = c$('cMetas');
  metas.replaceChildren();
  PREMIOS.forEach(([meta, valor]) => {
    const li = document.createElement('li');
    const feita = novos >= meta;
    li.className = feita ? 'feita' : '';
    li.innerHTML = `<b>${meta} clientes novos</b><span>${brl(valor)}</span><small>${feita ? 'Meta batida' : `Faltam ${meta - novos}`}</small>`;
    metas.append(li);
  });
  const niveis = c$('cNiveis');
  niveis.replaceChildren();
  NIVEIS.forEach((n) => {
    const tr = document.createElement('tr');
    if (n === nivel) tr.className = 'atual';
    [n.nome, n.faixa, `${n.pct * 100}%`].forEach((t) => { const td = document.createElement('td'); td.textContent = t; tr.append(td); });
    niveis.append(tr);
  });

  // Divulgar
  const codigo = `COR-${corretorNome.split(/\s+/)[0].normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8) || 'PARCEIRO'}-4821`;
  c$('cLink').textContent = codigo;
  const texto = `Sabia que franquia maior deixa o seguro do carro mais barato? Com a Seguro do Seguro, a franquia fica por conta deles e é paga em até 24 horas. Contrate com o meu código ${codigo}.`;
  c$('cWhats').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

function trocarAbaCorretor(nome) {
  portalCorretor.querySelectorAll('.c-aba').forEach((s) => { s.hidden = s.dataset.caba !== nome; });
  portalCorretor.querySelectorAll('.p-menu button').forEach((b) => {
    b.classList.toggle('ativo', b.dataset.caba === nome);
    if (b.dataset.caba === nome) centralizarAba(b);
  });
  ['cMsg', 'cKitMsg'].forEach((id) => { c$(id).textContent = ''; });
  portalCorretor.querySelector('.p-conteudo').scrollTop = 0;
}

function abrirCorretor(nome) {
  if (nome) corretorNome = nome;
  atualizarCorretor();
  portalCorretor.hidden = false;
  trocarAbaCorretor('inicio');
  document.body.classList.add('travado');
}

function fecharCorretor() {
  portalCorretor.hidden = true;
  document.body.classList.remove('travado');
}

portalCorretor.querySelectorAll('.p-menu button').forEach((b) => b.addEventListener('click', () => trocarAbaCorretor(b.dataset.caba)));
c$('corretorSair').addEventListener('click', fecharCorretor);
c$('cdAtivos').addEventListener('input', atualizarCorretor);
c$('cdNovos').addEventListener('input', atualizarCorretor);
c$('cCopiar').addEventListener('click', () => copiar(c$('cLink').textContent, 'cMsg', 'Código copiado. Na versão final, ele vira um link do site com o seu nome.'));
portalCorretor.querySelectorAll('[data-kit]').forEach((b) => b.addEventListener('click', () => {
  c$('cKitMsg').textContent = 'Na versão final, o material abre aqui já com o seu código.';
}));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !portalCorretor.hidden) fecharCorretor(); });
