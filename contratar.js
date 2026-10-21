// Contratação em modo demonstração: nada é salvo e nenhum pagamento é real.
// Usa CONFIG, brl, mil e mensalidade definidos em app.js.
const fluxo = document.getElementById('fluxo');
const form = document.getElementById('fluxoForm');
const erro = document.getElementById('fluxoErro');
const btnAvancar = document.getElementById('fluxoAvancar');
const btnVoltar = document.getElementById('fluxoVoltar');
const $ = (id) => document.getElementById(id);
let etapa = 1;

const soDigitos = (v) => v.replace(/\D/g, '');
const valorFranquia = () => parseInt(soDigitos($('fFranquia').value), 10) || 0;

function cpfValido(cpf) {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    if ((soma * 10) % 11 % 10 !== Number(d[t])) return false;
  }
  return true;
}

function mascara(input, formatar) {
  input.addEventListener('input', () => { input.value = formatar(soDigitos(input.value)); });
}
mascara($('fCpf'), (d) => d.slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'));
mascara($('fCel'), (d) => d.slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2'));
mascara($('fAno'), (d) => d.slice(0, 4));
mascara($('fFranquia'), (d) => (d ? mil(Number(d.slice(0, 7))) : ''));
$('fPlaca').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7); });
$('fFranquia').addEventListener('input', () => { $('fluxoGerente').hidden = valorFranquia() <= CONFIG.limiteFranquia; });

function abrirFluxo(franquia) {
  $('fFranquia').value = franquia ? mil(franquia) : '';
  $('fluxoGerente').hidden = franquia <= CONFIG.limiteFranquia;
  irPara(1);
  fluxo.hidden = false;
  document.body.classList.add('travado');
  $('fNome').focus();
}

function fecharFluxo() {
  fluxo.hidden = true;
  document.body.classList.remove('travado');
  if (etapa === 5) {
    const dados = dadosCliente();
    form.reset();
    abrirPortal(dados);
  }
}

const temIndicacao = () => /^SDS-[A-Z0-9-]{3,}$/i.test($('fIndicacao').value.trim());
const primeiraMensalidade = () => {
  const m = mensalidade(valorFranquia());
  return temIndicacao() ? Math.round(m * 50) / 100 : m;
};

function dadosCliente() {
  const f = valorFranquia();
  return {
    nome: $('fNome').value.trim(), cpf: $('fCpf').value, celular: $('fCel').value, email: $('fEmail').value.trim(),
    placa: $('fPlaca').value, modelo: $('fModelo').value.trim(), ano: $('fAno').value, seguradora: $('fSeguradora').value,
    franquia: f, mensal: mensalidade(f), primeira: primeiraMensalidade(),
    pagamento: form.querySelector('input[name="pag"]:checked').value,
    codigo: $('cCodigo').textContent, contratadoEm: new Date(),
  };
}

function irPara(n) {
  etapa = n;
  form.querySelectorAll('.etapa').forEach((el) => { el.hidden = Number(el.dataset.etapa) !== n; });
  document.querySelectorAll('.fluxo-etapas li').forEach((li) => {
    const e = Number(li.dataset.etapa);
    li.classList.toggle('atual', e === n);
    li.classList.toggle('feita', e < n);
  });
  erro.textContent = '';
  btnVoltar.hidden = n === 1 || n === 5;
  btnAvancar.textContent = { 3: 'Ir para o pagamento', 4: 'Simular pagamento confirmado', 5: 'Fechar' }[n] || 'Continuar';
  if (n === 3) montarResumo();
  if (n === 4) {
    $('pagValor').textContent = temIndicacao()
      ? `${brl(primeiraMensalidade())} (50% de desconto por indicação; depois ${brl(mensalidade(valorFranquia()))})`
      : brl(primeiraMensalidade());
  }
  if (n === 5) montarCarteirinha();
  fluxo.scrollTop = 0;
}

function marcar(id, ok) { $(id).classList.toggle('invalido', !ok); return ok; }

function validar(n) {
  if (n === 1) {
    const ok = [
      marcar('fNome', $('fNome').value.trim().split(/\s+/).length >= 2),
      marcar('fCpf', cpfValido($('fCpf').value)),
      marcar('fCel', soDigitos($('fCel').value).length >= 10),
      marcar('fEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('fEmail').value.trim())),
    ];
    if (!ok[1] && $('fCpf').value) return 'Esse CPF não é válido. Confira os números.';
    if (ok.includes(false)) return 'Preencha os campos marcados em vermelho (nome e sobrenome, CPF, celular e e-mail).';
  }
  if (n === 2) {
    const ano = Number($('fAno').value);
    const ok = [
      marcar('fPlaca', /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test($('fPlaca').value)),
      marcar('fAno', ano >= 1990 && ano <= new Date().getFullYear() + 1),
      marcar('fModelo', $('fModelo').value.trim().length >= 3),
      marcar('fSeguradora', !!$('fSeguradora').value),
      marcar('fFranquia', valorFranquia() > 0),
    ];
    if (ok.includes(false)) return 'Confira os campos marcados em vermelho. A placa pode ser no modelo antigo (ABC1234) ou Mercosul (ABC1D23).';
    if (valorFranquia() > CONFIG.limiteFranquia) return 'Franquias acima de R$ 10.000 são contratadas com o gerente. Diminua o valor para continuar a demonstração.';
  }
  if (n === 3 && !['aRegulamento', 'aCarencia', 'aNaoSeguro'].every((id) => $(id).checked)) {
    return 'Para continuar, marque as três confirmações.';
  }
  return '';
}

function inicioProtecao() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString('pt-BR');
}

function montarResumo() {
  const f = valorFranquia();
  const dl = $('resumo');
  dl.replaceChildren();
  const add = (dt, dd, cls) => {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    const a = document.createElement('dt'); a.textContent = dt;
    const b = document.createElement('dd'); b.textContent = dd;
    div.append(a, b);
    dl.append(div);
  };
  add('Sua mensalidade', `${brl(mensalidade(f))} por mês`, 'destaque');
  if (temIndicacao()) add('Indicação', `${$('fIndicacao').value.trim().toUpperCase()}: 1ª mensalidade por ${brl(primeiraMensalidade())}`, 'cheio');
  [
    ['Nome', $('fNome').value.trim()],
    ['CPF', $('fCpf').value],
    ['Carro', `${$('fModelo').value.trim()} ${$('fAno').value}`],
    ['Placa', $('fPlaca').value],
    ['Seguradora', $('fSeguradora').value],
    ['Franquia protegida', brl(f)],
    ['Protegido a partir de', inicioProtecao()],
    ['Uso', '1 franquia a cada 12 meses'],
  ].forEach(([a, b]) => add(a, b));
}

function montarCarteirinha() {
  const f = valorFranquia();
  $('cNome').textContent = $('fNome').value.trim();
  $('cPlaca').textContent = $('fPlaca').value;
  $('cFranquia').textContent = brl(f);
  $('cMensal').textContent = brl(mensalidade(f));
  $('cInicio').textContent = inicioProtecao();
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  $('cCodigo').textContent = 'SDS-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (etapa === 5) { fecharFluxo(); return; }
  const msg = validar(etapa);
  if (msg) { erro.textContent = msg; return; }
  irPara(etapa + 1);
});
btnVoltar.addEventListener('click', () => irPara(Math.max(1, etapa - 1)));
$('fluxoFechar').addEventListener('click', fecharFluxo);
fluxo.addEventListener('click', (e) => { if (e.target === fluxo) fecharFluxo(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !fluxo.hidden) fecharFluxo(); });
