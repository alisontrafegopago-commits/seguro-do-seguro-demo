// Assistente virtual 24h (demonstração): responde dúvidas e conduz a contratação passo a passo.
// Funciona só no navegador, por palavras-chave. Na fase real, as respostas podem vir de uma IA no servidor.
// Usa brl, mil, mensalidade, CONFIG, abrirWhats (app.js), cpfValido, abrirFluxo, irPara (contratar.js) e abrirPortal, trocarAba (portal.js).
const chat = document.getElementById('chat');
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatEntrada = document.getElementById('chatEntrada');
const chatBotao = document.getElementById('chatBotao');
let conversa = null; // passo atual da contratação guiada
let aguardandoValor = false;
const ficha = {};

const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const numeroDe = (t) => {
  const m = t.replace(/r\$\s*/i, '').match(/\d[\d.,]*\s*(mil|k)?/i);
  if (!m) return 0;
  let n = parseFloat(m[0].replace(/\.(?=\d{3})/g, '').replace(',', '.'));
  if (m[1]) n *= 1000;
  return Math.round(n);
};
const PRINCIPAIS = ['Quanto eu pago?', 'Quero contratar', 'Como funciona', 'Bati o carro', 'Falar com atendente'];

// Mensagens
function bolha(texto, quem) {
  const div = document.createElement('div');
  div.className = `msg msg-${quem}`;
  texto.split('\n').forEach((linha, i) => {
    if (i) div.append(document.createElement('br'));
    div.append(document.createTextNode(linha));
  });
  chatLog.append(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function opcoes(lista) {
  chatLog.querySelectorAll('.chat-opcoes').forEach((o) => o.remove());
  if (!lista?.length) return;
  const div = document.createElement('div');
  div.className = 'chat-opcoes';
  lista.forEach((rotulo) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = rotulo;
    b.addEventListener('click', () => receber(rotulo));
    div.append(b);
  });
  chatLog.append(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

let fila = Promise.resolve();
function responder(textos, lista) {
  const partes = Array.isArray(textos) ? textos : [textos];
  fila = fila.then(async () => {
    for (const t of partes) {
      const digitando = document.createElement('div');
      digitando.className = 'msg msg-bot digitando';
      digitando.setAttribute('aria-label', 'Digitando');
      digitando.innerHTML = '<span></span><span></span><span></span>';
      chatLog.append(digitando);
      chatLog.scrollTop = chatLog.scrollHeight;
      await new Promise((r) => setTimeout(r, Math.min(1100, 350 + t.length * 6)));
      digitando.remove();
      bolha(t, 'bot');
    }
    opcoes(lista);
  });
}

// Respostas por assunto (a primeira que combinar vence)
const ASSUNTOS = [
  { chave: /\b(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)\b/, resp: () => responder('Oi! Como posso te ajudar?', PRINCIPAIS) },
  { chave: /(obrigad|valeu|agradec)/, resp: () => responder('Por nada! Se surgir outra dúvida, é só chamar. Estou aqui 24 horas.', PRINCIPAIS) },
  { chave: /(atendente|humano|falar com (uma )?pessoa|falar com alguem|gerente|whats|zap)/, resp: () => { responder('Claro! Vou te passar para o nosso atendimento no WhatsApp, com uma pessoa de verdade.', ['Voltar ao início']); setTimeout(() => abrirWhats('Olá! Vim pelo assistente do site e quero falar com uma pessoa.'), 900); } },
  { chave: /(bati|batida|acidente|colisao|sinistro|acionar|batera|bateram)/, resp: () => responder([
    'Sinto muito pela batida. Fica tranquilo que a gente te guia. É assim:',
    '1. Abra o sinistro na sua seguradora normalmente.\n2. No portal do cliente, toque em "Acionar franquia" e informe o número do sinistro, a oficina e fotos.\n3. Quando a seguradora confirmar o sinistro, pagamos a franquia em até 24 horas, direto na oficina.',
    'Lembrete: vale depois dos 90 dias de carência e com a mensalidade em dia.',
  ], ['Abrir o portal para acionar', 'Falar com atendente']) },
  { chave: /(golpe|confia|seguro mesmo|e seguradora|voces sao seguradora|susep|cnpj|empresa seria|verdade)/, resp: () => responder([
    'Pergunta muito justa. Somos uma empresa nova, em fase de lançamento, e não somos seguradora: protegemos só a franquia do seu seguro.',
    'Para você conferir tudo: as regras ficam no regulamento resumido, você tem 7 dias para desistir com o dinheiro de volta (Código de Defesa do Consumidor) e cada franquia que pagarmos aparece no contador público do site, com o comprovante. Razão social e CNPJ serão publicados antes do início das vendas.',
  ], ['Ver o regulamento', 'Falar com atendente']) },
  { chave: /(corretor|comissao|parceiro|revender)/, resp: () => responder([
    'Que bom! Para corretores a comissão é mensal, enquanto o cliente estiver ativo, e cresce com a carteira: 15% (1 a 24 clientes), 20% (25 a 49), 25% (50 a 99) e 30% (100 ou mais).',
    'Ainda tem prêmios por meta no mês: R$ 100 com 5 clientes novos, R$ 250 com 10, R$ 600 com 20 e R$ 1.500 com 40.',
  ], ['Quero ser corretor', 'Ver o portal do corretor']) },
  { chave: /(indica|clube|amigo|desconto)/, resp: () => responder([
    'No Clube de indicação, cada amigo que contratar com o seu código vale 1 mês grátis para você, e ele ganha 50% de desconto na primeira mensalidade.',
    'Quanto mais amigos ativos, melhor: 3 amigos dão 10% de desconto todo mês, 6 dão 25%, e com 50 amigos a sua mensalidade fica grátis.',
  ], ['Quero contratar', 'Voltar ao início']) },
  { chave: /(franquia maior|mais barato|economiz|baratear)/, resp: () => responder([
    'Essa é a nossa ideia principal: quanto maior a franquia, menor costuma ser o preço do seguro.',
    'Você escolhe a franquia maior na seguradora, paga menos no seguro, e a franquia fica por nossa conta se você bater. Na renovação, peça ao seu corretor para simular com franquias diferentes.',
  ], ['Quanto eu pago?', 'Quero contratar']) },
  { chave: /(carencia|quando posso usar|quando comeca|comeca a valer|a partir de quando)/, resp: () => responder('A proteção começa 90 dias depois do primeiro pagamento confirmado. Depois disso, vale 1 franquia a cada 12 meses de contrato.', ['Quanto eu pago?', 'Quero contratar']) },
  { chave: /(\b24\s*h|\b24 horas|prazo|demora|quanto tempo|rapido)/, resp: () => responder('Pagamos a franquia em até 24 horas depois da confirmação do sinistro, ou seja, quando recebemos a aprovação da seguradora e o orçamento da oficina. O pagamento vai direto para a oficina ou para a seguradora.', ['Bati o carro', 'Voltar ao início']) },
  { chave: /(cancel|fidelidade|multa|sair|desistir)/, resp: () => responder([
    'Não temos fidelidade. Se você nunca acionou a proteção, cancela quando quiser, sem multa.',
    'Se já recebeu uma franquia paga por nós, completa os 12 meses do contrato ou paga as mensalidades que faltam. E nos primeiros 7 dias você pode desistir com o dinheiro de volta.',
  ], ['Quero contratar', 'Voltar ao início']) },
  { chave: /(cobre|cobertura|protege|perda total|roubo|furto|vidro|nao cobre)/, resp: () => responder([
    'Protegemos a franquia de colisão aprovada pela sua seguradora: batidas, raspões e danos parciais, em carro com seguro ativo em qualquer seguradora do Brasil.',
    'Não entram: perda total, roubo ou furto (nesses casos não há franquia), sinistro negado pela seguradora, batidas na carência ou com mensalidade atrasada, e reembolso de franquia já paga.',
  ], ['Quanto eu pago?', 'Quero contratar']) },
  { chave: /(vistoria)/, resp: () => responder('Não precisa de vistoria. Você contrata pelo celular informando os dados do carro e da apólice.', ['Quero contratar']) },
  { chave: /(trocar de seguro|qual seguradora|minha seguradora|seguradora)/, resp: () => responder('Funciona com o seguro que você já tem, em qualquer seguradora. Você não precisa trocar nada.', ['Quanto eu pago?', 'Quero contratar']) },
  { chave: /(pix|cartao|boleto|pagar|pagamento|forma de pag)/, resp: () => responder('Você pode pagar a mensalidade por Pix, cartão de crédito (cobrança todo mês) ou boleto. Te avisamos pelo WhatsApp 3 dias antes de cada vencimento.', ['Quero contratar', 'Voltar ao início']) },
  { chave: /(lgpd|meus dados|privacidade|cpf)/, resp: () => responder('Usamos o CPF só para emitir o seu contrato. Seus dados ficam criptografados e, pelo portal, você pode pedir uma cópia ou a exclusão quando quiser, como manda a LGPD.', ['Quero contratar', 'Voltar ao início']) },
  { chave: /(reembols|devolv)/, resp: () => responder('Pagamos direto para a oficina ou para a seguradora. Por segurança, não reembolsamos franquia que você já pagou do próprio bolso.', ['Voltar ao início']) },
  { chave: /(como funciona|entender|explica|o que e|o que voces fazem)/, resp: () => responder([
    'É simples: você paga uma mensalidade pequena (cerca de 1% do valor da franquia, a partir de R$ 39,90).',
    'Se bater o carro e a seguradora aprovar o sinistro, pagamos a sua franquia em até 24 horas, direto na oficina. A proteção começa depois de 90 dias de carência e vale 1 franquia a cada 12 meses.',
  ], ['Quanto eu pago?', 'Quero contratar', 'O que não cobre?']) },
  { chave: /(contratar|assinar|aderir|quero proteger|fechar|fazer o meu|comecar)/, resp: () => iniciarContratacao() },
  { chave: /(quanto|preco|valor|mensalidade|custa|caro)/, resp: (t) => {
    const n = numeroDe(t);
    if (n >= 500) return precoPara(n);
    aguardandoValor = true;
    responder('Me diga o valor da franquia que está na sua apólice (por exemplo: 5000) que eu calculo na hora.');
  } },
];

function precoPara(valor) {
  aguardandoValor = false;
  if (valor > CONFIG.limiteFranquia) {
    responder(`Franquias acima de R$ 10.000 têm atendimento especial com o nosso gerente, que monta uma condição sob medida.`, ['Falar com atendente', 'Voltar ao início']);
    return;
  }
  const m = mensalidade(valor);
  responder([
    `Para uma franquia de ${brl(valor)}, a mensalidade fica em ${brl(m)} por mês.`,
    `Em um ano são ${brl(m * 12)}, e se você bater, não tira ${brl(valor)} do bolso de uma vez.`,
  ], ['Quero contratar', 'Como funciona', 'Voltar ao início']);
  ficha.franquia = valor;
}

// Contratação guiada, um dado por vez
const PASSOS = [
  { id: 'franquia', pergunta: 'Qual é o valor da franquia da sua apólice? (por exemplo: 5000)',
    validar: (t) => { const n = numeroDe(t); if (!n) return 'Me diga só o valor em reais, por exemplo: 5000.'; if (n > CONFIG.limiteFranquia) return 'Acima de R$ 10.000 o atendimento é com o nosso gerente. Digite "atendente" para falar com ele, ou informe um valor até 10.000.'; ficha.franquia = n; return ''; },
    depois: () => `Perfeito: franquia de ${brl(ficha.franquia)}, mensalidade de ${brl(mensalidade(ficha.franquia))}.` },
  { id: 'nome', pergunta: 'Qual é o seu nome completo, como está no documento?',
    validar: (t) => (t.trim().split(/\s+/).length >= 2 ? (ficha.nome = t.trim(), '') : 'Preciso do nome e sobrenome, por favor.') },
  { id: 'cpf', pergunta: 'Agora o seu CPF. Usamos só para emitir o contrato, e ele fica criptografado.',
    validar: (t) => (cpfValido(t) ? (ficha.cpf = t.replace(/\D/g, ''), '') : 'Esse CPF não parece válido. Confere os números para mim?') },
  { id: 'cel', pergunta: 'Qual é o seu celular com WhatsApp, com DDD?',
    validar: (t) => { const d = t.replace(/\D/g, ''); return d.length >= 10 && d.length <= 11 ? (ficha.cel = d, '') : 'Me passa o número com DDD, por exemplo: 85 99999 0000.'; } },
  { id: 'email', pergunta: 'E o seu e-mail?',
    validar: (t) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.trim()) ? (ficha.email = t.trim(), '') : 'Esse e-mail parece incompleto. Pode conferir?') },
  { id: 'placa', pergunta: 'Agora o carro. Qual é a placa?',
    validar: (t) => { const p = t.toUpperCase().replace(/[^A-Z0-9]/g, ''); return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(p) ? (ficha.placa = p, '') : 'A placa pode ser no modelo antigo (ABC1234) ou Mercosul (ABC1D23).'; } },
  { id: 'ano', pergunta: 'Qual é o ano do carro?',
    validar: (t) => { const a = Number(t.replace(/\D/g, '')); return a >= 1990 && a <= new Date().getFullYear() + 1 ? (ficha.ano = String(a), '') : 'Me diga o ano com 4 números, por exemplo: 2022.'; } },
  { id: 'modelo', pergunta: 'Qual é a marca e o modelo? (por exemplo: Fiat Argo 1.0)',
    validar: (t) => (t.trim().length >= 3 ? (ficha.modelo = t.trim(), '') : 'Me conta a marca e o modelo do carro.') },
  { id: 'seguradora', pergunta: 'Em qual seguradora está o seguro do carro?',
    opcoes: ['Porto Seguro', 'Azul Seguros', 'Itaú Seguros', 'Bradesco Seguros', 'Allianz', 'HDI', 'Tokio Marine', 'Mapfre', 'Liberty / Yelum', 'Suhai', 'Youse', 'Outra'],
    validar: (t) => {
      const lista = [...document.getElementById('fSeguradora').options].map((o) => o.value).filter(Boolean);
      const achou = lista.find((s) => normalizar(s).includes(normalizar(t)) || normalizar(t).includes(normalizar(s).split(' ')[0]));
      ficha.seguradora = achou || 'Outra';
      return '';
    } },
  { id: 'indicacao', pergunta: 'Algum amigo te indicou? Se tiver o código (SDS-...), me manda. Ele vale 50% de desconto na primeira mensalidade.',
    opcoes: ['Não tenho código'],
    validar: (t) => { ficha.indicacao = /^SDS-[A-Z0-9-]{3,}$/i.test(t.trim()) ? t.trim().toUpperCase() : ''; return ''; } },
];

function iniciarContratacao() {
  aguardandoValor = false;
  conversa = ficha.franquia ? 1 : 0;
  const intro = ficha.franquia
    ? `Vamos lá! Vou usar a franquia de ${brl(ficha.franquia)} que você simulou. São só alguns dados, um de cada vez. Se quiser parar, é só escrever "cancelar".`
    : 'Vamos lá! São só alguns dados, um de cada vez. Se quiser parar, é só escrever "cancelar".';
  responder([intro, PASSOS[conversa].pergunta], PASSOS[conversa].opcoes);
}

function seguirContratacao(texto) {
  if (/^(cancelar|parar|sair)$/.test(normalizar(texto))) {
    conversa = null;
    responder('Tudo bem, parei por aqui. Quando quiser continuar, é só chamar.', PRINCIPAIS);
    return;
  }
  const passo = PASSOS[conversa];
  const problema = passo.validar(texto);
  if (problema) { responder(problema, passo.opcoes); return; }
  const extra = passo.depois ? [passo.depois()] : [];
  conversa += 1;
  if (conversa < PASSOS.length) { responder([...extra, PASSOS[conversa].pergunta], PASSOS[conversa].opcoes); return; }
  conversa = null;
  const m = mensalidade(ficha.franquia);
  responder([
    'Pronto, anotei tudo! Confere o resumo:',
    `${ficha.nome}\n${ficha.modelo} ${ficha.ano}, placa ${ficha.placa}\nSeguradora: ${ficha.seguradora}\nFranquia protegida: ${brl(ficha.franquia)}\nMensalidade: ${brl(m)}${ficha.indicacao ? `\nIndicação ${ficha.indicacao}: 1ª mensalidade com 50% de desconto` : ''}`,
    'Agora é só revisar, aceitar o regulamento e escolher como pagar.',
  ], ['Revisar e pagar', 'Corrigir meus dados']);
}

// Leva os dados da conversa para a tela de contratação, já no resumo
function levarParaContratacao() {
  const preencher = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); };
  fecharChat();
  abrirFluxo(ficha.franquia);
  preencher('fNome', ficha.nome); preencher('fCpf', ficha.cpf); preencher('fCel', ficha.cel); preencher('fEmail', ficha.email);
  preencher('fPlaca', ficha.placa); preencher('fAno', ficha.ano); preencher('fModelo', ficha.modelo);
  document.getElementById('fSeguradora').value = ficha.seguradora;
  preencher('fIndicacao', ficha.indicacao || '');
  irPara(3);
}

