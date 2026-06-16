const SUPABASE_URL = 'https://groezaseypdbpgymgpvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb2V6YXNleXBkYnBneW1ncHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjkxNjYsImV4cCI6MjA4MTY0NTE2Nn0.5U5QeoGmZn_i9Y8POoUCkatBUAdSW-cjHRyfxpm_pyM';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Tabs Logic ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
        });
    });

    // ---- Utils ----
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    // ==========================================
    // CESTAS LOGIC
    // ==========================================
    const formCestas = document.getElementById('form-cestas');
    const tableCestas = document.querySelector('#table-cestas tbody');
    let cestasData = [];

    async function fetchCestas() {
        const { data, error } = await supabaseClient.from('cestas').select('*').order('created_at', { ascending: false });
        if (!error) {
            cestasData = data;
            renderCestas();
        }
    }

    formCestas.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const data_pag = document.getElementById('data-pag').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const qtd_cestas = parseInt(document.getElementById('qtd-cestas').value);

        await supabaseClient.from('cestas').insert([{ nome, data_pag, valor, qtd_cestas }]);
        
        formCestas.reset();
        document.getElementById('nome').focus();
        fetchCestas();
    });

    function renderCestas() {
        tableCestas.innerHTML = '';
        if (cestasData.length === 0) {
            tableCestas.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="ri-inbox-line"></i>Nenhuma cesta registrada.</td></tr>';
            return;
        }

        cestasData.forEach(cesta => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${cesta.nome}</strong></td>
                <td>${formatDate(cesta.data_pag)}</td>
                <td class="value-highlight">${formatCurrency(cesta.valor)}</td>
                <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px;">${cesta.qtd_cestas}</span></td>
                <td class="no-print">
                    <button class="btn-icon" onclick="deleteCesta(${cesta.id})" title="Excluir">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </td>
            `;
            tableCestas.appendChild(tr);
        });
    }

    window.deleteCesta = async (id) => {
        await supabaseClient.from('cestas').delete().eq('id', id);
        fetchCestas();
    };

    // ==========================================
    // PRESTAÇÃO DE CONTAS (DESPESAS) LOGIC
    // ==========================================
    const formPrestacao = document.getElementById('form-prestacao');
    const tablePrestacao = document.querySelector('#table-prestacao tbody');
    const filterFornecedor = document.getElementById('filter-fornecedor');
    
    const inputQtd = document.getElementById('qtd');
    const inputValorUnitario = document.getElementById('valor-unitario');
    const inputTotal = document.getElementById('total');
    
    let prestacaoData = [];

    async function fetchPrestacao() {
        const { data, error } = await supabaseClient.from('despesas').select('*').order('created_at', { ascending: false });
        if (!error) {
            prestacaoData = data;
            renderPrestacao();
        }
    }

    function calculateTotal() {
        const qtd = parseFloat(inputQtd.value) || 0;
        const valor = parseFloat(inputValorUnitario.value) || 0;
        inputTotal.value = (qtd * valor).toFixed(2);
    }

    inputQtd.addEventListener('input', calculateTotal);
    inputValorUnitario.addEventListener('input', calculateTotal);

    formPrestacao.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fornecedor = document.getElementById('fornecedor').value.trim();
        const produto = document.getElementById('produto').value.trim();
        const qtd = parseFloat(inputQtd.value);
        const unidade = document.getElementById('unidade').value.trim();
        const valor = parseFloat(inputValorUnitario.value);
        const total = parseFloat(inputTotal.value);

        await supabaseClient.from('despesas').insert([{ fornecedor, produto, qtd, unidade, valor, total }]);

        formPrestacao.reset();
        inputTotal.value = '';
        document.getElementById('fornecedor').focus();
        fetchPrestacao();
    });

    filterFornecedor.addEventListener('input', renderPrestacao);

    function renderPrestacao() {
        tablePrestacao.innerHTML = '';
        
        const filter = filterFornecedor.value.toLowerCase();
        const filteredData = prestacaoData.filter(p => p.fornecedor.toLowerCase().includes(filter));

        if (filteredData.length === 0) {
            tablePrestacao.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="ri-search-line"></i>Nenhum registro encontrado.</td></tr>';
            return;
        }

        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.fornecedor}</strong></td>
                <td>${item.produto}</td>
                <td><span style="color: var(--text-muted);">${item.qtd} ${item.unidade}</span></td>
                <td>${formatCurrency(item.valor)}</td>
                <td class="value-highlight">${formatCurrency(item.total)}</td>
                <td class="no-print">
                    <button class="btn-icon" onclick="deletePrestacao(${item.id})" title="Excluir">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </td>
            `;
            tablePrestacao.appendChild(tr);
        });
    }

    window.deletePrestacao = async (id) => {
        await supabaseClient.from('despesas').delete().eq('id', id);
        fetchPrestacao();
    };

    // ==========================================
    // EMBARCAÇÕES LOGIC
    // ==========================================
    const formEmbarcacoes = document.getElementById('form-embarcacoes');
    const tableEmbarcacoes = document.querySelector('#table-embarcacoes tbody');
    let currentEmbarcacaoFilter = 'Todas';
    let embarcacoesData = [];
    let editingEmbarcacaoId = null;

    async function fetchEmbarcacoes() {
        const { data, error } = await supabaseClient.from('embarcacoes').select('*');
        if (!error) {
            embarcacoesData = data;
            // Ordenar por tamanho e numeração
            const sizeOrder = { 'Pequena': 1, 'Média': 2, 'Grande': 3 };
            embarcacoesData.sort((a, b) => {
                const orderA = sizeOrder[a.tamanho] || 99;
                const orderB = sizeOrder[b.tamanho] || 99;
                if (orderA !== orderB) return orderA - orderB;
                return a.num_embarcacao - b.num_embarcacao;
            });
            renderEmbarcacoes();
        }
    }

    formEmbarcacoes.addEventListener('submit', async (e) => {
        e.preventDefault();

        const num_embarcacao = parseInt(document.getElementById('num-embarcacao').value);
        const tamanho = document.getElementById('tamanho-embarcacao').value;
        const nome_barco = document.getElementById('nome-embarcacao').value.trim();
        const proprietario = document.getElementById('proprietario-embarcacao').value.trim();
        const empresa = document.getElementById('empresa-embarcacao').value.trim();
        const tecido_entregue = document.getElementById('tecido-embarcacao').value.trim();
        const data_entrega_tecido = document.getElementById('data-entrega-tecido').value;

        if (editingEmbarcacaoId) {
            await supabaseClient.from('embarcacoes').update({ num_embarcacao, tamanho, nome_barco, proprietario, empresa, tecido_entregue, data_entrega_tecido: data_entrega_tecido || null }).eq('id', editingEmbarcacaoId);
            editingEmbarcacaoId = null;
            document.getElementById('btn-cancelar-edicao').style.display = 'none';
        } else {
            await supabaseClient.from('embarcacoes').insert([{ num_embarcacao, tamanho, nome_barco, proprietario, empresa, tecido_entregue, data_entrega_tecido: data_entrega_tecido || null }]);
        }

        formEmbarcacoes.reset();
        document.getElementById('num-embarcacao').focus();
        fetchEmbarcacoes();
    });

    const boatFilters = document.querySelectorAll('.boat-filter');
    boatFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            boatFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentEmbarcacaoFilter = btn.getAttribute('data-size');
            renderEmbarcacoes();
        });
    });

    function renderEmbarcacoes() {
        tableEmbarcacoes.innerHTML = '';
        
        const countTodas = embarcacoesData.length;
        const countPequenas = embarcacoesData.filter(e => e.tamanho === 'Pequena').length;
        const countMedias = embarcacoesData.filter(e => e.tamanho === 'Média').length;
        const countGrandes = embarcacoesData.filter(e => e.tamanho === 'Grande').length;

        document.getElementById('count-todas').innerText = countTodas;
        document.getElementById('count-pequenas').innerText = countPequenas;
        document.getElementById('count-medias').innerText = countMedias;
        document.getElementById('count-grandes').innerText = countGrandes;

        const filteredData = currentEmbarcacaoFilter === 'Todas' ? embarcacoesData : embarcacoesData.filter(e => e.tamanho === currentEmbarcacaoFilter);

        if (filteredData.length === 0) {
            tableEmbarcacoes.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="ri-ship-line"></i>Nenhuma embarcação cadastrada.</td></tr>';
            return;
        }

        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; font-weight: bold;">${item.num_embarcacao}</span></td>
                <td><strong>${item.nome_barco}</strong></td>
                <td>${item.proprietario || '-'}</td>
                <td>${item.empresa || '-'}</td>
                <td>${item.tecido_entregue || '-'}</td>
                <td>${formatDate(item.data_entrega_tecido) || '-'}</td>
                <td><span class="tag-size ${item.tamanho === 'Pequena' ? 'tag-pequena' : item.tamanho === 'Média' ? 'tag-media' : item.tamanho === 'Grande' ? 'tag-grande' : ''}">${item.tamanho}</span></td>
                <td class="no-print">
                    <button class="btn-icon" onclick="deleteEmbarcacao(${item.id})" title="Excluir">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <button class="btn-icon" onclick="editEmbarcacao(${item.id})" title="Editar" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); border-color: rgba(59, 130, 246, 0.2);">
                        <i class="ri-edit-line"></i>
                    </button>
                </td>
            `;
            tableEmbarcacoes.appendChild(tr);
        });
    }

    window.editEmbarcacao = (id) => {
        const item = embarcacoesData.find(e => e.id === id);
        if(!item) return;
        editingEmbarcacaoId = item.id;
        document.getElementById('num-embarcacao').value = item.num_embarcacao;
        document.getElementById('tamanho-embarcacao').value = item.tamanho || 'Pequena';
        document.getElementById('nome-embarcacao').value = item.nome_barco || '';
        document.getElementById('proprietario-embarcacao').value = item.proprietario || '';
        document.getElementById('empresa-embarcacao').value = item.empresa || '';
        document.getElementById('tecido-embarcacao').value = item.tecido_entregue || '';
        document.getElementById('data-entrega-tecido').value = item.data_entrega_tecido || '';
        document.getElementById('btn-cancelar-edicao').style.display = 'inline-flex';
        document.getElementById('num-embarcacao').focus();
    };

    document.getElementById('btn-cancelar-edicao').addEventListener('click', () => {
        editingEmbarcacaoId = null;
        formEmbarcacoes.reset();
        document.getElementById('btn-cancelar-edicao').style.display = 'none';
    });

    window.deleteEmbarcacao = async (id) => {
        await supabaseClient.from('embarcacoes').delete().eq('id', id);
        fetchEmbarcacoes();
    };

    // ==========================================
    // PATROCINADORES LOGIC
    // ==========================================
    const formPatrocinadores = document.getElementById('form-patrocinadores');
    const tablePatrocinadores = document.querySelector('#table-patrocinadores tbody');
    let patrocinadoresData = [];

    async function fetchPatrocinadores() {
        const { data, error } = await supabaseClient.from('patrocinadores').select('*').order('created_at', { ascending: false });
        if (!error) {
            patrocinadoresData = data;
            renderPatrocinadores();
        }
    }

    formPatrocinadores.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-patrocinador').value.trim();
        const tipo = document.getElementById('tipo-patrocinio').value;
        const valor = parseFloat(document.getElementById('valor-patrocinio').value);
        
        await supabaseClient.from('patrocinadores').insert([{ nome, tipo, valor }]);
        
        formPatrocinadores.reset();
        document.getElementById('nome-patrocinador').focus();
        fetchPatrocinadores();
    });

    function renderPatrocinadores() {
        tablePatrocinadores.innerHTML = '';
        if (patrocinadoresData.length === 0) {
            tablePatrocinadores.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="ri-medal-line"></i>Nenhum patrocinador registrado.</td></tr>';
            return;
        }

        patrocinadoresData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.nome}</strong></td>
                <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px;">${item.tipo}</span></td>
                <td class="value-highlight">${formatCurrency(item.valor)}</td>
                <td class="no-print">
                    <button class="btn-icon" onclick="deletePatrocinador(${item.id})" title="Excluir">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </td>
            `;
            tablePatrocinadores.appendChild(tr);
        });
    }

    window.deletePatrocinador = async (id) => {
        await supabaseClient.from('patrocinadores').delete().eq('id', id);
        fetchPatrocinadores();
    };

    // INIT FETCHES
    fetchCestas();
    fetchPrestacao();
    fetchEmbarcacoes();
    fetchPatrocinadores();
});
