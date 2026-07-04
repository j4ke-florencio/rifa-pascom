import { onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { dbRef } from "./firebase-config.js";

let totalNumeros = 540;
let precoNumero = 10;
let vendas = {};
let numeroEscolhidoNaRoleta = null;

const canvas = document.getElementById('canvas-arena');
const ctx = canvas.getContext('2d');
let bolinhasArena = [];
let animacaoAtiva = true;
let sorteioEmAndamento = false;
let urlWhatsAppGerada = "";
let textoGolTemporario = false;
let bolaCinematografica = null;

// 🌎 CARREGAMENTO VETORIAL DAS BANDEIRAS PARA DENTRO DO CANVAS
const imgBrasil = new Image();
imgBrasil.src = "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/br.svg";
const imgNoruega = new Image();
imgNoruega.src = "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/no.svg";

const configVendedoras = {
    "Jakeline": { pix: "00020126950014BR.GOV.BCB.PIX01362155cf3e-9e9e-4381-b751-0e3078cfb9200233Rifa PASCOM Obrigada! Paz e bem )5204000053039865802BR5925Jakeline Florencio dos Sa6009SAO PAULO62140510ZSEdd56xpE6304A8F4", pathQrCode: "qrcode.jpeg", foneWhatsApp: "5592985993444" },
    "Singridy": { pix: "Chave_Pix_Aqui", pathQrCode: "qr_singridy.jpeg", foneWhatsApp: "5592999999999" },
    "Rayssa": { pix: "Chave_Pix_Aqui", pathQrCode: "qr_rayssa.jpeg", foneWhatsApp: "5592999999999" },
    "Ana": { pix: "Chave_Pix_Aqui", pathQrCode: "qr_ana.jpeg", foneWhatsApp: "5592999999999" },
    "Isa": { pix: "Chave_Pix_Aqui", pathQrCode: "qr_isa.jpeg", foneWhatsApp: "5592999999999" }
};

const params = new URLSearchParams(window.location.search);
let vendedoraAtual = params.get('v') || "Jakeline";
vendedoraAtual = vendedoraAtual.charAt(0).toUpperCase() + vendedoraAtual.slice(1).toLowerCase();
if (!configVendedoras[vendedoraAtual]) vendedoraAtual = "Jakeline";

// CORREÇÃO DA MÁSCARA: Permite apagar tudo livremente com Backspace
const inputFone = document.getElementById('modal-cliente-fone');
inputFone.addEventListener('keydown', (e) => {
    // Se pressionar Backspace e tiver caracteres especiais adjacentes, ajuda a limpar
    if (e.key === 'Backspace') {
        let value = e.target.value;
        if (value.endsWith(') ') || value.endsWith('-') || value === '(') {
            e.target.value = value.slice(0, -1);
        }
    }
});

inputFone.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length === 0) {
        e.target.value = "";
    } else if (value.length <= 2) {
        e.target.value = `(${value}`;
    } else if (value.length <= 7) {
        e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else {
        e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    }
});

onValue(dbRef, (snapshot) => {
    const dados = snapshot.val();
    if (dados) {
        totalNumeros = dados.totalNumeros || 540;
        precoNumero = dados.precoNumero || 10;
        vendas = dados.vendas || {};
        renderizarGridPublico();
        inicializarBolinhasFisicas();
    }
});

function renderizarGridPublico() {
    const grid = document.getElementById('grid-comprador');
    grid.innerHTML = '';
    for (let i = 1; i <= totalNumeros; i++) {
        const cell = document.createElement('div');
        cell.textContent = i;
        if (vendas[i]) {
            if (vendas[i].status === "pago" || vendas[i].pago === true) cell.className = 'bolinha-cell bolinha-pago';
            else { cell.className = 'bolinha-cell bolinha-pendente'; cell.onclick = () => abrirModalReserva(i); }
        } else { cell.className = 'bolinha-cell bolinha-disponivel'; cell.onclick = () => abrirModalReserva(i); }
        grid.appendChild(cell);
    }
}

