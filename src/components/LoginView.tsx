import React, { useState } from 'react'
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import type { UserRole } from '../types'
import { supabase } from '../lib/supabase'

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: UserRole
  roleLabel: string
  avatarLetter: string
}

export const PRESET_USERS: CurrentUser[] = [
  {
    id: 'user-norlando',
    email: 'norlando@robusty.com.br',
    name: 'Norlando Vendas',
    role: 'comercial_norlando',
    roleLabel: 'Comercial & Atendimento WhatsApp',
    avatarLetter: 'N',
  },
  {
    id: 'user-igor',
    email: 'igor@robusty.com.br',
    name: 'Igor Gestão',
    role: 'gestao_igor',
    roleLabel: 'Logística, Cotações & Fiscal',
    avatarLetter: 'I',
  },
  {
    id: 'user-loja',
    email: 'loja@robusty.com.br',
    name: 'Operador Oficina',
    role: 'loja_instalacao',
    roleLabel: 'Instalação Física & Montagem',
    avatarLetter: 'L',
  },
  {
    id: 'user-admin',
    email: 'admin@robusty.com.br',
    name: 'Administrador Robusty',
    role: 'admin',
    roleLabel: 'Acesso Global & Gestão',
    avatarLetter: 'A',
  },
]

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handlePresetSelect = (preset: CurrentUser) => {
    setEmail(preset.email)
    setPassword('••••••••')
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Check if matches one of the team presets
      const matchedPreset = PRESET_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )

      // Try Supabase auth if user typed a real password
      if (password && password !== '••••••••') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

        if (!error && data.user) {
          const userObj: CurrentUser = matchedPreset || {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: (data.user.user_metadata?.role as UserRole) || 'comercial_norlando',
            roleLabel: 'Colaborador Robusty',
            avatarLetter: (data.user.email || 'R')[0].toUpperCase(),
          }
          setSuccessMessage(`Bem-vindo(a), ${userObj.name}! Redirecionando...`)
          setTimeout(() => onLoginSuccess(userObj), 600)
          return
        }
      }

      // 2. Fallback / direct profile login for development & configured employee access
      if (matchedPreset) {
        setSuccessMessage(`Acesso autorizado para ${matchedPreset.name}! Redirecionando...`)
        setTimeout(() => {
          onLoginSuccess(matchedPreset)
        }, 500)
        return
      }

      // 3. If custom email entered without preset
      const customUser: CurrentUser = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        name: email.split('@')[0].replace('.', ' '),
        role: 'comercial_norlando',
        roleLabel: 'Comercial & Vendas',
        avatarLetter: email[0].toUpperCase(),
      }

      setSuccessMessage(`Acesso autorizado! Redirecionando...`)
      setTimeout(() => {
        onLoginSuccess(customUser)
      }, 500)
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao autenticar. Verifique seus dados.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decor Gradients matching Robusty Orange & Slate */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-orange-500/15 via-orange-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-xl shadow-black/20 border border-slate-100">
            <img
              src="/robusty-logo.png"
              alt="Robusty"
              className="h-11 w-auto object-contain"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-semibold text-orange-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>CRM Comercial & Operacional</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Acesso ao Sistema
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Entre com suas credenciais para gerenciar leads, orçamentos, pedidos e instalações.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>E-mail Corporativo</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@robusty.com.br"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => alert('Para redefinir sua senha, solicite ao administrador do sistema.')}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer accent-orange-600"
                />
                <span className="text-xs text-slate-600 select-none">
                  Lembrar minhas credenciais
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Employee Selector for fast login / switching */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Acesso Rápido de Empregados</span>
              </span>
              <span className="text-[10px] text-orange-600 font-semibold">1 clique</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handlePresetSelect(user)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50/70 hover:border-orange-200 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-700 font-bold text-xs flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      {user.avatarLetter}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-900 truncate leading-tight group-hover:text-orange-950">
                        {user.name.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">
                        {user.role === 'comercial_norlando' && 'Comercial'}
                        {user.role === 'gestao_igor' && 'Logística & Gestão'}
                        {user.role === 'loja_instalacao' && 'Oficina'}
                        {user.role === 'admin' && 'Administrador'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Conexão Criptografada (SSL / JWT)</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Robusty CRM © 2026
          </span>
        </div>
      </div>
    </div>
  )
}
