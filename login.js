const SUPABASE_URL = 'https://groezaseypdbpgymgpvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb2V6YXNleXBkYnBneW1ncHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjkxNjYsImV4cCI6MjA4MTY0NTE2Nn0.5U5QeoGmZn_i9Y8POoUCkatBUAdSW-cjHRyfxpm_pyM';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Redireciona para o painel se já estiver logado
    if (localStorage.getItem('user_session')) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('login-form');
    const toggleBtn = document.getElementById('toggle-btn');
    const registerFields = document.getElementById('register-fields');
    const nomeInput = document.getElementById('nome');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');

    let isLogin = true;

    toggleBtn.addEventListener('click', () => {
        isLogin = !isLogin;
        errorMsg.style.display = 'none';
        
        if (isLogin) {
            registerFields.style.display = 'none';
            registerFields.style.opacity = '0';
            nomeInput.removeAttribute('required');
            formSubtitle.innerText = 'Faça login para continuar';
            submitBtn.innerHTML = '<span>Entrar</span><i class="ri-login-box-line"></i>';
            toggleBtn.innerHTML = 'Não tem uma conta? <strong>Cadastre-se</strong>';
        } else {
            registerFields.style.display = 'block';
            setTimeout(() => registerFields.style.opacity = '1', 10);
            nomeInput.setAttribute('required', 'true');
            formSubtitle.innerText = 'Crie sua conta para acessar';
            submitBtn.innerHTML = '<span>Cadastrar</span><i class="ri-user-add-line"></i>';
            toggleBtn.innerHTML = 'Já tem uma conta? <strong>Faça Login</strong>';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            submitBtn.style.opacity = '0.7';
            submitBtn.style.pointerEvents = 'none';
            submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i><span>Aguarde...</span>';

            if (isLogin) {
                // Fazer Login na tabela profiles
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('email', email)
                    .eq('password', password)
                    .single();

                let userData = data;

                if (error || !userData) {
                    // Fallback para contas pré-definidas (mesmo se não estiverem no banco)
                    if (email === 'setur@admin.paraipaba.com' && password === '102023') {
                        userData = { nome_completo: 'Administrador SETUR', email: email };
                    } else if (email === 'val@colonia.paraipaba.com' && password === '1234') {
                        userData = { nome_completo: 'Val (Colônia)', email: email };
                    } else {
                        throw new Error('E-mail ou senha incorretos.');
                    }
                }

                // Salvar sessão e redirecionar
                localStorage.setItem('user_session', JSON.stringify(userData));
                window.location.href = 'index.html';

            } else {
                // Fazer Cadastro
                const nome_completo = nomeInput.value.trim();

                // Verificar se email já existe
                const { data: existingUser } = await supabaseClient
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();

                if (existingUser) {
                    throw new Error('Este e-mail já está em uso.');
                }

                // Inserir novo usuário
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .insert([{ nome_completo, email, password }])
                    .select()
                    .single();

                if (error) {
                    console.error("Erro no cadastro:", error);
                    throw new Error('Erro ao criar conta. Tente novamente.');
                }

                // Login automático e redirecionar
                localStorage.setItem('user_session', JSON.stringify(data));
                window.location.href = 'index.html';
            }
        } catch (err) {
            errorMsg.innerText = err.message;
            errorMsg.style.display = 'block';
            
            // Restaura o botão
            if (isLogin) {
                submitBtn.innerHTML = '<span>Entrar</span><i class="ri-login-box-line"></i>';
            } else {
                submitBtn.innerHTML = '<span>Cadastrar</span><i class="ri-user-add-line"></i>';
            }
        } finally {
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'auto';
        }
    });
});
