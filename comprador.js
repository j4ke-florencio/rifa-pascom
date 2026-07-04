import { onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { dbRef } from "./firebase-config.js";

let totalNumeros = 540;
let precoNumero = 10;
let vendas = {};
let numeroEscolhidoNaRoleta = null;
let urlWhatsAppGerada = "";

const configVendedoras = {
    "Jakeline": { 
        pix: "00020126950014BR.GOV.BCB.PIX01362155cf3e-9e9e-4381-b751-0e3078cfb9200233Rifa PASCOM Obrigada! Paz e bem )5204000053039865802BR5925Jakeline Florencio dos Sa6009SAO PAULO62140510ZSEdd56xpE6304A8F4", 
        pathQrCode: "qrcode.jpeg", 
        foneWhatsApp: "5592985993444" 
    },
    "Singridy": { 
        pix: "00020126490014BR.GOV.BCB.PIX0127singridycarvalhoo@gmail.com5204000053039865802BR5925Singridy Carvalho Dos San6009Sao Paulo62290525REC6A4963CEA09504762404096304B3C6",
        pathQrCode: "qr_singridy.jpeg", 
        foneWhatsApp: "5592992201761" 
    },
    "Rayssa": { 
        pix: "00020126580014BR.GOV.BCB.PIX01365f8982b1-e174-4cae-93bf-49005824fac45204000053039865802BR5925Rayssa Kellen Sousa da Si6009SAO PAULO62140510vBbytiMKFP63040A91", 
        pathQrCode: "qr_rayssa.jpeg", 
        foneWhatsApp: "5592984040394" 
    },
    "Ana": { 
        pix: "00020126480014br.gov.bcb.pix0111054112232020211Ana_Beatriz5204000053039865802BR5925ANA_BEATRIZ_BEZERRA_VILAC6006MANAUS62290525Mj6IYwAoFMugUJOrLlFSLrS4B6304AF0C", 
        pathQrCode: "qr_ana.jpeg", 
        foneWhatsApp: "5592994977091" 
    }
};

const params = new URLSearchParams(window.location.search);
let vendedoraAtual = params.get('v');

function iniciarArenaParaVendedora(nomeVendedora) {
    vendedoraAtual = nomeVendedora.charAt(0).toUpperCase() + nomeVendedora.slice(1).toLowerCase();
    document.getElementById('wrapper-selecao').style.display = 'none';
    document.getElementById('conteudo-arena-jogo').style.display = 'block';
    
    onValue(dbRef, (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
            totalNumeros = dados.totalNumeros || 540;
            precoNumero = dados.precoNumero || 10;
            vendas = dados.vendas || {};
            renderizarGridPublico();
        }
    });
}

const vendedoraExiste = vendedoraAtual && configVendedoras[vendedoraAtual.charAt(0).toUpperCase() + vendedoraAtual.slice(1).toLowerCase()];

if (vendedoraExiste) {
    iniciarArenaParaVendedora(vendedoraAtual);
} else {
    document.getElementById('wrapper-selecao').style.setProperty('display', 'flex', 'important');    
    const containerBotoes = document.getElementById('lista-botoes-vendedoras');
    containerBotoes.innerHTML = ''; 

    Object.keys(configVendedoras).forEach(nome => {
        const btn = document.createElement('button');
        btn.textContent = nome;
        btn.style.cssText = "background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%); color: #ffffff; font-weight: 700; padding: 14px; border: none; border-radius: 14px; cursor: pointer; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-family: 'Segoe UI', sans-serif; width: 100%; margin-bottom: 4px;";
        
        btn.onmouseover = () => { 
            btn.style.background = '#eab308'; 
            btn.style.color = '#0c4a6e'; 
            btn.style.transform = 'translateY(-1px)'; 
            btn.style.boxShadow = '0 6px 15px rgba(234, 179, 8, 0.3)';
        };
        btn.onmouseout = () => { 
            btn.style.background = 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'; 
            btn.style.color = '#ffffff'; 
            btn.style.transform = 'translateY(0)'; 
            btn.style.boxShadow = '0 4px 10px rgba(2, 132, 199, 0.15)';
        };
        
        btn.onclick = () => iniciarArenaParaVendedora(nome);
        containerBotoes.appendChild(btn);
    });
}