const ACOES = {
  'revisar e pagar': () => (ficha.nome ? levarParaContratacao() : iniciarContratacao()),
  'corrigir meus dados': () => { delete ficha.franquia; iniciarContratacao(); },
  'quanto eu pago?': () => { aguardandoValor = true; responder('Me diga o valor da franquia que está na sua apólice (por exemplo: 5000) que eu calculo na hora.'); },
  'quero contratar': iniciarContratacao,
  'o que nao cobre?': () => ASSUNTOS.find((a) => a.chave.test('nao cobre')).resp(),
  'abrir o portal para acionar': () => { fecharChat(); abrirPortal(); trocarAba('acionar'); },
  'ver o regulamento': () => document.querySelector('[data-regulamento]').click(),
  'quero ser corretor': () => { fecharChat(); document.getElementById('corretorCadastrar').click(); },
  'ver o portal do corretor': () => { fecharChat(); abrirCorretor(); },
  'voltar ao inicio': () => responder('Em que mais posso ajudar?', PRINCIPAIS),
};

function receber(texto) {
  const t = texto.trim();
  if (!t) return;
  bolha(t, 'eu');
  opcoes(null);
  const n = normalizar(t);
  if (ACOES[n] && conversa === null) { ACOES[n](); return; }
  if (conversa !== null) { seguirContratacao(t); return; }
  if (aguardandoValor && numeroDe(t)) { precoPara(numeroDe(t)); return; }
  const assunto = ASSUNTOS.find((a) => a.chave.test(n));
  if (assunto) { assunto.resp(n); return; }
  if (numeroDe(t) >= 500) { precoPara(numeroDe(t)); return; }
  responder('Hum, essa eu não entendi bem. Posso te ajudar com um destes assuntos, ou te passar para uma pessoa:', [...PRINCIPAIS.slice(0, 4), 'O que não cobre?', 'Falar com atendente']);
}

// Abrir e fechar
function abrirChat() {
  chat.hidden = false;
  chatBotao.setAttribute('aria-expanded', 'true');
  document.body.classList.add('chat-aberto');
  if (!chatLog.childElementCount) {
    responder(['Oi! Sou o assistente virtual da Seguro do Seguro e atendo 24 horas.', 'Posso tirar suas dúvidas ou fazer a contratação com você, passo a passo. Como posso ajudar?'], PRINCIPAIS);
  }
  setTimeout(() => chatEntrada.focus(), 50);
}
function fecharChat() {
  chat.hidden = true;
  chatBotao.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('chat-aberto');
}

chatBotao.addEventListener('click', () => (chat.hidden ? abrirChat() : fecharChat()));
document.getElementById('chatFechar').addEventListener('click', fecharChat);
document.querySelectorAll('[data-abrir-chat]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); abrirChat(); }));
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = chatEntrada.value;
  chatEntrada.value = '';
  receber(texto);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !chat.hidden) fecharChat(); });
