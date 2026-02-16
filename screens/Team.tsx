
import React, { useState } from 'react';
import { TeamMember } from '../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Header from '../ui/Header';
import Modal from '../ui/Modal';

interface TeamProps {
    onBack: () => void;
    team: TeamMember[];
    error?: string | null;
    onAdd: (member: Partial<TeamMember>) => void;
    onDelete: (id: string) => void;
    onSeed?: () => void;
}

const Team: React.FC<TeamProps> = ({ onBack, team, error, onAdd, onDelete, onSeed }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('Vendedor');

    const handleAdd = () => {
        if (newName) {
            onAdd({ name: newName, role: newRole, active: true });
            setNewName('');
            setIsModalOpen(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen">
            <Header title="Gerenciar Equipe" subtitle="Colaboradores do Portal" onBack={onBack} />

            <main className="px-4 py-6 pb-32 space-y-4">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold text-center">
                        <span className="material-symbols-outlined block text-xl mb-1">warning</span>
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Membros Ativos</h2>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total: {team.length}</span>
                </div>

                <div className="space-y-3">
                    {team.map(member => (
                        <div key={member.id} className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-primary/30 transition-all group relative overflow-hidden">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 text-primary font-bold">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-[#111318] dark:text-white text-sm">{member.name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{member.role}</p>
                            </div>
                            <button
                                onClick={() => onDelete(member.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    ))}

                    {team.length === 0 && (
                        <div className="py-20 text-center opacity-70 text-gray-500 space-y-4">
                            <span className="material-symbols-outlined text-5xl mb-2 text-primary/30">groups</span>
                            <p className="text-sm font-medium">Nenhum membro cadastrado</p>
                            {onSeed && (
                                <button
                                    onClick={onSeed}
                                    className="bg-primary/10 text-primary px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                                >
                                    Carregar Vendedores Oficiais
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
                <Button onClick={() => setIsModalOpen(true)} className="w-full">
                    <span className="material-symbols-outlined">person_add</span>
                    Adicionar Membro
                </Button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Colaborador"
            >
                <div className="space-y-4">
                    <Input
                        label="Nome Completo"
                        placeholder="Ex: Maria Souza"
                        value={newName}
                        onChange={(e) => setNewName((e.target as HTMLInputElement).value)}
                    />
                    <Input
                        label="Cargo / Função"
                        as="select"
                        value={newRole}
                        onChange={(e) => setNewRole((e.target as HTMLSelectElement).value)}
                    >
                        <option value="Vendedor">Vendedor</option>
                        <option value="Gerente">Gerente</option>
                        <option value="Suporte">Suporte</option>
                    </Input>
                    <Button onClick={handleAdd} className="w-full mt-4">
                        Confirmar Cadastro
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Team;