class BolinhaFisica {
    constructor(numero, status, customX = null) {
        this.numero = numero; this.status = status; this.raio = 11; this.x = customX || canvas.width / 2;
        this.y = Math.random() * (canvas.height - 40) + 20; this.vx = (Math.random() - 0.5) * 5; this.vy = (Math.random() - 0.5) * 5;
    }
    desenhar() {
        ctx.beginPath(); let grad = ctx.createRadialGradient(this.x - 3, this.y - 3, 2, this.x, this.y, this.raio);
        if (this.status === 'pago') { grad.addColorStop(0, '#55efc4'); grad.addColorStop(1, '#27ae60'); }
        else if (this.status === 'pendente') { grad.addColorStop(0, '#ffeaa7'); grad.addColorStop(1, '#f39c12'); }
        else { grad.addColorStop(0, '#ff7675'); grad.addColorStop(1, '#d63031'); }
        ctx.fillStyle = grad; ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2); ctx.fill(); ctx.closePath();
        ctx.fillStyle = this.status === 'pendente' ? '#000' : '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.numero, this.x, this.y);
    }
    atualizar() {
        this.x += this.vx; this.y += this.vy;
        if (this.y - this.raio < 0 || this.y + this.raio > canvas.height) this.vy *= -1;
        if (this.x - this.raio < 15) { if (this.y > 60 && this.y < 140) { this.vx *= -1; this.x = 15 + this.raio; } else this.vx *= -1; }
        if (this.x + this.raio > canvas.width - 15) { if (this.y > 60 && this.y < 140) { this.vx *= -1; this.x = canvas.width - 15 - this.raio; } else this.vx *= -1; }
    }
}

function inicializarBolinhasFisicas() {
    if (sorteioEmAndamento || bolaCinematografica) return; bolinhasArena = []; let mistas = [];
    for (let i = 1; i <= totalNumeros; i++) {
        let st = 'livre'; if (vendas[i]) st = (vendas[i].status === 'pago' || vendas[i].pago === true) ? 'pago' : 'pendente';
        mistas.push({ n: i, st: st });
    }
    mistas.sort(() => Math.random() - 0.5); mistas.slice(0, 20).forEach(item => { bolinhasArena.push(new BolinhaFisica(item.n, item.st)); });
}

function desenharCampoERedes() {
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 35, 0, Math.PI * 2); ctx.stroke();
    
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(0, 60, 15, 80); ctx.strokeStyle = "#fff"; ctx.strokeRect(0, 60, 15, 80);
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(canvas.width - 15, 60, 15, 80); ctx.strokeStyle = "#f1c40f"; ctx.strokeRect(canvas.width - 15, 60, 15, 80);

    // 🇧🇷 DESENHA AS BANDEIRAS OFICIAIS DENTRO DO CAMPO DO CANVAS
    try {
        ctx.drawImage(imgBrasil, 22, 12, 22, 15);
        ctx.drawImage(imgNoruega, canvas.width - 44, 12, 22, 15);
    } catch(e) {}

    ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "left"; ctx.fillText("BRASIL", 49, 23);
    ctx.textAlign = "right"; ctx.fillText("NORUEGA", canvas.width - 50, 23);

    if (textoGolTemporario) { ctx.fillStyle = "#f1c40f"; ctx.font = "black 24px sans-serif"; ctx.textAlign = "center"; ctx.fillText("⚽ GOLAÇO DE VINI JR!!", canvas.width / 2, canvas.height / 2 + 8); }
}

function loopArena() {
    if (!animacaoAtiva) return; ctx.clearRect(0, 0, canvas.width, canvas.height); desenharCampoERedes();
    if (bolaCinematografica) {
        bolaCinematografica.x += 6; if (bolaCinematografica.y < 80) bolaCinematografica.y += 2; if (bolaCinematografica.y > 120) bolaCinematografica.y -= 2;
        bolaCinematografica.desenhar();
        if (bolaCinematografica.x + bolaCinematografica.raio >= canvas.width - 14) { textoGolTemporario = true; let numSalvo = bolaCinematografica.numero; bolaCinematografica = null; setTimeout(() => { textoGolTemporario = false; abrirModalReserva(numSalvo); }, 1200); }
    } else { bolinhasArena.forEach(b => { b.atualizar(); b.desenhar(); }); }
    requestAnimationFrame(loopArena);
}
requestAnimationFrame(loopArena);

