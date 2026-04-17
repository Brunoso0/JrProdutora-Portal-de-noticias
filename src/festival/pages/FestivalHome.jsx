import React from 'react';
import { Link } from 'react-router-dom';

const FestivalHome = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1F4A23] font-sans">
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold">Festival de Forró</h1>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link to="/festival-forro" className="hover:text-[#1F4A23]">Início</Link>
          <a href="/festival-forro#programacao" className="hover:text-[#1F4A23]">Programação</a>
          <Link to="/festival-forro/inscricao" className="text-[#008000] border-b-2 border-[#008000] pb-1">Inscrição</Link>
          <a href="/festival-forro#contato" className="hover:text-[#1F4A23]">Contato</a>
        </nav>
        <Link to="/login-candidato" className="bg-[#008000] text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition">
          Entrar
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center pt-24 pb-12 px-4 text-center">
        <h2 className="text-5xl font-extrabold text-[#2F2F2F] tracking-tight">
          Bem-vindo ao <span className="text-[#008000] italic">Festival</span>
        </h2>
        <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed">
          Esta é a página institucional principal do Festival de Forró. Navegue para a página de inscrição para registrar seu talento.
        </p>
        <div className="mt-8">
          <Link to="/festival-forro/inscricao" className="bg-[#008000] text-white px-8 py-3 rounded-md font-semibold text-lg shadow-lg hover:bg-green-700 transition-colors">
            Ir para Inscrição
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FestivalHome;
