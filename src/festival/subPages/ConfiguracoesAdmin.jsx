import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Camera,
  CheckCircle2,
  Clock3,
  CloudUpload,
  Lock,
  Mail,
  Shield,
  Smartphone,
  SunMedium,
  Moon,
  User,
  Palette,
  Save,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import '../styles/ConfiguracoesAdmin.css';

const DEFAULT_FORM = {
  name: 'Administrador',
  email: '',
  phone: '',
  role: 'Administrador do Festival',
  department: 'Coordenação geral',
  city: 'Não informado',
  bio: 'Responsável pela administração da área do festival.',
};

const DEFAULT_PREFERENCES = {
  theme: 'claro',
  language: 'pt-BR',
  compactMode: false,
  emailNotifications: true,
  sessionAlerts: true,
  dailySummary: true,
};

const DEFAULT_SECURITY = {
  twoFactor: true,
  loginAlerts: true,
  privateMode: false,
};

const safeParse = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const getAvatarFallback = (name) => {
  const cleaned = (name || 'Administrador').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || 'A';
  const second = parts[1]?.[0] || parts[0]?.[1] || '';

  return `${first}${second}`.toUpperCase();
};

const ConfiguracoesAdmin = ({ adminName }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [security, setSecurity] = useState(DEFAULT_SECURITY);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarData, setAvatarData] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');

  useEffect(() => {
    // Try to load from backend. Fallback to localStorage if request fails.
    const apiBase = process.env.API_FESTIVAL || process.env.REACT_APP_API_FESTIVAL || '';
    const token = localStorage.getItem('festivalAdminToken') || localStorage.getItem('token');

    if (!apiBase || !token) {
      const storedUser = safeParse(localStorage.getItem('festivalAdminUser')) || safeParse(localStorage.getItem('user')) || {};
      const storedPreferences = safeParse(localStorage.getItem('festivalAdminSettings')) || {};
      const storedSecurity = safeParse(localStorage.getItem('festivalAdminSecurity')) || {};

      const resolvedName = storedUser?.name || storedUser?.nome || adminName || DEFAULT_FORM.name;
      const resolvedEmail = storedUser?.email || '';

      setFormData({
        name: resolvedName,
        email: resolvedEmail,
        phone: storedUser?.phone || storedUser?.telefone || '',
        role: storedUser?.role || DEFAULT_FORM.role,
        department: storedUser?.department || DEFAULT_FORM.department,
        city: storedUser?.city || storedUser?.cidade || DEFAULT_FORM.city,
        bio: storedUser?.bio || DEFAULT_FORM.bio,
      });

      setPreferences((current) => ({
        ...current,
        ...storedPreferences,
      }));

      setSecurity((current) => ({
        ...current,
        ...storedSecurity,
      }));

      setAvatarData(storedUser?.avatar || storedUser?.avatarUrl || storedUser?.photoURL || '');
      return;
    }

    (async () => {
      try {
        const profileResp = await axios.get(`${apiBase}/api/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const user = profileResp.data?.user || {};
        const settings = profileResp.data?.settings || {};

        setFormData({
          name: user.name || user.nome || adminName || DEFAULT_FORM.name,
          email: user.email || '',
          phone: user.phone || user.telefone || '',
          role: user.role || DEFAULT_FORM.role,
          department: user.department || DEFAULT_FORM.department,
          city: user.city || user.cidade || DEFAULT_FORM.city,
          bio: user.bio || DEFAULT_FORM.bio
        });

        setAvatarData(user.profile_photo_url || user.avatar || user.photoURL || '');

        // Merge and normalize settings
        if (settings) {
          setPreferences((current) => ({
            ...current,
            theme: settings.theme === 'dark' ? 'escuro' : 'claro',
            language: settings.language || current.language,
            compactMode: Boolean(settings.compact_mode),
            emailNotifications: Boolean(settings.email_notifications),
            sessionAlerts: Boolean(settings.session_alerts),
            dailySummary: Boolean(settings.daily_summary)
          }));

          setSecurity((current) => ({
            ...current,
            twoFactor: Boolean(settings.two_factor_enabled),
            loginAlerts: Boolean(settings.login_alerts),
            privateMode: Boolean(settings.private_mode)
          }));
        }

        // persist locally for quick access
        localStorage.setItem('festivalAdminUser', JSON.stringify(user));
        localStorage.setItem('festivalAdminSettings', JSON.stringify(settings || {}));
      } catch (error) {
        // fallback to localStorage
        const storedUser = safeParse(localStorage.getItem('festivalAdminUser')) || safeParse(localStorage.getItem('user')) || {};
        const storedPreferences = safeParse(localStorage.getItem('festivalAdminSettings')) || {};
        const storedSecurity = safeParse(localStorage.getItem('festivalAdminSecurity')) || {};

        const resolvedName = storedUser?.name || storedUser?.nome || adminName || DEFAULT_FORM.name;
        const resolvedEmail = storedUser?.email || '';

        setFormData({
          name: resolvedName,
          email: resolvedEmail,
          phone: storedUser?.phone || storedUser?.telefone || '',
          role: storedUser?.role || DEFAULT_FORM.role,
          department: storedUser?.department || DEFAULT_FORM.department,
          city: storedUser?.city || storedUser?.cidade || DEFAULT_FORM.city,
          bio: storedUser?.bio || DEFAULT_FORM.bio,
        });

        setPreferences((current) => ({
          ...current,
          ...storedPreferences,
        }));

        setSecurity((current) => ({
          ...current,
          ...storedSecurity,
        }));

        setAvatarData(storedUser?.avatar || storedUser?.avatarUrl || storedUser?.photoURL || '');
      }
    })();
  }, [adminName]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleToggleSecurity = (name) => {
    setSecurity((current) => ({
      ...current,
      [name]: !current[name],
    }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({
      ...current,
      [name]: value,
    }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selecione uma imagem válida para a foto do perfil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarData(String(reader.result || ''));
      setAvatarFile(file);
      setSuccessMsg('Foto carregada. Clique em salvar para manter a atualização.');
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Nome e e-mail são obrigatórios para manter a conta consistente.');
      return;
    }
    const apiBase = process.env.API_FESTIVAL || process.env.REACT_APP_API_FESTIVAL || '';
    const token = localStorage.getItem('festivalAdminToken') || localStorage.getItem('token');

    // Build payloads
    const profilePayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      sector: formData.department.trim() || null,
      city: formData.city.trim() || null,
      bio: formData.bio.trim() || null,
      profile_photo_url: avatarData || null
    };

    const settingsPayload = {
      two_factor_enabled: Boolean(security.twoFactor),
      login_alerts: Boolean(security.loginAlerts),
      private_mode: Boolean(security.privateMode),
      theme: preferences.theme === 'escuro' ? 'dark' : 'light',
      language: preferences.language || 'pt-BR',
      compact_mode: Boolean(preferences.compactMode),
      email_notifications: Boolean(preferences.emailNotifications),
      session_alerts: Boolean(preferences.sessionAlerts),
      daily_summary: Boolean(preferences.dailySummary)
    };

    const passwordPayload = {
      current_password: passwordData.currentPassword.trim(),
      new_password: passwordData.newPassword.trim(),
      confirm_password: passwordData.confirmPassword.trim()
    };

    const wantsPasswordChange = Boolean(
      passwordPayload.current_password ||
      passwordPayload.new_password ||
      passwordPayload.confirm_password
    );

    if (wantsPasswordChange) {
      if (!passwordPayload.current_password || !passwordPayload.new_password || !passwordPayload.confirm_password) {
        setErrorMsg('Preencha a senha atual, a nova senha e a confirmação para alterar a senha.');
        return;
      }

      if (passwordPayload.new_password !== passwordPayload.confirm_password) {
        setErrorMsg('A confirmação da nova senha não confere.');
        return;
      }
    }

    if (!apiBase || !token) {
      // fallback to localStorage only
      const storedUser = safeParse(localStorage.getItem('festivalAdminUser')) || safeParse(localStorage.getItem('user')) || {};
      const updatedUser = {
        ...storedUser,
        name: profilePayload.name,
        nome: profilePayload.name,
        email: profilePayload.email,
        phone: profilePayload.phone,
        telefone: profilePayload.phone,
        role: formData.role,
        department: formData.department.trim(),
        city: profilePayload.city,
        bio: profilePayload.bio,
        avatar: profilePayload.profile_photo_url,
        avatarUrl: profilePayload.profile_photo_url,
        photoURL: profilePayload.profile_photo_url,
      };

      localStorage.setItem('festivalAdminUser', JSON.stringify(updatedUser));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('festivalAdminSettings', JSON.stringify(settingsPayload));
      localStorage.setItem('festivalAdminSecurity', JSON.stringify(security));
      localStorage.setItem('festivalAdminLastProfileUpdate', new Date().toISOString());

      setLastSavedAt(new Date().toLocaleString('pt-BR'));
      setSuccessMsg('Configurações salvas localmente (sem backend).');
      setErrorMsg('');
      return;
    }

    (async () => {
      try {
        // If user selected a new file, upload it first
        let finalProfilePhotoUrl = profilePayload.profile_photo_url || null;

        const uploadImage = async (fileToUpload) => {
          const formDataFile = new FormData();
          formDataFile.append('file', fileToUpload);
          const uploadResp = await axios.post(`${apiBase}/api/uploads/imagens`, formDataFile, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          // Backend returns both fileReference and fullUrl (complete URL)
          const fullUrl = uploadResp.data?.fullUrl || uploadResp.data?.fileReference;
          // Backend now returns complete URL
          return fullUrl;
        };

        // If we have a direct File from input
        if (avatarFile) {
          finalProfilePhotoUrl = await uploadImage(avatarFile);
        } else if (avatarData && typeof avatarData === 'string' && avatarData.startsWith('data:')) {
          // convert dataURL to blob and upload
          const res = await fetch(avatarData);
          const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'png';
          const fileName = `avatar.${ext}`;
          const fileObj = new File([blob], fileName, { type: blob.type });
          finalProfilePhotoUrl = await uploadImage(fileObj);
        }

        // Update profile payload with uploaded URL if available
        if (finalProfilePhotoUrl) {
          profilePayload.profile_photo_url = finalProfilePhotoUrl;
        }

        // Remove null/undefined fields to avoid express-validator treating them as present but invalid
        const sanitizedProfilePayload = Object.entries(profilePayload).reduce((acc, [k, v]) => {
          if (v !== null && v !== undefined) acc[k] = v;
          return acc;
        }, {});

        await axios.put(`${apiBase}/api/admin/profile`, sanitizedProfilePayload, { headers: { Authorization: `Bearer ${token}` } });
        await axios.put(`${apiBase}/api/admin/settings`, settingsPayload, { headers: { Authorization: `Bearer ${token}` } });

        if (wantsPasswordChange) {
          await axios.put(`${apiBase}/api/admin/password`, passwordPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // sync localStorage
        const mergedUser = { ...profilePayload, role: formData.role };
        localStorage.setItem('festivalAdminUser', JSON.stringify(mergedUser));
        localStorage.setItem('user', JSON.stringify(mergedUser));
        localStorage.setItem('festivalAdminSettings', JSON.stringify(settingsPayload));
        localStorage.setItem('festivalAdminSecurity', JSON.stringify(security));
        localStorage.setItem('festivalAdminLastProfileUpdate', new Date().toISOString());

        setAvatarFile(null);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setLastSavedAt(new Date().toLocaleString('pt-BR'));
        setSuccessMsg('Configurações da conta salvas com sucesso.');
        setErrorMsg('');
      } catch (error) {
        console.error('Erro ao salvar configurações:', error?.response || error?.message || error);
        setErrorMsg(error.response?.data?.message || 'Erro ao salvar no servidor.');
        setSuccessMsg('');
      }
    })();
  };

  const handleReset = () => {
    const storedUser = safeParse(localStorage.getItem('festivalAdminUser')) || safeParse(localStorage.getItem('user')) || {};

    setFormData({
      name: storedUser?.name || storedUser?.nome || adminName || DEFAULT_FORM.name,
      email: storedUser?.email || '',
      phone: storedUser?.phone || storedUser?.telefone || '',
      role: storedUser?.role || DEFAULT_FORM.role,
      department: storedUser?.department || DEFAULT_FORM.department,
      city: storedUser?.city || storedUser?.cidade || DEFAULT_FORM.city,
      bio: storedUser?.bio || DEFAULT_FORM.bio,
    });
    setPreferences(DEFAULT_PREFERENCES);
    setSecurity(DEFAULT_SECURITY);
    setAvatarFile(null);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarData(storedUser?.avatar || storedUser?.avatarUrl || storedUser?.photoURL || '');
    setSuccessMsg('Alterações descartadas.');
    setErrorMsg('');
  };

  return (
    <div className="festival-settings-page">
      <div className="festival-settings-hero">
        <div>
          <span className="festival-settings-eyebrow">Conta do administrador</span>
          <h2>Configurações da sua conta</h2>
          <p>
            Atualize seus dados de acesso, preferências de uso e políticas de segurança da área administrativa do festival.
          </p>
        </div>

        <div className="festival-settings-hero-card">
          <div className="festival-settings-avatar large">
            {avatarData ? (
              <img src={avatarData} alt={formData.name} />
            ) : (
              <span>{getAvatarFallback(formData.name)}</span>
            )}
          </div>
          <div>
            <strong>{formData.name}</strong>
            <p>{formData.role}</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="festival-settings-alert success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="festival-settings-alert error">
          <Shield size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form className="festival-settings-grid" onSubmit={handleSave}>
        <section className="festival-settings-card festival-settings-profile-card">
          <div className="festival-settings-card-header">
            <div>
              <h3>Perfil</h3>
              <p>Informações públicas e de contato da conta.</p>
            </div>
            <button type="button" className="festival-settings-ghost-btn" onClick={handleAvatarClick}>
              <Camera size={16} />
              Alterar foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="festival-settings-hidden-input"
            />
          </div>

          <div className="festival-settings-profile-top">
            <div className="festival-settings-avatar">
              {avatarData ? (
                <img src={avatarData} alt={formData.name} />
              ) : (
                <span>{getAvatarFallback(formData.name)}</span>
              )}
            </div>

            <div className="festival-settings-profile-meta">
              <strong>{formData.name}</strong>
              <span>{formData.email || 'Nenhum e-mail informado'}</span>
              <small>Última atualização: {lastSavedAt || 'Ainda não salva nesta sessão'}</small>
            </div>
          </div>

          <div className="festival-settings-form-grid">
            <label>
              <span><User size={14} /> Nome</span>
              <input name="name" value={formData.name} onChange={handleFieldChange} placeholder="Nome do administrador" />
            </label>

            <label>
              <span><Mail size={14} /> E-mail</span>
              <input name="email" type="email" value={formData.email} onChange={handleFieldChange} placeholder="email@festival.com" />
            </label>

            <label>
              <span><Smartphone size={14} /> Telefone</span>
              <input name="phone" value={formData.phone} onChange={handleFieldChange} placeholder="(00) 00000-0000" />
            </label>

            <label>
              <span><ShieldCheck size={14} /> Função</span>
              <input name="role" value={formData.role} onChange={handleFieldChange} placeholder="Administrador do Festival" />
            </label>

            <label>
              <span><Globe size={14} /> Setor</span>
              <input name="department" value={formData.department} onChange={handleFieldChange} placeholder="Coordenação geral" />
            </label>

            <label>
              <span><Globe size={14} /> Cidade</span>
              <input name="city" value={formData.city} onChange={handleFieldChange} placeholder="Cidade / Estado" />
            </label>
          </div>

          <label className="festival-settings-textarea-label">
            <span><CloudUpload size={14} /> Biografia da conta</span>
            <textarea
              name="bio"
              rows="4"
              value={formData.bio}
              onChange={handleFieldChange}
              placeholder="Resumo breve sobre o responsável pela conta"
            />
          </label>
        </section>

        <aside className="festival-settings-side-column">
          <section className="festival-settings-card">
            <div className="festival-settings-card-header simple">
              <div>
                <h3>Segurança</h3>
                <p>Controles de autenticação e proteção da conta.</p>
              </div>
              <Lock size={18} />
            </div>

            <div className="festival-settings-switch-list">

              <button type="button" className="festival-settings-switch-item" onClick={() => handleToggleSecurity('loginAlerts')}>
                <div>
                  <strong>Alertas de login</strong>
                  <span>Receba aviso quando uma nova sessão for iniciada.</span>
                </div>
                <span className={`festival-settings-switch ${security.loginAlerts ? 'on' : ''}`}>
                  <span />
                </span>
              </button>
            </div>
          </section>

          <section className="festival-settings-card">
            <div className="festival-settings-card-header simple">
              <div>
                <h3>Preferências</h3>
                <p>Personalize a forma como a área administrativa se comporta.</p>
              </div>
              <Palette size={18} />
            </div>

            <div className="festival-settings-preference-grid">
              <button type="button" className={`festival-settings-choice ${preferences.theme === 'claro' ? 'active' : ''}`} onClick={() => setPreferences((current) => ({ ...current, theme: 'claro' }))}>
                <SunMedium size={16} />
                Tema claro
              </button>
              <button type="button" className={`festival-settings-choice ${preferences.theme === 'escuro' ? 'active' : ''}`} onClick={() => setPreferences((current) => ({ ...current, theme: 'escuro' }))}>
                <Moon size={16} />
                Tema escuro
              </button>
            </div>
          </section>

          <section className="festival-settings-card">
            <div className="festival-settings-card-header simple">
              <div>
                <h3>Alterar senha</h3>
                <p>Use a senha atual para definir uma nova senha de acesso.</p>
              </div>
              <Lock size={18} />
            </div>

            <div className="festival-settings-form-grid password-grid">
              <label>
                <span><Lock size={14} /> Senha atual</span>
                <input
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Senha atual"
                  autoComplete="current-password"
                />
              </label>

              <label>
                <span><Lock size={14} /> Nova senha</span>
                <input
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nova senha"
                  autoComplete="new-password"
                />
              </label>

              <label className="password-full">
                <span><Lock size={14} /> Confirmar nova senha</span>
                <input
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                />
              </label>
            </div>

            <p className="password-helper">
              Se você preencher algum campo desta seção, a senha será alterada junto com o restante das configurações.
            </p>
          </section>

          <section className="festival-settings-actions-card">
            <button type="button" className="festival-settings-secondary-btn" onClick={handleReset}>
              Restaurar padrão
            </button>
            <button type="submit" className="festival-settings-primary-btn">
              <Save size={16} />
              Salvar alterações
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default ConfiguracoesAdmin;