const inputFone = document.getElementById('modal-cliente-fone');
inputFone.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length === 0) e.target.value = "";
    else if (value.length <= 2) e.target.value = `(${value}`;
    else if (value.length <= 7) e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    else e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
});

function renderizarGridPublico() {
    const grid = document.getElementById('grid-comprador');
    grid.innerHTML = '';
    
    for (let i = 1; i <= totalNumeros; i++) {
        const cell = document.createElement('div');
        cell.textContent = i;
        
        if (vendas[i]) {
            const statusBruto = vendas[i].status ? String(vendas[i].status).toLowerCase().trim() : '';
            if (statusBruto === 'pendente') {
                cell.className = 'bolinha-cell bolinha-pendente'; 
                cell.onclick = () => abrirModalReserva(i); 
            } else { 
                cell.className = 'bolinha-cell bolinha-pago';
            }
        } else { 
            cell.className = 'bolinha-cell bolinha-disponivel'; 
            cell.onclick = () => abrirModalReserva(i); 
        }
        grid.appendChild(cell);
    }
}

function abrirModalReserva(numero) {
    numeroEscolhidoNaRoleta = numero;
    document.getElementById('modal-num-val').textContent = `Número Escolhido: ${numero}`;
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

function dispararErroJuiz(mensagem) {
    document.getElementById('texto-erro-juiz').textContent = mensagem;
    document.getElementById('modal-erro-validacao').classList.add('ativo');
}

document.getElementById('btn-salvar-reserva').onclick = function() {
    const nome = document.getElementById('modal-cliente-nome').value.trim();
    const fone = document.getElementById('modal-cliente-fone').value.trim();

    if (!nome) { dispararErroJuiz('⚠️ Nome obrigatório! Por favor, preencha o seu nome completo para realizar a reserva.'); return; }
    if (fone.length < 14) { dispararErroJuiz('⚠️ WhatsApp inválido! Insira um número válido com DDD para podermos validar sua participação.'); return; }

    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    vendas[numeroEscolhidoNaRoleta] = { nome: nome, fone: fone, vendedora: vendedoraAtual, data: dataHoraStr, status: "pendente" };
    
    set(dbRef, { totalNumeros, precoNumero, vendas }).then(() => {
        document.getElementById('modal-reserva').classList.remove('ativo');
        const textoComp = `⛪ *RIFA SOLIDÁRIA PASCOM - SETOR MARIA MÃE DA IGREJA*\n\n📌 *Reserva Realizada:* Número *${numeroEscolhidoNaRoleta}*\n👤 *Comprador(a):* ${nome}\n📞 *Contato:* ${fone}\n💵 *Valor:* R$ ${precoNumero.toFixed(2).replace('.', ',')}\n🙋‍♀️ *Vendedora:* ${vendedoraAtual}\n\n*Estou enviando o comprovante Pix para validar a minha participação!* ❤️✨`;
        urlWhatsAppGerada = `https://wa.me/${configVendedoras[vendedoraAtual].foneWhatsApp}?text=${encodeURIComponent(textoComp)}`;
        document.getElementById('btn-vendedora-nome').textContent = vendedoraAtual;
        document.getElementById('modal-comprovante-cliente').classList.add('ativo');
    });
};

document.getElementById('btn-enviar-wa-direto').onclick = function() {
    if (urlWhatsAppGerada) { window.open(urlWhatsAppGerada, '_blank'); document.getElementById('modal-comprovante-cliente').classList.remove('ativo'); }
};

document.getElementById('btn-abrir-premios').onclick = () => { document.getElementById('modal-premios').style.display = 'flex'; };
document.getElementById('btn-fechar-premios').onclick = () => { document.getElementById('modal-premios').style.display = 'none'; };
document.getElementById('modal-premios').onclick = (e) => { if (e.target.id === 'modal-premios') document.getElementById('modal-premios').style.display = 'none'; };
document.getElementById('btn-x-premios').onclick = () => { document.getElementById('modal-premios').style.display = 'none'; };