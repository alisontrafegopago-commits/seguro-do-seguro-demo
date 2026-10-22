// Topo, menus, regulamento, cadastro de corretor e contador de transparência

// Atualizar aqui a cada franquia paga (somente números reais)
const TRANSPARENCIA = {
  franquiasPagas: 0,
  totalPago: 0,
  tempoMedioHoras: null, // ex.: 9.5 depois do primeiro pagamento
};

const topo = document.querySelector('.topo');
const menu = document.getElementById('menu');
const menuBotao = document.getElementById('menuBotao');
const entrarBotao = document.getElementById('entrarBotao');
const entrarMenu = document.getElementById('entrarMenu');

function fecharMenus() {
  topo.classList.remove('menu-aberto');
  menuBotao.setAttribute('aria-expanded', 'false');
  entrarMenu.hidden = true;
  entrarBotao.setAttribute('aria-expanded', 'false');
}

menuBotao.addEventListener('click', () => {
  const abrir = !topo.classList.contains('menu-aberto');
  fecharMenus();
  topo.classList.toggle('menu-aberto', abrir);
  menuBotao.setAttribute('aria-expanded', String(abrir));
});
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', fecharMenus));

entrarBotao.addEventListener('click', (e) => {
  e.stopPropagation();
  const abrir = entrarMenu.hidden;
  fecharMenus();
  entrarMenu.hidden = !abrir;
  entrarBotao.setAttribute('aria-expanded', String(abrir));
});
document.addEventListener('click', (e) => { if (!e.target.closest('.entrar')) { entrarMenu.hidden = true; entrarBotao.setAttribute('aria-expanded', 'false'); } });

document.querySelectorAll('[data-entrar]').forEach((b) => b.addEventListener('click', (e) => {
  e.preventDefault();
  fecharMenus();
  if (b.dataset.entrar === 'corretor') abrirCorretor();
  else abrirPortal();
}));

// Topo mais fino ao rolar e item do menu marcado conforme a seção visível
const aoRolar = () => topo.classList.toggle('rolou', window.scrollY > 8);
window.addEventListener('scroll', aoRolar, { passive: true });
aoRolar();

// Marca a seção que está no meio da tela; se for uma parte fora do menu, nenhum item fica marcado
const links = [...menu.querySelectorAll('a[href^="#"]')];
const todasSecoes = [...document.querySelectorAll('main > section')];
function marcarMenu() {
  const meio = window.innerHeight * 0.45;
  const atual = todasSecoes.find((s) => { const r = s.getBoundingClientRect(); return r.top <= meio && r.bottom > meio; });
  links.forEach((a) => a.classList.toggle('ativo', !!atual?.id && a.getAttribute('href') === `#${atual.id}`));
}
window.addEventListener('scroll', marcarMenu, { passive: true });
window.addEventListener('resize', marcarMenu);
marcarMenu();

// Janelas: regulamento e cadastro de corretor
function abrirJanela(id) {
  document.getElementById(id).hidden = false;
  document.body.classList.add('travado');
}
function fecharJanela(janela) {
  janela.hidden = true;
  if (document.getElementById('portal').hidden && document.getElementById('portalCorretor').hidden) document.body.classList.remove('travado');
}
document.querySelectorAll('[data-regulamento]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); abrirJanela('regulamento'); }));
document.getElementById('corretorCadastrar').addEventListener('click', () => abrirJanela('cadCorretor'));
['regulamento', 'cadCorretor'].forEach((id) => {
  const janela = document.getElementById(id);
  janela.querySelector('[data-fechar]').addEventListener('click', () => fecharJanela(janela));
  janela.addEventListener('click', (e) => { if (e.target === janela) fecharJanela(janela); });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  fecharMenus();
  ['regulamento', 'cadCorretor'].forEach((id) => { const j = document.getElementById(id); if (!j.hidden) fecharJanela(j); });
});

const celCor = document.getElementById('cCelCor');
celCor.addEventListener('input', () => {
  const d = celCor.value.replace(/\D/g, '').slice(0, 11);
  celCor.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
});
document.getElementById('cadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const ids = ['cNomeCor', 'cDocCor', 'cCelCor', 'cCidade'];
  const faltando = ids.filter((id) => !document.getElementById(id).value.trim());
  ids.forEach((id) => document.getElementById(id).classList.toggle('invalido', faltando.includes(id)));
  const doc = document.getElementById('cDocCor').value.replace(/\D/g, '');
  if (faltando.length) { document.getElementById('cadErro').textContent = 'Preencha os campos marcados em vermelho.'; return; }
  if (doc.length !== 11 && doc.length !== 14) {
    document.getElementById('cDocCor').classList.add('invalido');
    document.getElementById('cadErro').textContent = 'Informe um CPF (11 números) ou CNPJ (14 números).';
    return;
  }
  document.getElementById('cadErro').textContent = '';
  fecharJanela(document.getElementById('cadCorretor'));
  abrirCorretor(document.getElementById('cNomeCor').value.trim());
});

// Contador de transparência
const t = TRANSPARENCIA;
document.getElementById('ctPagas').textContent = t.franquiasPagas.toLocaleString('pt-BR');
document.getElementById('ctTotal').textContent = brl(t.totalPago).replace(',00', '');
if (t.tempoMedioHoras) {
  document.getElementById('ctTempo').textContent = `${t.tempoMedioHoras.toLocaleString('pt-BR')}h`;
  document.getElementById('ctTempoRot').textContent = 'tempo médio de pagamento';
}
