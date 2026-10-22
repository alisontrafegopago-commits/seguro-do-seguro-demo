// Configuração: preencher no final, antes de publicar
const CONFIG = {
  whatsapp: '',          // só números com DDI e DDD, ex.: '5585999999999'
  limiteFranquia: 10000, // acima disso, atendimento com o gerente
  mensalidadeMinima: 39.9,
};

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mil = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

// Mesma regra do regulamento: 1% da franquia menos R$ 0,10, nunca abaixo do mínimo
function mensalidade(franquia) {
  return Math.max(CONFIG.mensalidadeMinima, Math.round((franquia * 0.01 - 0.1) * 100) / 100);
}

function linkWhats(texto) {
  if (!CONFIG.whatsapp) return null;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

// Aviso curto no rodapé da tela, para ações que ainda não estão configuradas
let avisoTempo;
function avisar(texto) {
  const aviso = document.getElementById('avisoFlutuante');
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(avisoTempo);
  avisoTempo = setTimeout(() => { aviso.hidden = true; }, 4000);
}

function abrirWhats(texto) {
  const url = linkWhats(texto);
  if (url) window.open(url, '_blank', 'noopener');
  else avisar('O WhatsApp oficial entra aqui antes do lançamento.');
}

const campo = document.getElementById('valorFranquia');
const regua = document.getElementById('reguaFranquia');
const sim = document.querySelector('.sim');
const gerente = document.getElementById('simGerente');

function atualizar(valor) {
  const franquia = Math.max(0, Math.min(valor || 0, 999999));
  const acimaLimite = franquia > CONFIG.limiteFranquia;

  sim.classList.toggle('modo-gerente', acimaLimite);
  gerente.hidden = !acimaLimite;
  if (acimaLimite || !franquia) {
    document.getElementById('simSem').textContent = brl(franquia);
    document.getElementById('simCom').textContent = brl(CONFIG.mensalidadeMinima);
    document.getElementById('simFrase').textContent = 'Informe o valor da franquia para ver a sua mensalidade.';
    return;
  }

  const mes = mensalidade(franquia);
  document.getElementById('simSem').textContent = brl(franquia);
  document.getElementById('simCom').textContent = brl(mes);
  document.getElementById('simFrase').textContent =
    `Em um ano são ${brl(mes * 12)}, e você não tira ${brl(franquia)} do bolso de uma vez.`;
}

campo.addEventListener('input', () => {
  const numero = parseInt(campo.value.replace(/\D/g, ''), 10) || 0;
  campo.value = numero ? mil(numero) : '';
  regua.value = Math.min(numero, Number(regua.max));
  atualizar(numero);
});

regua.addEventListener('input', () => {
  const numero = Number(regua.value);
  campo.value = mil(numero);
  atualizar(numero);
});

document.getElementById('gerenteBotao').addEventListener('click', (e) => {
  e.preventDefault();
  abrirWhats(`Olá, gerente! Simulei no site e minha franquia é de R$ ${campo.value}. Quero uma condição especial.`);
});

document.getElementById('simBotao').addEventListener('click', (e) => {
  e.preventDefault();
  abrirFluxo(parseInt(campo.value.replace(/\D/g, ''), 10) || 0);
});

document.querySelectorAll('[data-whats]').forEach((link) => {
  link.addEventListener('click', (e) => { e.preventDefault(); abrirWhats(link.dataset.whats); });
});

atualizar(5000);
