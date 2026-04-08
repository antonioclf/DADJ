
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center size-24 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-primary/20 mb-4 overflow-hidden p-2">
                        <img src="/logo.png" alt="Logo DADJ" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                        DIRETÓRIO ACADÊMICO<br />DOIS DE JULHO
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Sistema de Gestão - CBMMG/ABM</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold dark:text-white">Bem-vindo de volta!</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Entre com suas credenciais para acessar o portal.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            icon="mail"
                            placeholder="exemplo@email.com"
                            value={email}
                            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                            required
                        />
                        <Input
                            label="Senha"
                            type="password"
                            icon="lock"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                            required
                        />

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full mt-2"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar no Sistema'}
                        </Button>
                    </form>

                    <div className="pt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => (window as any).navigate?.('price_list' as any)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                            >
                                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform text-lg">label</span>
                                <span className="text-[8px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 text-center">Preços</span>
                            </button>
                            <button
                                onClick={() => (window as any).navigate?.('inventory_consultation' as any)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                            >
                                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform text-lg">inventory_2</span>
                                <span className="text-[8px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 text-center">Estoque</span>
                            </button>
                            <button
                                onClick={() => (window as any).navigate?.('payment_lookup' as any)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-amber-500/20 hover:bg-white dark:hover:bg-slate-700 transition-all group"
                            >
                                <span className="material-symbols-outlined text-amber-500 group-hover:scale-110 transition-transform text-lg">find_in_page</span>
                                <span className="text-[8px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 text-center">Pendências</span>
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold text-center">
                            Acesso público para consultas básicas
                        </p>
                    </div>
                </div>

                <footer className="text-center pb-8">
                    <p className="text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] font-bold">
                        Portal Administrativo • v1.0
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Login;