document.getElementById('btn-sortear-copa').onclick = function() {
    if (sorteioEmAndamento || bolaCinematografica) return; let disponiveis = [];
    for (let i = 1; i <= totalNumeros; i++) { if (!vendas[i]) disponiveis.push(i); }
    if (disponiveis.length === 0) { alert("Todos os gols marcados!"); return; }
    sorteioEmAndamento = true; bolinhasArena.forEach(b => { b.vx *= 3; b.vy *= 3; });
    setTimeout(() => { let sorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)]; sorteioEmAndamento = false; bolinhasArena = []; bolaCinematografica = new BolinhaFisica(sorteado, 'pendente', 20); }, 1200);
};

function abrirModalReserva(numero) {
    numeroEscolhidoNaRoleta = numero;
    document.getElementById('modal-num-val').textContent = `Gol no Número: ${numero}`;
    document.getElementById('modal-cliente-nome').value = '';
    document.getElementById('modal-cliente-fone').value = '';
    document.getElementById('label-vendedora-nome').textContent = vendedoraAtual;
    document.getElementById('elemento-qr-code').src = configVendedoras[vendedoraAtual].pathQrCode;

    const btnCopiarInterno = document.getElementById('btn-copiar-pix-auto');
    btnCopiarInterno.textContent = "📋 Copiar Código Pix Copia e Cola";
    btnCopiarInterno.onclick = function() {
        navigator.clipboard.writeText(configVendedoras[vendedoraAtual].pix);
        btnCopiarInterno.textContent = "✅ Código Copiado com Sucesso!";
        setTimeout(() => { btnCopiarInterno.textContent = "📋 Copiar Código Pix Copia e Cola"; }, 2500);
    };
    document.getElementById('modal-reserva').classList.add('ativo');
}

// 🟥 DISPARO DOS ERROS CUSTOMIZADOS SEM O ALERT() NATIVO
function dispararErroJuiz(mensagem) {
    document.getElementById('texto-erro-juiz').textContent = mensagem;
    document.getElementById('modal-erro-validacao').classList.add('ativo');
}

document.getElementById('btn-salvar-reserva').onclick = function() {
    const nome = document.getElementById('modal-cliente-nome').value.trim();
    const fone = document.getElementById('modal-cliente-fone').value.trim();

    if (!nome) { dispararErroJuiz('🏃‍♂️ O JUIZ MARCOU IMPEDIMENTO! Preencha o seu nome completo no lance para validar o gol!'); return; }
    if (fone.length < 14) { dispararErroJuiz('📞 CARTÃO AMARELO! Insira um número de WhatsApp válido com DDD para o VAR confirmar o seu lance!'); return; }

    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    vendas[numeroEscolhidoNaRoleta] = { nome: nome, fone: fone, vendedora: vendedoraAtual, data: dataHoraStr, status: "pendente" };
    
    set(dbRef, { totalNumeros, precoNumero, vendas }).then(() => {
        document.getElementById('modal-reserva').classList.remove('ativo');
        const textoComp = `🚨 *ALERTA DO VAR - EVITE A ANULAÇÃO DO GOL!*\n\n🖥️ *Lance:* O gol número *${numeroEscolhidoNaRoleta}* está sob checagem por impedimento!\n\n⚽ *Artilheiro(a):* ${nome}\n📞 *Contato:* ${fone}\n💵 *Valor:* R$ ${precoNumero.toFixed(2).replace('.', ',')}\n\n🙋‍♀️ *Vendedora:* ${vendedoraAtual}\n\n*Estou enviando o comprovante imediatamente para o juiz VALIDAR O MEU GOL!* 🇧🇷🏃‍♂️`;
        urlWhatsAppGerada = `https://wa.me/${configVendedoras[vendedoraAtual].foneWhatsApp}?text=${encodeURIComponent(textoComp)}`;
        document.getElementById('btn-vendedora-nome').textContent = vendedoraAtual;
        document.getElementById('modal-comprovante-cliente').classList.add('ativo');
    });
};

document.getElementById('btn-enviar-wa-direto').onclick = function() {
    if (urlWhatsAppGerada) { window.open(urlWhatsAppGerada, '_blank'); document.getElementById('modal-comprovante-cliente').classList.remove('ativo'); }
};